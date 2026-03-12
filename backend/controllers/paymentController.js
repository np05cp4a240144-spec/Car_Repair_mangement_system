const axios = require('axios');
const prisma = require('../config/db');
const { sendPaymentReceivedEmail } = require('../utils/emailUtil');

// In-memory pending parts payments keyed by Khalti pidx
const pendingPartPayments = new Map();

const initiateKhaltiPayment = async (req, res) => {
    const { appointmentId, mode, items } = req.body;
    try {
        if (mode === 'parts') {
            const normalizedItems = Array.isArray(items)
                ? items
                    .map((item) => ({
                        partId: parseInt(item?.partId),
                        quantity: parseInt(item?.quantity)
                    }))
                    .filter((item) => Number.isFinite(item.partId) && Number.isFinite(item.quantity) && item.quantity > 0)
                : [];

            if (normalizedItems.length === 0) {
                return res.status(400).json({ error: 'Cart is empty or invalid' });
            }

            const partIds = [...new Set(normalizedItems.map((row) => row.partId))];
            const parts = await prisma.part.findMany({ where: { id: { in: partIds } } });
            const partMap = new Map(parts.map((part) => [part.id, part]));

            let totalAmount = 0;
            for (const row of normalizedItems) {
                const part = partMap.get(row.partId);
                if (!part) {
                    return res.status(404).json({ error: `Part #${row.partId} not found` });
                }
                if ((part.stock || 0) < row.quantity) {
                    return res.status(400).json({ error: `Insufficient stock for ${part.name}` });
                }
                totalAmount += (part.price || 0) * row.quantity;
            }

            if (totalAmount <= 0) {
                return res.status(400).json({ error: 'Payment amount must be greater than 0' });
            }

            const amountInPaisa = Math.round(totalAmount * 100);
            const buyer = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { name: true, email: true, phone: true }
            });

            const response = await axios.post(`${process.env.KHALTI_BASE_URL}/epayment/initiate/`, {
                return_url: `${process.env.FRONTEND_URL}/payment-success?mode=parts`,
                website_url: process.env.FRONTEND_URL,
                purchase_order_id: `parts_${Date.now()}_${req.user.id}`,
                purchase_order_name: `Parts Purchase by User #${req.user.id}`,
                amount: amountInPaisa,
                customer_info: {
                    name: buyer?.name || req.user.name || 'Customer',
                    email: buyer?.email || req.user.email,
                    phone: buyer?.phone || '9800000000'
                }
            }, {
                headers: {
                    'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.pidx) {
                pendingPartPayments.set(response.data.pidx, {
                    userId: req.user.id,
                    items: normalizedItems,
                    expectedAmount: amountInPaisa,
                    createdAt: Date.now()
                });
            }

            return res.json(response.data);
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: parseInt(appointmentId) },
            include: { 
                user: true,
                parts: { include: { part: true } },
                invoice: true
            }
        });

        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

        // Calculate amount (prefer invoice total, then appointment amount, then fallback to parts)
        let amount = 0;
        if (appointment.invoice) {
            amount = appointment.invoice.totalAmount;
        } else if (appointment.amount > 0) {
            amount = appointment.amount;
        } else {
            amount = appointment.parts.reduce((sum, jp) => sum + ((jp.part?.price || 0) * (jp.quantity || 1)), 0);
        }

        if (amount <= 0) return res.status(400).json({ error: 'Payment amount must be greater than 0' });

        const amountInPaisa = Math.round(amount * 100);

        const response = await axios.post(`${process.env.KHALTI_BASE_URL}/epayment/initiate/`, {
            return_url: `${process.env.FRONTEND_URL}/payment-success?appointmentId=${appointment.id}`,
            website_url: process.env.FRONTEND_URL,
            purchase_order_id: appointment.id.toString(),
            purchase_order_name: `Service Appointment #${appointment.id}`,
            amount: amountInPaisa,
            customer_info: {
                name: appointment.user.name || "Customer",
                email: appointment.user.email,
                phone: appointment.user.phone || "9800000000"
            }
        }, {
            headers: {
                'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Khalti Initiation Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to initiate payment', details: error.response?.data });
    }
};

const verifyKhaltiPayment = async (req, res) => {
    const { pidx, appointmentId, mode } = req.query;

    if (!pidx) {
        return res.status(400).json({ error: 'Missing pidx' });
    }

    try {
        const response = await axios.post(`${process.env.KHALTI_BASE_URL}/epayment/lookup/`, {
            pidx
        }, {
            headers: {
                'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.status === 'Completed' && mode === 'parts') {
            const pending = pendingPartPayments.get(pidx);
            if (!pending) {
                return res.status(400).json({ success: false, message: 'Parts payment session expired. Please try again.' });
            }

            if (Number(response.data.total_amount || 0) !== Number(pending.expectedAmount || 0)) {
                return res.status(400).json({ success: false, message: 'Amount mismatch during verification.' });
            }

            const stockResult = await prisma.$transaction(async (tx) => {
                const partIds = [...new Set(pending.items.map((row) => row.partId))];
                const parts = await tx.part.findMany({ where: { id: { in: partIds } } });
                const partMap = new Map(parts.map((part) => [part.id, part]));
                const updatedItems = [];

                for (const row of pending.items) {
                    const part = partMap.get(row.partId);
                    if (!part) {
                        throw new Error(`Part #${row.partId} not found`);
                    }
                    if ((part.stock || 0) < row.quantity) {
                        throw new Error(`Insufficient stock for ${part.name}`);
                    }

                    const newStock = (part.stock || 0) - row.quantity;
                    let nextStatus = 'OK';
                    if (newStock <= (part.minStock || 5)) nextStatus = 'Low';
                    if (newStock <= 2) nextStatus = 'Critical';

                    await tx.part.update({
                        where: { id: part.id },
                        data: {
                            stock: newStock,
                            status: nextStatus,
                            logs: {
                                create: {
                                    type: 'Stock Out',
                                    amount: row.quantity,
                                    notes: `Customer purchase via Khalti (pidx: ${pidx})`,
                                    userId: pending.userId
                                }
                            }
                        }
                    });

                    updatedItems.push({
                        partId: part.id,
                        name: part.name,
                        quantity: row.quantity,
                        stockAfter: newStock
                    });
                }

                return updatedItems;
            });

            pendingPartPayments.delete(pidx);

            try {
                const paidUser = await prisma.user.findUnique({
                    where: { id: pending.userId },
                    select: { email: true, name: true }
                });

                if (paidUser?.email) {
                    await sendPaymentReceivedEmail(
                        paidUser.email,
                        paidUser.name || 'Customer',
                        {
                            mode: 'parts',
                            amount: Number(response.data.total_amount || 0) / 100,
                            pidx
                        }
                    );
                }
            } catch (emailError) {
                console.error('Parts payment email send failed:', emailError.message);
            }

            return res.json({
                success: true,
                message: 'Parts payment verified and stock updated',
                mode: 'parts',
                items: stockResult,
                data: response.data
            });
        }

        if (response.data.status === 'Completed') {
            if (!appointmentId) {
                return res.status(400).json({ error: 'Missing appointmentId' });
            }

            // Update appointment status to paid
            const updatedAppointment = await prisma.appointment.update({
                where: { id: parseInt(appointmentId) },
                data: { isPaid: true },
                include: { user: true }
            });
            
            // Send payment confirmation email
            if (updatedAppointment?.user?.email) {
                try {
                    await sendPaymentReceivedEmail(
                        updatedAppointment.user.email,
                        updatedAppointment.user.name || 'Customer',
                        {
                            mode: 'appointment',
                            amount: Number(response.data.total_amount || 0) / 100,
                            pidx,
                            reference: response.data.transaction_id || pidx
                        }
                    );
                } catch (emailError) {
                    console.error('Appointment payment email send failed:', emailError.message);
                }
            }
            
            return res.json({ success: true, message: 'Payment verified and updated', data: response.data });
        }

        res.status(400).json({ success: false, message: 'Payment verification failed', status: response.data.status });
    } catch (error) {
        console.error('Khalti Verification Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to verify payment', details: error.response?.data });
    }
};

module.exports = { initiateKhaltiPayment, verifyKhaltiPayment };

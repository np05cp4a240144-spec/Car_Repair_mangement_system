const prisma = require('../config/db');
const { sendConfirmationEmail, sendUpdateEmail } = require('../utils/emailUtil');

const createBooking = async (req, res) => {
    const { service, time, vehicleId } = req.body;

    if (!service || !time || !vehicleId) {
        return res.status(400).json({ error: 'Please provide service, time, and vehicleId' });
    }

    try {
        // 1. Find all mechanics
        const mechanics = await prisma.user.findMany({
            where: { role: 'MECHANIC' },
            include: {
                mechanicAssignments: {
                    where: {
                        status: { in: ['Pending', 'In Progress'] }
                    }
                }
            }
        });

        if (mechanics.length === 0) {
            return res.status(400).json({ error: 'No mechanics available at the moment' });
        }

        // 2. Find the mechanic with the fewest assignments
        // Sort by assignment count
        const assignedMechanic = mechanics.sort((a, b) => 
            a.mechanicAssignments.length - b.mechanicAssignments.length
        )[0];

        // 3. Create the appointment
        const appointment = await prisma.appointment.create({
            data: {
                service,
                time,
                status: 'Pending',
                userId: req.user.id,
                vehicleId: parseInt(vehicleId),
                mechanicId: assignedMechanic.id
            },
            include: {
                mechanic: {
                    select: { name: true }
                },
                vehicle: true
            }
        });

        res.status(201).json({
            message: 'Booking successful',
            appointment
        });

        // Send confirmation email
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user && user.email) {
            sendConfirmationEmail(user.email, user.name || 'Customer', appointment);
        }

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Server error while creating booking' });
    }
};


const getCustomerBookings = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: { userId: req.user.id },
            include: {
                mechanic: {
                    select: { name: true, speciality: true }
                },
                vehicle: true,
                invoice: true,
                parts: { include: { part: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(appointments);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


const getMechanicJobs = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: { mechanicId: req.user.id },
            include: {
                user: {
                    select: { name: true, phone: true, email: true }
                },
                vehicle: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(appointments);
    } catch (error) {
        console.error('Error fetching mechanic jobs:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAllBookings = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            include: {
                user: {
                    select: { name: true, email: true }
                },
                mechanic: {
                    select: { name: true }
                },
                vehicle: true,
                invoice: true,
                parts: { include: { part: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(appointments);
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status, amount, mechanicId, progress, stage, isPaid, time, service, vehicleId } = req.body;

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: parseInt(id) }
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Check permissions
        if (req.user.role === 'USER' && appointment.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        if (req.user.role === 'MECHANIC' && appointment.mechanicId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const isCustomerRescheduleAttempt = req.user.role === 'USER' && (time !== undefined || service !== undefined || vehicleId !== undefined);
        if (isCustomerRescheduleAttempt && appointment.status !== 'Pending') {
            return res.status(400).json({ error: 'Only pending bookings can be rescheduled' });
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id: parseInt(id) },
            data: { 
                status: status || appointment.status,
                amount: amount !== undefined ? parseFloat(amount) : appointment.amount,
                mechanicId: mechanicId !== undefined ? (mechanicId ? parseInt(mechanicId) : null) : appointment.mechanicId,
                progress: progress !== undefined ? parseInt(progress) : appointment.progress,
                stage: stage || appointment.stage,
                isPaid: isPaid !== undefined ? Boolean(isPaid) : appointment.isPaid,
                time: time !== undefined ? String(time) : appointment.time,
                service: service !== undefined ? String(service) : appointment.service,
                vehicleId: vehicleId !== undefined ? parseInt(vehicleId) : appointment.vehicleId
            },
            include: {
                user: { select: { name: true } },
                mechanic: { select: { name: true } },
                vehicle: true,
                invoice: true,
                parts: { include: { part: true } }
            }
        });

        res.json(updatedAppointment);

        // Send update email if status or stage changed
        if ((status && status !== appointment.status) || (stage && stage !== appointment.stage)) {
            const user = updatedAppointment.user;
            if (user && user.email) {
                const updateMsg = `Status changed to: ${updatedAppointment.status}, Stage changed to: ${updatedAppointment.stage}`;
                sendUpdateEmail(user.email, user.name || 'Customer', updatedAppointment.service, updateMsg);
            }
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getRevenueStats = async (req, res) => {
    try {
        const now = new Date();
        const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayYear = new Date(now.getFullYear(), 0, 1);

        // 1. Fetch all completed appointments with parts
        const completedAppointments = await prisma.appointment.findMany({
            where: { status: 'Completed' },
            include: {
                mechanic: { select: { name: true } },
                parts: { include: { part: true } }
            }
        });

        // 2. Calculate Stats
        let totalRevenueMonth = 0;
        let totalRevenueYear = 0;
        const monthlyRevenue = new Array(12).fill(0);
        const serviceMap = {};
        const serviceMapMonth = {};
        const serviceMapYear = {};
        const mechanicMap = {};
        let partsRevenue = 0;

        completedAppointments.forEach(app => {
            const appDate = new Date(app.createdAt);
            const amount = app.amount || 0;

            // Sum all job part prices for this appointment
            let jobPartsTotal = 0;
            if (app.parts && app.parts.length > 0) {
                jobPartsTotal = app.parts.reduce((sum, jp) => sum + ((jp.priceAtTime || jp.part?.price || 0) * (jp.quantity || 1)), 0);
                partsRevenue += jobPartsTotal;
            }

            // Service Breakdown (all time)
            serviceMap[app.service] = (serviceMap[app.service] || 0) + amount;

            // Service Breakdown (this year)
            if (appDate.getFullYear() === now.getFullYear()) {
                serviceMapYear[app.service] = (serviceMapYear[app.service] || 0) + amount;
                totalRevenueYear += amount;
                monthlyRevenue[appDate.getMonth()] += amount;
                // Service Breakdown (this month)
                if (appDate.getMonth() === now.getMonth()) {
                    serviceMapMonth[app.service] = (serviceMapMonth[app.service] || 0) + amount;
                    totalRevenueMonth += amount;
                }
            }

            // Mechanic Performance
            if (app.mechanic) {
                if (!mechanicMap[app.mechanic.name]) {
                    mechanicMap[app.mechanic.name] = { revenue: 0, count: 0 };
                }
                mechanicMap[app.mechanic.name].revenue += amount;
                mechanicMap[app.mechanic.name].count += 1;
            }
        });

        const avgJobValue = completedAppointments.length > 0 ? totalRevenueYear / completedAppointments.length : 0;


        // Add 'Parts' to service breakdowns
        serviceMap['Parts'] = partsRevenue;
        serviceMapYear['Parts'] = partsRevenue; // If you want to include all job parts for the year
        serviceMapMonth['Parts'] = partsRevenue; // If you want to include all job parts for the month

        res.json({
            thisMonth: totalRevenueMonth,
            thisYear: totalRevenueYear,
            avgJobValue,
            monthlyRevenue, // Array of 12 values
            serviceBreakdown: Object.entries(serviceMap).map(([name, value]) => ({ name, value })),
            serviceBreakdownYear: Object.entries(serviceMapYear).map(([name, value]) => ({ name, value })),
            serviceBreakdownMonth: Object.entries(serviceMapMonth).map(([name, value]) => ({ name, value })),
            mechanicPerformance: Object.entries(mechanicMap).map(([name, stats]) => ({
                name,
                revenue: stats.revenue,
                jobs: stats.count,
                avg: stats.revenue / stats.count
            }))
        });

    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.appointment.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createBooking,
    getCustomerBookings,
    getMechanicJobs,
    getAllBookings,
    updateBookingStatus,
    deleteBooking,
    getRevenueStats
};

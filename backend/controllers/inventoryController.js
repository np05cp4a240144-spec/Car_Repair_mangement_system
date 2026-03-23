const prisma = require('../config/db');

// Get all inventory items
const getInventory = async (req, res) => {
    try {
        const parts = await prisma.part.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(parts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single part with its logs
const getPartDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const part = await prisma.part.findUnique({
            where: { id: parseInt(id) },
            include: {
                logs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });
        if (!part) return res.status(404).json({ error: "Part not found" });
        res.json(part);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get global inventory logs
const getInventoryLogs = async (req, res) => {
    try {
        const logs = await prisma.partLog.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                part: { select: { name: true, sku: true } }
            },
            take: 50
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add new part
const addPart = async (req, res) => {
    try {
        const { name, sku, category, stock, minStock, maxStock, unit, price } = req.body;
        
        const parsedStock = parseInt(stock);
        const parsedMinStock = minStock ? parseInt(minStock) : 5;
        const parsedMaxStock = maxStock ? parseInt(maxStock) : parsedStock * 2;
        
        let status = 'OK';
        if (parsedStock <= parsedMinStock) status = 'Low';
        if (parsedStock <= 2) status = 'Critical';

        const part = await prisma.part.create({
            data: {
                name,
                sku,
                category,
                price: parseFloat(price) || 0.0,
                stock: parsedStock,
                minStock: parsedMinStock,
                maxStock: parsedMaxStock,
                unit,
                status,
                logs: {
                    create: {
                        type: 'Manual Adjustment',
                        amount: parsedStock,
                        notes: 'Initial stock on creation',
                        userId: req.user?.id
                    }
                }
            }
        });
        res.status(201).json(part);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update stock level with logging
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, type, notes } = req.body; // type: "Stock In" or "Stock Out"
        
        const currentPart = await prisma.part.findUnique({ where: { id: parseInt(id) } });
        if (!currentPart) return res.status(404).json({ error: "Part not found" });

        const adjustment = parseInt(amount);
        let newStock = currentPart.stock;

        if (type === 'Stock In') {
            newStock += adjustment;
        } else if (type === 'Stock Out') {
            newStock -= adjustment;
        } else {
            newStock = adjustment; // Direct adjustment
        }

        let status = 'OK';
        if (newStock <= currentPart.minStock) status = 'Low';
        if (newStock <= 2) status = 'Critical';

        const part = await prisma.part.update({
            where: { id: parseInt(id) },
            data: { 
                stock: newStock,
                status,
                logs: {
                    create: {
                        type: type || 'Manual Adjustment',
                        amount: adjustment,
                        notes: notes || `Stock updated from ${currentPart.stock} to ${newStock}`,
                        userId: req.user?.id
                    }
                }
            }
        });
        res.json(part);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update part details
const updatePart = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, sku, category, minStock, maxStock, unit, price } = req.body;

        const part = await prisma.part.update({
            where: { id: parseInt(id) },
            data: {
                name,
                sku,
                category,
                price: price !== undefined ? parseFloat(price) : undefined,
                minStock: minStock !== undefined ? parseInt(minStock) : undefined,
                maxStock: maxStock !== undefined ? parseInt(maxStock) : undefined,
                unit
            }
        });
        res.json(part);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a restock request log entry (no stock mutation)
const requestRestock = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, notes } = req.body || {};

        const part = await prisma.part.findUnique({ where: { id: parseInt(id) } });
        if (!part) return res.status(404).json({ error: 'Part not found' });

        const requestedAmount = Number.isFinite(parseInt(amount)) && parseInt(amount) > 0
            ? parseInt(amount)
            : Math.max((part.maxStock || 0) - (part.stock || 0), 1);

        const log = await prisma.partLog.create({
            data: {
                partId: part.id,
                type: 'Restock Request',
                amount: requestedAmount,
                notes: notes || `Requested restock for ${part.name} (${part.sku})`,
                userId: req.user?.id
            }
        });

        res.status(201).json({
            message: 'Restock request submitted',
            request: log
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Customer purchase flow: buy parts directly without service appointment
const purchaseParts = async (req, res) => {
    try {
        const items = Array.isArray(req.body?.items) ? req.body.items : [];

        if (items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const normalizedItems = items
            .map((item) => ({
                partId: parseInt(item?.partId),
                quantity: parseInt(item?.quantity)
            }))
            .filter((item) => Number.isFinite(item.partId) && Number.isFinite(item.quantity) && item.quantity > 0);

        if (normalizedItems.length === 0) {
            return res.status(400).json({ error: 'Invalid cart items' });
        }

        const partIds = [...new Set(normalizedItems.map((item) => item.partId))];

        const result = await prisma.$transaction(async (tx) => {
            const parts = await tx.part.findMany({
                where: { id: { in: partIds } }
            });

            const partMap = new Map(parts.map((p) => [p.id, p]));
            const purchased = [];
            let grandTotal = 0;

            for (const row of normalizedItems) {
                const part = partMap.get(row.partId);
                if (!part) {
                    throw new Error(`Part #${row.partId} not found`);
                }

                if ((part.stock || 0) < row.quantity) {
                    throw new Error(`Insufficient stock for ${part.name}`);
                }

                const newStock = (part.stock || 0) - row.quantity;
                let status = 'OK';
                if (newStock <= (part.minStock || 5)) status = 'Low';
                if (newStock <= 2) status = 'Critical';

                await tx.part.update({
                    where: { id: part.id },
                    data: {
                        stock: newStock,
                        status,
                        logs: {
                            create: {
                                type: 'Stock Out',
                                amount: row.quantity,
                                notes: `Customer purchase by user #${req.user?.id || 'N/A'}`,
                                userId: req.user?.id
                            }
                        }
                    }
                });

                const lineTotal = (part.price || 0) * row.quantity;
                grandTotal += lineTotal;
                purchased.push({
                    partId: part.id,
                    name: part.name,
                    sku: part.sku,
                    quantity: row.quantity,
                    unitPrice: part.price || 0,
                    lineTotal,
                    stockAfter: newStock
                });
            }

            return {
                items: purchased,
                grandTotal
            };
        });

        res.status(201).json({
            message: 'Purchase successful',
            paid: true,
            totalAmount: result.grandTotal,
            items: result.items
        });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Purchase failed' });
    }
};

// Get total revenue from direct parts purchases
const getPartsSalesRevenue = async (req, res) => {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Find all Stock Out logs with 'Customer purchase' in notes
        const logs = await prisma.partLog.findMany({
            where: {
                type: 'Stock Out',
                notes: { contains: 'Customer purchase' }
            },
            include: { part: true }
        });

        let totalRevenue = 0;
        let totalRevenueMonth = 0;
        let totalRevenueYear = 0;
        const monthlyRevenue = new Array(12).fill(0);

        logs.forEach(log => {
            const price = log.part?.price || 0;
            const revenue = price * log.amount;
            totalRevenue += revenue;
            const logDate = new Date(log.createdAt);
            if (logDate.getFullYear() === currentYear) {
                totalRevenueYear += revenue;
                monthlyRevenue[logDate.getMonth()] += revenue;
                if (logDate.getMonth() === currentMonth) {
                    totalRevenueMonth += revenue;
                }
            }
        });

        res.json({
            totalRevenue,
            thisMonth: totalRevenueMonth,
            thisYear: totalRevenueYear,
            monthlyRevenue
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getInventory,
    getPartDetails,
    getInventoryLogs,
    addPart,
    updateStock,
    updatePart,
    requestRestock,
    purchaseParts,
    getPartsSalesRevenue
};

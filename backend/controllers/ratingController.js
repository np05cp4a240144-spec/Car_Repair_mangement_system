const prisma = require('../config/db');

const submitRating = async (req, res) => {
    try {
        const { ratingType, score, comment } = req.body;
        const customerId = req.user.id;

        if (!ratingType || !['ADMIN', 'SYSTEM'].includes(ratingType.toUpperCase())) {
            return res.status(400).json({ error: 'Invalid rating type. Must be ADMIN or SYSTEM.' });
        }

        const parsedScore = parseInt(score);
        if (!parsedScore || parsedScore < 1 || parsedScore > 5) {
            return res.status(400).json({ error: 'Score must be between 1 and 5.' });
        }

        const rating = await prisma.rating.create({
            data: {
                ratingType: ratingType.toUpperCase(),
                score: parsedScore,
                comment: comment ? String(comment).trim() : null,
                customerId
            }
        });

        res.status(201).json({ message: 'Rating submitted successfully', rating });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMyRatings = async (req, res) => {
    try {
        const customerId = req.user.id;
        const ratings = await prisma.rating.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllRatings = async (req, res) => {
    try {
        const { type } = req.query;
        const where = type && ['ADMIN', 'SYSTEM'].includes(type.toUpperCase())
            ? { ratingType: type.toUpperCase() }
            : {};

        const ratings = await prisma.rating.findMany({
            where,
            include: {
                customer: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRatingSummary = async (req, res) => {
    try {
        const [adminAgg, systemAgg, total] = await Promise.all([
            prisma.rating.aggregate({
                where: { ratingType: 'ADMIN' },
                _avg: { score: true },
                _count: { id: true }
            }),
            prisma.rating.aggregate({
                where: { ratingType: 'SYSTEM' },
                _avg: { score: true },
                _count: { id: true }
            }),
            prisma.rating.count()
        ]);

        res.json({
            admin: {
                average: adminAgg._avg.score ? parseFloat(adminAgg._avg.score.toFixed(1)) : 0,
                count: adminAgg._count.id
            },
            system: {
                average: systemAgg._avg.score ? parseFloat(systemAgg._avg.score.toFixed(1)) : 0,
                count: systemAgg._count.id
            },
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { submitRating, getMyRatings, getAllRatings, getRatingSummary };

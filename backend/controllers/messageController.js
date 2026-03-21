const prisma = require('../config/db');

const PAYMENT_SUPPORT_PREFIX = '__PAYMENT_SUPPORT__';
const PAYMENT_SUPPORT_WINDOW_MINUTES = Number(process.env.PAYMENT_SUPPORT_WINDOW_MINUTES || 30);

const buildSupportMetaContent = (meta) => `${PAYMENT_SUPPORT_PREFIX}${JSON.stringify(meta)}`;

const parseSupportMetaContent = (content) => {
    if (!content || !content.startsWith(PAYMENT_SUPPORT_PREFIX)) return null;
    try {
        return JSON.parse(content.slice(PAYMENT_SUPPORT_PREFIX.length));
    } catch {
        return null;
    }
};

const getLatestSupportMeta = async (customerId, adminId) => {
    const marker = await prisma.message.findFirst({
        where: {
            senderId: adminId,
            receiverId: customerId,
            content: { startsWith: PAYMENT_SUPPORT_PREFIX }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!marker) return null;
    return parseSupportMetaContent(marker.content);
};

const getSupportWindowStatus = (meta) => {
    if (!meta) {
        return { canMessage: false, reason: 'not_started' };
    }

    if (meta.status === 'SOLVED') {
        return {
            canMessage: false,
            reason: 'solved',
            expiresAt: meta.expiresAt || null,
            resolvedAt: meta.resolvedAt || null
        };
    }

    const expiresAt = meta.expiresAt ? new Date(meta.expiresAt) : null;
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
        return { canMessage: false, reason: 'invalid_session' };
    }

    if (expiresAt.getTime() < Date.now()) {
        return {
            canMessage: false,
            reason: 'expired',
            expiresAt: expiresAt.toISOString()
        };
    }

    return {
        canMessage: true,
        reason: 'active',
        expiresAt: expiresAt.toISOString()
    };
};

const createSupportMarker = async ({ adminId, customerId, status, pidx, amount, mode, expiresAt, resolvedAt }) => {
    const marker = {
        type: 'PAYMENT_SUPPORT',
        status,
        pidx: pidx || null,
        amount: amount || null,
        mode: mode || null,
        expiresAt: expiresAt || null,
        resolvedAt: resolvedAt || null,
        createdAt: new Date().toISOString()
    };

    await prisma.message.create({
        data: {
            senderId: adminId,
            receiverId: customerId,
            content: buildSupportMetaContent(marker)
        }
    });
};

const buildSupportReply = ({ content = '', pidx, amount, mode }) => {
    const lowered = String(content || '').toLowerCase();
    const refs = [];
    if (pidx) refs.push(`Reference: ${String(pidx).slice(0, 12)}...`);
    if (amount) refs.push(`Amount: NPR ${Number(amount).toLocaleString()}`);
    if (mode) refs.push(`Type: ${mode}`);

    if (lowered.includes('deduct') || lowered.includes('charged')) {
        return `AI Support: We understand your concern. If money was deducted but status is failed, do not retry immediately. We will verify the transaction with Khalti and update you shortly. ${refs.join(' | ')}`;
    }

    if (lowered.includes('retry') || lowered.includes('again')) {
        return `AI Support: Please retry once after 2-3 minutes using a stable network. If it fails again, keep the transaction reference and we will escalate to admin support. ${refs.join(' | ')}`;
    }

    return `AI Support: We have logged your payment-failure request and informed admin support. Please share screenshot/reference if available so we can resolve faster. ${refs.join(' | ')}`;
};

const getMessages = async (req, res) => {
    const { appointmentId, otherUserId } = req.query;
    const userId = req.user.id;

    try {
        let messages;

        if (appointmentId) {
            messages = await prisma.message.findMany({
                where: {
                    appointmentId: parseInt(appointmentId),
                    NOT: { content: { startsWith: PAYMENT_SUPPORT_PREFIX } }
                },
                orderBy: {
                    createdAt: 'asc',
                },
                include: {
                    sender: { select: { id: true, name: true, role: true } },
                    receiver: { select: { id: true, name: true, role: true } }
                }
            });
        } else if (otherUserId) {
            await prisma.message.updateMany({
                where: {
                    senderId: parseInt(otherUserId),
                    receiverId: userId,
                    read: false
                },
                data: {
                    read: true
                }
            });

            messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: userId, receiverId: parseInt(otherUserId) },
                        { senderId: parseInt(otherUserId), receiverId: userId },
                    ],
                    NOT: { content: { startsWith: PAYMENT_SUPPORT_PREFIX } }
                },
                orderBy: {
                    createdAt: 'asc',
                },
                include: {
                    sender: { select: { id: true, name: true, role: true } },
                    receiver: { select: { id: true, name: true, role: true } }
                }
            });
        } else {
            return res.status(400).json({ error: 'Appointment ID or Other User ID is required' });
        }

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

const getRecentChats = async (req, res) => {
    const userId = req.user.id;

    try {
       
        const messages = await prisma.message.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
                NOT: { content: { startsWith: PAYMENT_SUPPORT_PREFIX } }
            },
            orderBy: {
                createdAt: 'desc',
            },
            distinct: ['senderId', 'receiverId'], 
            include: {
                sender: { select: { id: true, name: true, role: true } },
                receiver: { select: { id: true, name: true, role: true } },
            }
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching recent chats:', error);
        res.status(500).json({ error: 'Failed to fetch recent chats' });
    }
};

const getUnreadMessageCount = async (req, res) => {
    const userId = req.user.id;

    try {
        const unread = await prisma.message.count({
            where: {
                receiverId: userId,
                read: false
            }
        });

        res.json({ unreadCount: unread });
    } catch (error) {
        console.error('Error fetching unread message count:', error);
        res.status(500).json({ error: 'Failed to fetch unread message count' });
    }
};

const markConversationRead = async (req, res) => {
    const userId = req.user.id;
    const { otherUserId } = req.body || {};

    const parsedOtherUserId = parseInt(otherUserId);
    if (!Number.isFinite(parsedOtherUserId)) {
        return res.status(400).json({ error: 'otherUserId is required' });
    }

    try {
        const result = await prisma.message.updateMany({
            where: {
                senderId: parsedOtherUserId,
                receiverId: userId,
                read: false
            },
            data: {
                read: true
            }
        });

        res.json({ updated: result.count });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
};

const startPaymentSupport = async (req, res) => {
    const userId = req.user.id;
    const { pidx, amount, appointmentId, mode } = req.body || {};

    if (req.user.role !== 'USER') {
        return res.status(403).json({ error: 'Only customers can start payment support chat' });
    }

    if (!pidx || !String(pidx).trim()) {
        return res.status(400).json({ error: 'Payment reference (pidx) is required for payment support' });
    }

    try {
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            orderBy: { id: 'asc' }
        });

        if (!adminUser) {
            return res.status(404).json({ error: 'No admin account available for support' });
        }

        const normalizedPidx = String(pidx).trim();
        const latestSupportMeta = await getLatestSupportMeta(userId, adminUser.id);
        const latestSupportWindow = getSupportWindowStatus(latestSupportMeta);

        if (
            latestSupportMeta?.pidx &&
            String(latestSupportMeta.pidx) === normalizedPidx &&
            !latestSupportWindow.canMessage
        ) {
            return res.status(403).json({
                error: 'This payment issue is already closed. You can message admin again only after a new payment failure.',
                supportWindow: {
                    canMessage: false,
                    reason: 'awaiting_new_failure'
                }
            });
        }

        if (
            latestSupportMeta?.pidx &&
            String(latestSupportMeta.pidx) === normalizedPidx &&
            latestSupportWindow.canMessage
        ) {
            return res.status(200).json({
                adminId: adminUser.id,
                supportWindow: latestSupportWindow,
                messages: []
            });
        }

        const expiresAt = new Date(Date.now() + PAYMENT_SUPPORT_WINDOW_MINUTES * 60 * 1000);
        await createSupportMarker({
            adminId: adminUser.id,
            customerId: userId,
            status: 'OPEN',
            pidx: normalizedPidx,
            amount,
            mode,
            expiresAt: expiresAt.toISOString()
        });

        const customerMsg = `Payment failed. I need help.${normalizedPidx ? ` Ref: ${normalizedPidx}` : ''}${amount ? ` Amount: NPR ${amount}` : ''}${appointmentId ? ` Appointment: ${appointmentId}` : ''}`;

        const createdCustomerMsg = await prisma.message.create({
            data: {
                senderId: userId,
                receiverId: adminUser.id,
                content: customerMsg
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
                receiver: { select: { id: true, name: true, role: true } }
            }
        });

        const aiReply = buildSupportReply({ content: customerMsg, pidx: normalizedPidx, amount, mode });
        const createdAiReply = await prisma.message.create({
            data: {
                senderId: adminUser.id,
                receiverId: userId,
                content: aiReply
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
                receiver: { select: { id: true, name: true, role: true } }
            }
        });

        res.status(201).json({
            adminId: adminUser.id,
            supportWindow: {
                canMessage: true,
                reason: 'active',
                expiresAt: expiresAt.toISOString()
            },
            messages: [createdCustomerMsg, createdAiReply]
        });
    } catch (error) {
        console.error('Error starting payment support:', error);
        res.status(500).json({ error: 'Failed to start payment support chat' });
    }
};

const sendPaymentSupportMessage = async (req, res) => {
    const userId = req.user.id;
    const { adminId, content, pidx, amount, mode } = req.body || {};

    if (req.user.role !== 'USER') {
        return res.status(403).json({ error: 'Only customers can send payment support messages' });
    }

    const parsedAdminId = parseInt(adminId);
    if (!Number.isFinite(parsedAdminId) || !content?.trim()) {
        return res.status(400).json({ error: 'adminId and content are required' });
    }

    try {
        const adminUser = await prisma.user.findUnique({ where: { id: parsedAdminId } });
        if (!adminUser || adminUser.role !== 'ADMIN') {
            return res.status(404).json({ error: 'Support admin not found' });
        }

        const supportMeta = await getLatestSupportMeta(userId, parsedAdminId);
        const supportStatus = getSupportWindowStatus(supportMeta);
        if (!supportStatus.canMessage) {
            return res.status(403).json({
                error: 'Payment support window is closed',
                supportWindow: supportStatus
            });
        }

        const userMessage = await prisma.message.create({
            data: {
                senderId: userId,
                receiverId: parsedAdminId,
                content: content.trim()
            },
            include: {
                sender: { select: { id: true, name: true } },
                receiver: { select: { id: true, name: true } }
            }
        });

        const aiReply = await prisma.message.create({
            data: {
                senderId: parsedAdminId,
                receiverId: userId,
                content: buildSupportReply({ content, pidx, amount, mode })
            },
            include: {
                sender: { select: { id: true, name: true } },
                receiver: { select: { id: true, name: true } }
            }
        });

        res.status(201).json({ messages: [userMessage, aiReply] });
    } catch (error) {
        console.error('Error sending payment support message:', error);
        res.status(500).json({ error: 'Failed to send support message' });
    }
};

const getPaymentSupportStatus = async (req, res) => {
    const currentUserId = req.user.id;
    const currentRole = req.user.role;
    const { adminId, customerId } = req.query || {};

    try {
        let resolvedCustomerId;
        let resolvedAdminId;

        if (currentRole === 'USER') {
            const parsedAdminId = parseInt(adminId);
            if (!Number.isFinite(parsedAdminId)) {
                return res.status(400).json({ error: 'adminId is required' });
            }
            resolvedCustomerId = currentUserId;
            resolvedAdminId = parsedAdminId;
        } else if (currentRole === 'ADMIN') {
            const parsedCustomerId = parseInt(customerId);
            if (!Number.isFinite(parsedCustomerId)) {
                return res.status(400).json({ error: 'customerId is required' });
            }
            resolvedCustomerId = parsedCustomerId;
            resolvedAdminId = currentUserId;
        } else {
            return res.status(403).json({ error: 'Not authorized for payment support status' });
        }

        const supportMeta = await getLatestSupportMeta(resolvedCustomerId, resolvedAdminId);
        const supportWindow = getSupportWindowStatus(supportMeta);
        return res.json({ supportWindow });
    } catch (error) {
        console.error('Error fetching payment support status:', error);
        return res.status(500).json({ error: 'Failed to fetch payment support status' });
    }
};

const markPaymentSupportSolved = async (req, res) => {
    const adminId = req.user.id;
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only admins can mark payment support solved' });
    }

    const { customerId } = req.body || {};
    const parsedCustomerId = parseInt(customerId);
    if (!Number.isFinite(parsedCustomerId)) {
        return res.status(400).json({ error: 'customerId is required' });
    }

    try {
        await createSupportMarker({
            adminId,
            customerId: parsedCustomerId,
            status: 'SOLVED',
            resolvedAt: new Date().toISOString(),
            expiresAt: new Date().toISOString()
        });

        await prisma.message.create({
            data: {
                senderId: adminId,
                receiverId: parsedCustomerId,
                content: 'Your payment issue has been marked as solved by admin support.'
            }
        });

        return res.json({
            message: 'Payment support marked as solved',
            supportWindow: { canMessage: false, reason: 'solved' }
        });
    } catch (error) {
        console.error('Error marking payment support solved:', error);
        return res.status(500).json({ error: 'Failed to mark payment support solved' });
    }
};

module.exports = {
    getMessages,
    getRecentChats,
    getUnreadMessageCount,
    markConversationRead,
    startPaymentSupport,
    sendPaymentSupportMessage,
    getPaymentSupportStatus,
    markPaymentSupportSolved
};

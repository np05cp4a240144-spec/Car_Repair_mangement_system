const prisma = require('../config/db');

let io;

const initSocket = (socketIo) => {
    io = socketIo;

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room: ${roomId}`);
        });

        socket.on('send_message', async (data) => {
            const { senderId, receiverId, content, appointmentId } = data;

            try {
                const [sender, receiver] = await Promise.all([
                    prisma.user.findUnique({ where: { id: parseInt(senderId) }, select: { id: true, role: true } }),
                    prisma.user.findUnique({ where: { id: parseInt(receiverId) }, select: { id: true, role: true } })
                ]);

                if (sender?.role === 'USER' && receiver?.role === 'ADMIN') {
                    socket.emit('error', { message: 'Direct customer-to-admin chat is restricted. Use payment support flow for failed payments.' });
                    return;
                }

                const newMessage = await prisma.message.create({
                    data: {
                        content,
                        senderId: parseInt(senderId),
                        receiverId: parseInt(receiverId),
                        appointmentId: appointmentId ? parseInt(appointmentId) : null,
                    },
                    include: {
                        sender: {
                            select: { id: true, name: true }
                        }
                    }
                });

                const roomId = appointmentId ? `appointment_${appointmentId}` : `user_${receiverId}`;
                io.to(roomId).emit('receive_message', newMessage);

            } catch (error) {
                console.error('Error saving message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIO };

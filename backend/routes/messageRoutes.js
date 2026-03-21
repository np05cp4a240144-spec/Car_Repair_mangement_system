const express = require('express');
const router = express.Router();
const {
	getMessages,
	getRecentChats,
	getUnreadMessageCount,
	markConversationRead,
	startPaymentSupport,
	sendPaymentSupportMessage,
	getPaymentSupportStatus,
	markPaymentSupportSolved
} = require('../controllers/messageController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getMessages);
router.get('/recent', protect, getRecentChats);
router.get('/unread-count', protect, getUnreadMessageCount);
router.patch('/read', protect, markConversationRead);
router.post('/payment-support/start', protect, startPaymentSupport);
router.post('/payment-support/send', protect, sendPaymentSupportMessage);
router.get('/payment-support/status', protect, getPaymentSupportStatus);
router.patch('/payment-support/solve', protect, admin, markPaymentSupportSolved);

module.exports = router;

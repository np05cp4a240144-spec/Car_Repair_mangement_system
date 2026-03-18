const express = require('express');
const router = express.Router();
const { getInventory, getPartDetails, getInventoryLogs, addPart, updateStock, updatePart, requestRestock, purchaseParts, getPartsSalesRevenue } = require('../controllers/inventoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getInventory);
router.post('/purchase', protect, purchaseParts);
router.get('/logs', protect, getInventoryLogs);
// Get total revenue from direct parts sales
router.get('/sales/revenue', protect, getPartsSalesRevenue);
router.get('/:id', protect, getPartDetails);
router.post('/', protect, admin, addPart);
router.post('/:id/request', protect, requestRestock);
router.put('/:id', protect, admin, updatePart);
router.put('/:id/stock', protect, admin, updateStock);

module.exports = router;

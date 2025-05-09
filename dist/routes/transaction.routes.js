"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const transactions_controller_1 = require("../controllers/transactions.controller");
const router = (0, express_1.Router)();
// All transaction routes require authentication
router.use(auth_1.authenticateToken);
router.get('/', transactions_controller_1.getTransactions);
router.post('/', transactions_controller_1.createTransaction);
router.put('/:id', transactions_controller_1.updateTransaction);
router.delete('/:id', transactions_controller_1.deleteTransaction);
exports.default = router;

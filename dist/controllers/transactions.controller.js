"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTransaction = exports.updateTransaction = exports.createTransaction = exports.getTransactions = void 0;
const database_1 = __importDefault(require("../config/database"));
const getTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { startDate, endDate, type } = req.query;
        let query = 'SELECT t.*, e.name as employee_name FROM transactions t LEFT JOIN employees e ON t.employee_id = e.id WHERE t.user_id = $1';
        const params = [userId];
        if (startDate) {
            query += ' AND t.date >= $' + (params.length + 1);
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND t.date <= $' + (params.length + 1);
            params.push(endDate);
        }
        if (type) {
            query += ' AND t.transaction_type = $' + (params.length + 1);
            params.push(type);
        }
        query += ' ORDER BY t.date DESC';
        const result = yield database_1.default.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});
exports.getTransactions = getTransactions;
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield database_1.default.connect();
    try {
        yield client.query('BEGIN');
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { type, amount, date, description, company_name, employee_id } = req.body;
        // Insert the transaction
        const transactionResult = yield client.query('INSERT INTO transactions (user_id, transaction_type, amount, date, description, company_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [userId, type, amount, date, description, company_name]);
        // Calculate balance adjustment based on transaction type
        const adjustment = (type === 'HR' || type === 'purchase') ? -amount : amount;
        // Update company balance
        yield client.query(`INSERT INTO company_balance (amount) 
             SELECT (COALESCE((SELECT amount FROM company_balance ORDER BY id DESC LIMIT 1), 0) + $1::numeric)`, [adjustment]);
        yield client.query('COMMIT');
        res.status(201).json({ id: transactionResult.rows[0].id });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.log("Error creating transaction:", error);
        res.status(500).json({ message: 'Error creating transaction' });
    }
    finally {
        client.release();
    }
});
exports.createTransaction = createTransaction;
const updateTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield database_1.default.connect();
    try {
        yield client.query('BEGIN');
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const transactionId = req.params.id;
        const { type, amount, date, description, company_name, employee_id } = req.body;
        // Get the old transaction to calculate balance adjustment
        const oldTransaction = yield client.query('SELECT type, amount FROM transactions WHERE id = $1 AND user_id = $2', [transactionId, userId]);
        if (oldTransaction.rowCount === 0) {
            throw new Error('Transaction not found');
        }
        // Calculate balance adjustment
        const oldBalanceImpact = (oldTransaction.rows[0].type === 'HR' || oldTransaction.rows[0].type === 'purchase')
            ? -oldTransaction.rows[0].amount
            : oldTransaction.rows[0].amount;
        const newBalanceImpact = (type === 'HR' || type === 'purchase') ? -amount : amount;
        const balanceAdjustment = newBalanceImpact - oldBalanceImpact;
        // Update the transaction
        yield client.query('UPDATE transactions SET type = $1, amount = $2, date = $3, description = $4, company_name = $5, employee_id = $6 WHERE id = $7 AND user_id = $8', [type, amount, date, description, company_name, employee_id, transactionId, userId]);
        // Update company balance
        yield client.query(`INSERT INTO company_balance (amount) 
             SELECT (COALESCE((SELECT amount FROM company_balance ORDER BY id DESC LIMIT 1), 0) + $1::numeric)`, [balanceAdjustment]);
        yield client.query('COMMIT');
        res.json({ message: 'Transaction updated' });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        if (error instanceof Error && error.message === 'Transaction not found') {
            res.status(404).json({ message: 'Transaction not found' });
        }
        else {
            res.status(500).json({ message: 'Error updating transaction' });
        }
    }
    finally {
        client.release();
    }
});
exports.updateTransaction = updateTransaction;
const deleteTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const client = yield database_1.default.connect();
    try {
        yield client.query('BEGIN');
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const transactionId = req.params.id;
        // Get the transaction to calculate balance adjustment
        const transaction = yield client.query('SELECT type, amount FROM transactions WHERE id = $1 AND user_id = $2', [transactionId, userId]);
        if (transaction.rowCount === 0) {
            throw new Error('Transaction not found');
        }
        // Calculate balance adjustment
        const balanceAdjustment = (transaction.rows[0].type === 'HR' || transaction.rows[0].type === 'purchase')
            ? transaction.rows[0].amount
            : -transaction.rows[0].amount;
        // Delete the transaction
        yield client.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [transactionId, userId]);
        // Update company balance
        yield client.query(`INSERT INTO company_balance (amount) 
             SELECT (COALESCE((SELECT amount FROM company_balance ORDER BY id DESC LIMIT 1), 0) + $1::numeric)`, [balanceAdjustment]);
        yield client.query('COMMIT');
        res.json({ message: 'Transaction deleted' });
    }
    catch (error) {
        yield client.query('ROLLBACK');
        if (error instanceof Error && error.message === 'Transaction not found') {
            res.status(404).json({ message: 'Transaction not found' });
        }
        else {
            res.status(500).json({ message: 'Error deleting transaction' });
        }
    }
    finally {
        client.release();
    }
});
exports.deleteTransaction = deleteTransaction;

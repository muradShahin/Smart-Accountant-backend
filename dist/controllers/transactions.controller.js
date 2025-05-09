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
        const result = yield database_1.default.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});
exports.getTransactions = getTransactions;
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { type, amount, date, category, notes } = req.body;
        const result = yield database_1.default.query('INSERT INTO transactions (user_id, type, amount, date, category, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [userId, type, amount, date, category, notes]);
        res.status(201).json({ id: result.rows[0].id });
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating transaction' });
    }
});
exports.createTransaction = createTransaction;
const updateTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const transactionId = req.params.id;
        const { type, amount, date, category, notes } = req.body;
        const result = yield database_1.default.query('UPDATE transactions SET type = $1, amount = $2, date = $3, category = $4, notes = $5 WHERE id = $6 AND user_id = $7 RETURNING id', [type, amount, date, category, notes, transactionId, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.json({ message: 'Transaction updated' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating transaction' });
    }
});
exports.updateTransaction = updateTransaction;
const deleteTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const transactionId = req.params.id;
        const result = yield database_1.default.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [transactionId, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting transaction' });
    }
});
exports.deleteTransaction = deleteTransaction;

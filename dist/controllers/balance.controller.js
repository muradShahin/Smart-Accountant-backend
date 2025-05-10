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
exports.updateCompanyBalance = exports.getCompanyBalance = void 0;
const database_1 = __importDefault(require("../config/database"));
const getCompanyBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const result = yield database_1.default.query('SELECT amount FROM company_balance ORDER BY id DESC LIMIT 1');
        res.json({ balance: ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.amount) || 0 });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching company balance' });
    }
});
exports.getCompanyBalance = getCompanyBalance;
const updateCompanyBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount } = req.body;
        const result = yield database_1.default.query('INSERT INTO company_balance (amount) VALUES ($1) RETURNING amount', [amount]);
        res.json({ balance: result.rows[0].amount });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating company balance' });
    }
});
exports.updateCompanyBalance = updateCompanyBalance;

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
exports.getEmployeeCurrentBalance = exports.getEmployeeAttendance = exports.recordAttendance = exports.addEmployeeTransaction = exports.getEmployeeTransactions = exports.createEmployee = exports.getAllEmployees = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllEmployees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.default.query('SELECT * FROM employees ORDER BY name');
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching employees' });
    }
});
exports.getAllEmployees = getAllEmployees;
const createEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, hire_date, base_salary, position } = req.body;
        const result = yield database_1.default.query('INSERT INTO employees (name, email, hire_date, base_salary, position) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, email, hire_date, base_salary, position]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Error creating employee' });
    }
});
exports.createEmployee = createEmployee;
const getEmployeeTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employeeId = req.params.id;
        const result = yield database_1.default.query('SELECT * FROM employee_transactions WHERE employee_id = $1 ORDER BY date DESC', [employeeId]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching employee transactions' });
    }
});
exports.getEmployeeTransactions = getEmployeeTransactions;
const addEmployeeTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employeeId = req.params.id;
        const { type, amount, date, description } = req.body;
        const result = yield database_1.default.query('INSERT INTO employee_transactions (employee_id, type, amount, date, description) VALUES ($1, $2, $3, $4, $5) RETURNING *', [employeeId, type, amount, date, description]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding employee transaction' });
    }
});
exports.addEmployeeTransaction = addEmployeeTransaction;
const recordAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employee_id, date, check_in, check_out, overtime_hours, overtime_rate, notes } = req.body;
        const result = yield database_1.default.query('INSERT INTO attendance (employee_id, date, check_in, check_out, overtime_hours, overtime_rate, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [employee_id, date, check_in, check_out, overtime_hours, overtime_rate, notes]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: 'Error recording attendance' });
    }
});
exports.recordAttendance = recordAttendance;
const getEmployeeAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employeeId = req.params.id;
        const result = yield database_1.default.query('SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC', [employeeId]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching employee attendance' });
    }
});
exports.getEmployeeAttendance = getEmployeeAttendance;
const getEmployeeCurrentBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employeeId = req.params.id;
        // Get employee base salary
        const employeeResult = yield database_1.default.query('SELECT base_salary FROM employees WHERE id = $1', [employeeId]);
        if (employeeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        const baseSalary = employeeResult.rows[0].base_salary;
        // Get sum of all transactions
        const transactionsResult = yield database_1.default.query(`SELECT 
                COALESCE(SUM(CASE WHEN type = 'advance' THEN -amount
                               WHEN type = 'deduction' THEN -amount
                               WHEN type = 'overtime' THEN amount
                               ELSE 0 END), 0) as balance
            FROM employee_transactions
            WHERE employee_id = $1`, [employeeId]);
        const transactionBalance = transactionsResult.rows[0].balance;
        const currentBalance = baseSalary + transactionBalance;
        res.json({
            base_salary: baseSalary,
            transaction_balance: transactionBalance,
            current_balance: currentBalance
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error calculating employee balance' });
    }
});
exports.getEmployeeCurrentBalance = getEmployeeCurrentBalance;

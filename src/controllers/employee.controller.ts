import { Request, Response } from 'express';
import pool from '../config/database';
import { Employee, EmployeeTransaction, Attendance } from '../models/types';

export const getAllEmployees = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT * FROM employees ORDER BY name'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employees' });
    }
};

export const createEmployee = async (req: Request, res: Response) => {
    try {
        const { name, email, hire_date, base_salary, position }: Employee = req.body;
        
        const result = await pool.query(
            'INSERT INTO employees (name, email, hire_date, base_salary, position) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, email, hire_date, base_salary, position]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Error creating employee' });
    }
};

export const getEmployeeTransactions = async (req: Request, res: Response) => {
    try {
        const employeeId = req.params.id;
        const result = await pool.query(
            'SELECT * FROM employee_transactions WHERE employee_id = $1 ORDER BY date DESC',
            [employeeId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employee transactions' });
    }
};

export const addEmployeeTransaction = async (req: Request, res: Response) => {
    try {
        const employeeId = req.params.id;
        const { type, amount, date, description }: EmployeeTransaction = req.body;
        
        const result = await pool.query(
            'INSERT INTO employee_transactions (employee_id, type, amount, date, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [employeeId, type, amount, date, description]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error adding employee transaction' });
    }
};

export const recordAttendance = async (req: Request, res: Response) => {
    try {
        const { employee_id, date, check_in, check_out, overtime_hours, overtime_rate, notes }: Attendance = req.body;
        
        const result = await pool.query(
            'INSERT INTO attendance (employee_id, date, check_in, check_out, overtime_hours, overtime_rate, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [employee_id, date, check_in, check_out, overtime_hours, overtime_rate, notes]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error recording attendance' });
    }
};

export const getEmployeeAttendance = async (req: Request, res: Response) => {
    try {
        const employeeId = req.params.id;
        const result = await pool.query(
            'SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC',
            [employeeId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employee attendance' });
    }
};

export const getEmployeeCurrentBalance = async (req: Request, res: Response) => {
    try {
        const employeeId = req.params.id;
        
        // Get employee base salary
        const employeeResult = await pool.query(
            'SELECT base_salary FROM employees WHERE id = $1',
            [employeeId]
        );
        
        if (employeeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        const baseSalary = employeeResult.rows[0].base_salary;
        
        // Get sum of all transactions
        const transactionsResult = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'advance' THEN -amount
                               WHEN type = 'deduction' THEN -amount
                               WHEN type = 'overtime' THEN amount
                               ELSE 0 END), 0) as balance
            FROM employee_transactions
            WHERE employee_id = $1`,
            [employeeId]
        );
        
        const transactionBalance = transactionsResult.rows[0].balance;
        const currentBalance = baseSalary + transactionBalance;
        
        res.json({
            base_salary: baseSalary,
            transaction_balance: transactionBalance,
            current_balance: currentBalance
        });
    } catch (error) {
        res.status(500).json({ message: 'Error calculating employee balance' });
    }
};
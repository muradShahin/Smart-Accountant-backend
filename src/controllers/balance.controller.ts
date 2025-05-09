import { Request, Response } from 'express';
import pool from '../config/database';

export const getCompanyBalance = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT amount FROM company_balance ORDER BY id DESC LIMIT 1');
        res.json({ balance: result.rows[0]?.amount || 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching company balance' });
    }
};

export const updateCompanyBalance = async (req: Request, res: Response) => {
    try {
        const { amount } = req.body;
        const result = await pool.query(
            'INSERT INTO company_balance (amount) VALUES ($1) RETURNING amount',
            [amount]
        );
        res.json({ balance: result.rows[0].amount });
    } catch (error) {
        res.status(500).json({ message: 'Error updating company balance' });
    }
};
import { Request, Response } from 'express';
import pool from '../config/database';

interface AuthRequest extends Request {
    user?: { id: number; email: string };
}

interface Transaction {
    type: 'HR' | 'purchase' | 'sales' | 'other_income';
    amount: number;
    date: string;
    description: string;
    company_name?: string;
    employee_id?: number;
}

export const getTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
        const offset = (page - 1) * limit;

        // Parse query parameters
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const type = req.query.transaction_type as string;
        const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
        
        // Build the base query parts
        const selectClause = `
            SELECT t.*, e.name as employee_name 
            FROM transactions t 
            LEFT JOIN employees e ON t.employee_id = e.id 
            WHERE t.user_id = $1
        `;

        const countClause = `
            SELECT COUNT(*) 
            FROM transactions t 
            WHERE t.user_id = $1
        `;

        const params: Array<string | number> = [userId];
        let conditions: string[] = [];

        // Add conditions based on filters
        if (startDate) {
            conditions.push(`t.date >= $${params.length + 1}`);
            params.push(startDate);
        }
        if (endDate) {
            conditions.push(`t.date <= $${params.length + 1}`);  // Fixed: Added $ before the parameter number
            params.push(endDate);
        }
        if (type) {
            conditions.push(`t.transaction_type = $${params.length + 1}`);
            params.push(type);
        }
        if (employeeId) {
            conditions.push(`t.employee_id = $${params.length + 1}`);
            params.push(employeeId);
        }

        // Combine conditions
        const whereClause = conditions.length > 0 
            ? ` AND ${conditions.join(' AND ')}` 
            : '';

        // Construct final queries
        const dataQuery = `
            ${selectClause}
            ${whereClause}
            ORDER BY t.date DESC 
            LIMIT $${params.length + 1} 
            OFFSET $${params.length + 2}
        `;

        const countQuery = `
            ${countClause}
            ${whereClause}
        `;

        // Add pagination parameters to the data query params
        const queryParams = [...params, limit, offset];

        // Execute both queries
        console.log('Executing queries:', {
            dataQuery,
            countQuery,
            queryParams,
            conditions
        });
        
        const [results, countResult] = await Promise.all([
            pool.query(dataQuery, queryParams),
            pool.query(countQuery, params)
        ]);

        const totalRecords = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalRecords / limit);

        // Log for debugging
        console.log('Query executed:', {
            params: queryParams,
            rowCount: results.rows.length,
            totalRecords
        });

        res.json({
            data: results.rows,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalPages,
                totalRecords,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });

    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ 
            message: 'Error fetching transactions',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const userId = req.user?.id;
        const { type, amount, date, description, company_name, employee_id }: Transaction = req.body;
        
        // Insert the transaction
        const transactionResult = await client.query(
            'INSERT INTO transactions (user_id, transaction_type, amount, date, description, company_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [userId, type, amount, date, description, company_name]
        );

        // Calculate balance adjustment based on transaction type
        const adjustment = (type === 'HR' || type === 'purchase') ? -amount : amount;
        
        // Update company balance
        await client.query(
            `INSERT INTO company_balance (amount) 
             SELECT (COALESCE((SELECT amount FROM company_balance ORDER BY id DESC LIMIT 1), 0) + $1::numeric)`,
            [adjustment]
        );

        await client.query('COMMIT');
        res.status(201).json({ id: transactionResult.rows[0].id });
    } catch (error) {
        await client.query('ROLLBACK');
        console.log("Error creating transaction:", error);
        res.status(500).json({ message: 'Error creating transaction' });
    } finally {
        client.release();
    }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const userId = req.user?.id;
        const transactionId = req.params.id;
        const { type, amount, date, description, company_name, employee_id }: Transaction = req.body;
        
        // Get the old transaction to calculate balance adjustment
        const oldTransaction = await client.query(
            'SELECT type, amount FROM transactions WHERE id = $1 AND user_id = $2',
            [transactionId, userId]
        );
        
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
        await client.query(
            'UPDATE transactions SET type = $1, amount = $2, date = $3, description = $4, company_name = $5, employee_id = $6 WHERE id = $7 AND user_id = $8',
            [type, amount, date, description, company_name, employee_id, transactionId, userId]
        );

        // Update company balance
        await client.query(
            `INSERT INTO company_balance (amount) 
             SELECT (COALESCE((SELECT amount FROM company_balance ORDER BY id DESC LIMIT 1), 0) + $1::numeric)`,
            [balanceAdjustment]
        );

        await client.query('COMMIT');
        res.json({ message: 'Transaction updated' });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof Error && error.message === 'Transaction not found') {
            res.status(404).json({ message: 'Transaction not found' });
        } else {
            res.status(500).json({ message: 'Error updating transaction' });
        }
    } finally {
        client.release();
    }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const userId = req.user?.id;
        const transactionId = req.params.id;
        
        // Get the transaction to calculate balance adjustment
        const transaction = await client.query(
            'SELECT type, amount FROM transactions WHERE id = $1 AND user_id = $2',
            [transactionId, userId]
        );
        
        if (transaction.rowCount === 0) {
            throw new Error('Transaction not found');
        }

        // Calculate balance adjustment
        const balanceAdjustment = (transaction.rows[0].type === 'HR' || transaction.rows[0].type === 'purchase')
            ? transaction.rows[0].amount
            : -transaction.rows[0].amount;

        // Delete the transaction
        await client.query(
            'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
            [transactionId, userId]
        );

        // Update company balance
        await client.query(
            `INSERT INTO company_balance (amount) 
             SELECT (COALESCE((SELECT amount FROM company_balance ORDER BY id DESC LIMIT 1), 0) + $1::numeric)`,
            [balanceAdjustment]
        );

        await client.query('COMMIT');
        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof Error && error.message === 'Transaction not found') {
            res.status(404).json({ message: 'Transaction not found' });
        } else {
            res.status(500).json({ message: 'Error deleting transaction' });
        }
    } finally {
        client.release();
    }
};
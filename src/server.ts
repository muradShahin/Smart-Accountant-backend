import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import routes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1'); // Test database connection
        res.json({ status: 'healthy', database: 'connected' });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy', 
            database: 'disconnected', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// API Routes
app.use('/api', routes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
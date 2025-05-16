import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
   /**user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME, */
        ssl: {
            ca: fs.readFileSync('global-bundle.pem').toString()
        }

    }
);

export default pool;
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

export const config = {
    port: process.env.PORT || 5000,
    db: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        database: process.env.DB_NAME,
    },
    jwt: {
        secret: (process.env.JWT_SECRET || 'your-secret-key') as string,
        expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as string,
    },
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    },
    logLevel: process.env.LOG_LEVEL || 'info',
};

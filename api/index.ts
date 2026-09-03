import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../server/src/routes/auth.routes';
import companyRoutes from '../server/src/routes/company.routes';
import userRoutes from '../server/src/routes/user.routes';

// Initialize Prisma client
const prisma = new PrismaClient();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: undefined,
}));

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: 'production',
  });
});

export { prisma };
export default app;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const status_routes_1 = __importDefault(require("./routes/status.routes"));
dotenv_1.default.config();
exports.prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/companies', company_routes_1.default);
app.use('/api/users', user_routes_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});
// Backend status page
app.use('/api', status_routes_1.default);
// Serve frontend in production (only when running standalone)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    const clientDistPath = path_1.default.join(__dirname, '../../client/dist');
    app.use(express_1.default.static(clientDistPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
        }
    });
}
// Start server only when running locally (not on Vercel)
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log('Server running on http://localhost:' + PORT);
        console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
    });
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down gracefully...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
exports.default = app;

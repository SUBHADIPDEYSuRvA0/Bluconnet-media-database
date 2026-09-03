import { Router } from 'express';
import path from 'path';
import { prisma } from '../index';

const router = Router();

// Backend status page
router.get('/', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbStatus = 'connected';
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>B2B Lead Platform - Backend</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { text-align: center; padding: 2rem; }
        .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 3rem; max-width: 500px; }
        .status { display: inline-flex; align-items: center; gap: 0.5rem; background: #10b981; color: white; padding: 0.5rem 1rem; border-radius: 2rem; font-size: 0.875rem; font-weight: 600; margin-bottom: 1.5rem; }
        .status::before { content: ''; width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        h1 { color: white; font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #94a3b8; margin-bottom: 2rem; }
        .info { background: rgba(0,0,0,0.2); border-radius: 0.5rem; padding: 1rem; text-align: left; }
        .info-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #64748b; font-size: 0.875rem; }
        .info-value { color: #e2e8f0; font-size: 0.875rem; font-weight: 500; }
        .links { margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
        .link { background: rgba(255,255,255,0.1); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none; font-size: 0.875rem; transition: background 0.2s; }
        .link:hover { background: rgba(255,255,255,0.2); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="status">Backend Running</div>
          <h1>B2B Lead Platform</h1>
          <p>Backend API is operational and ready to serve requests.</p>
          <div class="info">
            <div class="info-row">
              <span class="info-label">Database</span>
              <span class="info-value" style="color: #10b981;">${dbStatus}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Environment</span>
              <span class="info-value">${process.env.NODE_ENV || 'production'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Timestamp</span>
              <span class="info-value">${new Date().toISOString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Version</span>
              <span class="info-value">1.0.0</span>
            </div>
          </div>
          <div class="links">
            <a href="/api/health" class="link">Health Check</a>
            <a href="/api/companies" class="link">Companies API</a>
            <a href="/api/auth/me" class="link">Auth API</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error: any) {
    res.status(503).json({
      success: false,
      message: 'Backend is running but database connection failed',
      error: error.message,
    });
  }
});

export default router;

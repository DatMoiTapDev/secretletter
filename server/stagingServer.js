import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import userLettersRouter from './routes/userLetters.js';
import { requireAdmin, safeCompare } from './auth.js';
import { applySecurityHeaders, generalApiLimiter, authRateLimiter } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createStagingApp(options = {}) {
  const app = express();

  // 1. Áp dụng tiêu đề bảo mật
  app.use(applySecurityHeaders);

  // 2. Cấu hình CORS chặt chẽ cho Staging & Production
  const allowedOrigins = [
    'https://datmoitapdev.github.io',
    'https://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [])
  ];

  const corsOptions = {
    origin: function (origin, callback) {
      // Cho phép request không có origin (như mobile apps hoặc curl/REST tests) hoặc origin nằm trong whitelist
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Policy: Origin ${origin} is not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-admin-key', 'if-match', 'If-Match'],
    exposedHeaders: ['ETag'],
    credentials: true,
    maxAge: 86400 // Preflight cache 24h
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '2mb' }));

  // Pre-flight handling
  app.options('*', cors(corsOptions));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      environment: 'staging',
      protocol: req.protocol,
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/user/letters', userLettersRouter);

  return app;
}

/**
 * Khởi tạo TLS Credentials tự ký phục vụ staging HTTPS cục bộ
 */
export function generateSelfSignedTlsCert() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  return { key: privateKey, cert: publicKey };
}

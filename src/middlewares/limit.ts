import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Terlalu banyak percobaan login, silakan coba lagi dalam 10 menit',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return ipKeyGenerator(req.ip || req.socket.remoteAddress || '');
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: 'Terlalu banyak percobaan registrasi, silakan coba lagi dalam 1 jam',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return ipKeyGenerator(req.ip || req.socket.remoteAddress || '');
  },
});
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const prisma_1 = require("../config/prisma");
const supabase_1 = require("../config/supabase");
const requireRole = (...roles) => {
    return async (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Token tidak ditemukan' });
            return;
        }
        const { data, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
        if (error || !data.user) {
            res.status(401).json({ message: 'Token tidak valid atau sudah expired' });
            return;
        }
        const dbUser = await prisma_1.prisma.user.findUnique({
            where: { id: data.user.id }
        });
        if (!dbUser) {
            res.status(403).json({ message: 'User tidak ditemukan di database' });
            return;
        }
        if (!roles.includes(dbUser.role)) {
            res.status(403).json({
                message: `Akses ditolak. Diperlukan role: ${roles.join(' atau ')}`
            });
            return;
        }
        req.user = {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role
        };
        next();
    };
};
exports.requireRole = requireRole;

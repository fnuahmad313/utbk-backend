"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../../config/supabase");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        res.status(400).json({ message: 'Email, password, dan name wajib diisi' });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ message: 'Password minimal 6 karakter' });
        return;
    }
    const { data, error } = await supabase_1.supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name },
        },
    });
    if (error) {
        res.status(400).json({ message: error.message });
        return;
    }
    res.status(201).json({
        message: 'Registrasi berhasil, cek email untuk verifikasi',
        user: data.user,
    });
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ message: 'Email dan password wajib diisi' });
        return;
    }
    const { data, error } = await supabase_1.supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        res.status(400).json({ message: error.message });
        return;
    }
    res.json({
        message: 'Login berhasil',
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user,
    });
});
router.post('/logout', auth_middleware_1.authenticate, async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    await supabase_1.supabaseAdmin.auth.admin.signOut(token);
    res.json({ message: 'Logout berhasil' });
});
router.get('/me', auth_middleware_1.authenticate, async (req, res) => {
    const dbUser = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
        },
    });
    if (!dbUser) {
        res.status(404).json({ message: 'User tidak ditemukan' });
        return;
    }
    res.json({ data: dbUser });
});
// Hanya admin yang bisa ubah role user
router.patch('/role', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const { userId, role } = req.body;
    if (!userId || !role) {
        res.status(400).json({ message: 'userId dan role wajib diisi' });
        return;
    }
    if (!Object.values(client_1.Role).includes(role)) {
        res
            .status(400)
            .json({ message: 'Role tidak valid. Gunakan ADMIN atau SISWA' });
        return;
    }
    const userExists = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!userExists) {
        res.status(404).json({ message: 'User tidak ditemukan di database' });
        return;
    }
    const updated = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, email: true, name: true, role: true },
    });
    res.json({ message: 'Role berhasil diubah', data: updated });
});
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const supabase_1 = require("../config/supabase");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Token tidak ditemukan" });
        return;
    }
    const token = authHeader.split(" ")[1];
    const { data, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
        res.status(401).json({ message: "Token tidak valid atau sudah expired" });
        return;
    }
    req.user = {
        id: data.user.id,
        email: data.user.email,
    };
    next();
};
exports.authenticate = authenticate;

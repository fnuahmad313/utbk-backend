"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_middleware_1 = require("../../middlewares/role.middleware");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const client_1 = require("@prisma/client");
const ForumController = __importStar(require("./forum.controller"));
const router = (0, express_1.Router)();
// ===== KATEGORI =====
router.get('/kategori', auth_middleware_1.authenticate, ForumController.getKategoriList);
router.post('/kategori', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), ForumController.createKategori);
router.put('/kategori/:id', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), ForumController.updateKategori);
router.delete('/kategori/:id', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), ForumController.deleteKategori);
// ===== KOMENTAR (statis sebelum /:id) =====
router.put('/komentar/:id', auth_middleware_1.authenticate, ForumController.updateKomentar);
router.delete('/komentar/:id', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN, client_1.Role.SISWA), ForumController.deleteKomentar);
router.post('/komentar/:id/like', (0, role_middleware_1.requireRole)(client_1.Role.SISWA), ForumController.toggleLikeKomentar);
// ===== POST =====
router.get('/posts', auth_middleware_1.authenticate, ForumController.getPostList);
router.post('/posts', (0, role_middleware_1.requireRole)(client_1.Role.SISWA), ForumController.createPost);
router.get('/posts/:id', auth_middleware_1.authenticate, ForumController.getPostById);
router.put('/posts/:id', auth_middleware_1.authenticate, ForumController.updatePost);
router.delete('/posts/:id', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN, client_1.Role.SISWA), ForumController.deletePost);
router.post('/posts/:id/like', (0, role_middleware_1.requireRole)(client_1.Role.SISWA), ForumController.toggleLikePost);
router.patch('/posts/:id/pin', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), ForumController.togglePinPost);
router.patch('/posts/:id/lock', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), ForumController.toggleLockPost);
router.post('/posts/:postId/komentar', (0, role_middleware_1.requireRole)(client_1.Role.SISWA), ForumController.createKomentar);
exports.default = router;

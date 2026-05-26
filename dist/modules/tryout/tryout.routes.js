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
const client_1 = require("@prisma/client");
const TryoutController = __importStar(require("./tryout.controller"));
const router = (0, express_1.Router)();
// ===== SESI ROUTES (statis dulu, sebelum /:id) =====
router.get('/sesi/riwayat', (0, role_middleware_1.requireRole)(client_1.Role.SISWA), TryoutController.getRiwayat);
router.get('/sesi/:sesiId/hasil', (0, role_middleware_1.requireRole)(client_1.Role.SISWA), TryoutController.getHasil);
router.post('/sesi/:sesiId/submit-subtes', (0, role_middleware_1.requireRole)(client_1.Role.SISWA), TryoutController.submitSubtes);
router.post('/sesi/:sesiId/selesai', (0, role_middleware_1.requireRole)(client_1.Role.SISWA), TryoutController.selesaiTryout);
// ===== TRYOUT ROUTES =====
router.get('/', (0, role_middleware_1.requireRole)(client_1.Role.SISWA), TryoutController.getTryoutList);
router.post('/', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), TryoutController.createTryout);
// ===== TRYOUT BY ID (dinamis paling bawah) =====
router.get('/:id', (0, role_middleware_1.requireRole)(client_1.Role.SISWA), TryoutController.getTryoutById);
router.post('/:id/mulai', (0, role_middleware_1.requireRole)(client_1.Role.SISWA), TryoutController.startSesiTryout);
router.post('/:id/subtes', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), TryoutController.addSoalSubtes);
router.patch('/:id/status', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), TryoutController.updateStatus);
router.delete('/:id', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), TryoutController.deleteTryout);
exports.default = router;

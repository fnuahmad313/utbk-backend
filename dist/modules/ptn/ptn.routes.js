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
const PTNController = __importStar(require("./ptn.controller"));
const router = (0, express_1.Router)();
// Jurusan routes — statis di atas dinamis
router.get('/jurusan', auth_middleware_1.authenticate, PTNController.getJurusanList);
router.get('/jurusan/:id', auth_middleware_1.authenticate, PTNController.getJurusanById);
router.post('/jurusan', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), PTNController.createJurusan);
router.put('/jurusan/:id', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), PTNController.updateJurusan);
router.delete('/jurusan/:id', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), PTNController.deleteJurusan);
// PTN routes
router.get('/', auth_middleware_1.authenticate, PTNController.getPTNList);
router.get('/:id', auth_middleware_1.authenticate, PTNController.getPTNById);
router.get('/:ptnId/jurusan', auth_middleware_1.authenticate, PTNController.getJurusanByPTN);
router.post('/', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), PTNController.createPTN);
router.put('/:id', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), PTNController.updatePTN);
router.delete('/:id', (0, role_middleware_1.requireRole)(client_1.Role.ADMIN), PTNController.deletePTN);
exports.default = router;

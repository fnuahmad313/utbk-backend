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
exports.getRekomendasiJurusan = void 0;
const RekomendasiService = __importStar(require("./rekomendasi.service"));
const getRekomendasiJurusan = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Token tidak valid' });
            return;
        }
        const kelompok = req.query.kelompok;
        const limitParam = req.query.limit ? parseInt(req.query.limit, 10) : 10;
        const result = await RekomendasiService.getRekomendasiJurusan(userId, kelompok, limitParam);
        if ('error' in result) {
            if (result.error === 'no_tryout_data') {
                res.status(400).json({
                    message: 'Belum ada data tryout yang selesai untuk dijadikan referensi skor',
                });
                return;
            }
            if (result.error === 'invalid_kelompok') {
                res.status(400).json({
                    message: 'Kelompok tidak valid. Gunakan SAINTEK, SOSHUM, atau CAMPURAN',
                });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getRekomendasiJurusan = getRekomendasiJurusan;

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
exports.getRiwayat = exports.getHasil = exports.selesaiTryout = exports.submitSubtes = exports.startSesiTryout = exports.getTryoutById = exports.getTryoutList = exports.deleteTryout = exports.addSoalSubtes = exports.updateStatus = exports.createTryout = void 0;
const TryoutService = __importStar(require("./tryout.service"));
const createTryout = async (req, res) => {
    try {
        const { judul, deskripsi, mulaiAt, selesaiAt, durasiTps, durasiTka } = req.body;
        const result = await TryoutService.createTryout({
            judul,
            deskripsi,
            mulaiAt,
            selesaiAt,
            durasiTps,
            durasiTka,
        });
        if ('error' in result) {
            if (result.error === 'judul_invalid') {
                res
                    .status(400)
                    .json({ message: 'Judul wajib diisi dan tidak boleh kosong' });
                return;
            }
            if (result.error === 'date_invalid') {
                res
                    .status(400)
                    .json({
                    message: 'Format tanggal mulaiAt atau selesaiAt tidak valid',
                });
                return;
            }
            if (result.error === 'selesai_at_before_mulai_at') {
                res
                    .status(400)
                    .json({ message: 'Waktu selesai harus setelah waktu mulai' });
                return;
            }
            if (result.error === 'durasi_tps_invalid' ||
                result.error === 'durasi_tka_invalid') {
                res
                    .status(400)
                    .json({
                    message: 'Durasi TPS dan TKA wajib berupa integer lebih besar dari 0',
                });
                return;
            }
            if (result.error === 'tryout_not_found') {
                res.status(404).json({ message: 'Tryout tidak ditemukan' });
                return;
            }
            if (result.error === 'tryout_not_ongoing') {
                res.status(400).json({ message: 'Tryout belum dalam status ONGOING' });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.status(201).json({
            message: 'Tryout berhasil dibuat',
            data: result.data,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createTryout = createTryout;
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            res.status(400).json({ message: 'Status wajib diisi' });
            return;
        }
        const result = await TryoutService.updateStatus(id, status);
        if ('error' in result) {
            if (result.error === 'tryout_not_found') {
                res.status(404).json({ message: 'Tryout tidak ditemukan' });
                return;
            }
            if (result.error === 'invalid_status_transition') {
                res.status(400).json({ message: 'Transisi status tidak valid' });
                return;
            }
            if (result.error === 'tps_subtes_empty') {
                res.status(400).json({ message: 'Subtes TPS belum memiliki soal' });
                return;
            }
            if (result.error === 'tka_subtes_empty') {
                res.status(400).json({ message: 'Subtes TKA belum memiliki soal' });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateStatus = updateStatus;
const addSoalSubtes = async (req, res) => {
    try {
        const { id } = req.params;
        const { mapel, soalIds } = req.body;
        const result = await TryoutService.addSoalSubtes(id, mapel, soalIds);
        if ('error' in result) {
            if (result.error === 'tryout_not_found') {
                res.status(404).json({ message: 'Tryout tidak ditemukan' });
                return;
            }
            if (result.error === 'invalid_mapel') {
                res.status(400).json({ message: 'Mapel tidak valid' });
                return;
            }
            if (result.error === 'empty_soal_ids') {
                res
                    .status(400)
                    .json({ message: 'soalIds wajib diisi dan tidak boleh kosong' });
                return;
            }
            if (result.error === 'tryout_not_draft') {
                res
                    .status(400)
                    .json({
                    message: 'Soal hanya bisa ditambahkan pada tryout berstatus DRAFT',
                });
                return;
            }
            if (result.error === 'some_soal_ids_invalid') {
                res
                    .status(400)
                    .json({
                    message: 'Beberapa Soal ID tidak valid atau tidak ditemukan',
                });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.json({ message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.addSoalSubtes = addSoalSubtes;
const deleteTryout = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await TryoutService.deleteTryout(id);
        if ('error' in result) {
            if (result.error === 'tryout_not_found') {
                res.status(404).json({ message: 'Tryout tidak ditemukan' });
                return;
            }
            if (result.error === 'tryout_not_draft') {
                res
                    .status(400)
                    .json({ message: 'Hanya tryout berstatus DRAFT yang bisa dihapus' });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.json({ message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteTryout = deleteTryout;
const getTryoutList = async (req, res) => {
    try {
        const result = await TryoutService.getTryoutList();
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTryoutList = getTryoutList;
const getTryoutById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.user?.role || 'SISWA';
        const result = await TryoutService.getTryoutById(id, role);
        if ('error' in result) {
            if (result.error === 'tryout_not_found') {
                res.status(404).json({ message: 'Tryout tidak ditemukan' });
                return;
            }
            if (result.error === 'unauthorized') {
                res.status(403).json({ message: 'Akses ditolak' });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTryoutById = getTryoutById;
const startSesiTryout = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Token tidak valid' });
            return;
        }
        const result = await TryoutService.startSesiTryout(id, userId);
        if ('error' in result) {
            if (result.error === 'tryout_not_found') {
                res.status(404).json({ message: 'Tryout tidak ditemukan' });
                return;
            }
            if (result.error === 'tryout_not_ongoing') {
                res
                    .status(400)
                    .json({ message: 'Tryout belum berlangsung atau sudah selesai' });
                return;
            }
            if (result.error === 'tryout_already_ended') {
                res
                    .status(400)
                    .json({ message: 'Waktu pelaksanaan tryout telah berakhir' });
                return;
            }
            if (result.error === 'already_has_active_session') {
                res
                    .status(400)
                    .json({ message: 'Anda sudah memiliki sesi aktif untuk tryout ini' });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.status(201).json({
            message: 'Sesi tryout dimulai',
            data: result.data,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.startSesiTryout = startSesiTryout;
const submitSubtes = async (req, res) => {
    try {
        const { sesiId } = req.params;
        const { jawabans } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Token tidak valid' });
            return;
        }
        if (!jawabans || !Array.isArray(jawabans)) {
            res.status(400).json({ message: 'Jawabans wajib berupa array' });
            return;
        }
        const result = await TryoutService.submitSubtes(sesiId, userId, jawabans);
        if ('error' in result) {
            if (result.error === 'session_not_found') {
                res.status(404).json({ message: 'Sesi tryout tidak ditemukan' });
                return;
            }
            if (result.error === 'unauthorized') {
                res.status(403).json({ message: 'Akses ditolak' });
                return;
            }
            if (result.error === 'session_not_active') {
                res
                    .status(400)
                    .json({ message: 'Sesi tryout tidak aktif atau sudah selesai' });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        if ('message' in result &&
            result.message === 'Subtes selesai, lanjutkan ke /selesai') {
            res.json({ message: result.message });
            return;
        }
        res.json({
            message: 'Subtes TPS selesai, lanjut ke TKA',
            data: result.data,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.submitSubtes = submitSubtes;
const selesaiTryout = async (req, res) => {
    try {
        const { sesiId } = req.params;
        const { jawabans } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Token tidak valid' });
            return;
        }
        if (!jawabans || !Array.isArray(jawabans)) {
            res.status(400).json({ message: 'Jawabans wajib berupa array' });
            return;
        }
        const result = await TryoutService.selesaiTryout(sesiId, userId, jawabans);
        if ('error' in result) {
            if (result.error === 'session_not_found') {
                res.status(404).json({ message: 'Sesi tryout tidak ditemukan' });
                return;
            }
            if (result.error === 'unauthorized') {
                res.status(403).json({ message: 'Akses ditolak' });
                return;
            }
            if (result.error === 'session_not_active') {
                res
                    .status(400)
                    .json({
                    message: 'Sesi tryout tidak aktif atau sudah disubmit sebelumnya',
                });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.json({
            message: 'Tryout selesai',
            data: result.data,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.selesaiTryout = selesaiTryout;
const getHasil = async (req, res) => {
    try {
        const { sesiId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Token tidak valid' });
            return;
        }
        const result = await TryoutService.getHasilSesi(sesiId, userId);
        if ('error' in result) {
            if (result.error === 'session_not_found') {
                res.status(404).json({ message: 'Sesi tryout tidak ditemukan' });
                return;
            }
            if (result.error === 'unauthorized') {
                res.status(403).json({ message: 'Akses ditolak' });
                return;
            }
            if (result.error === 'session_still_in_progress') {
                res
                    .status(400)
                    .json({
                    message: 'Hasil tryout belum bisa dilihat karena sesi masih berlangsung',
                });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getHasil = getHasil;
const getRiwayat = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Token tidak valid' });
            return;
        }
        const result = await TryoutService.getRiwayatSesi(userId);
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getRiwayat = getRiwayat;

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
exports.getSessionDetail = exports.getRiwayat = exports.submitSession = exports.startSession = void 0;
const LatihanService = __importStar(require("./latihan.service"));
const allowedMapel = ["TPS", "TKA_SAINTEK", "TKA_SOSHUM"];
const startSession = async (req, res) => {
    try {
        const { mapel, jumlah } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Token tidak valid" });
            return;
        }
        if (!mapel || !allowedMapel.includes(mapel)) {
            res.status(400).json({ message: "Mapel tidak valid, harus TPS, TKA_SAINTEK, atau TKA_SOSHUM" });
            return;
        }
        if (jumlah === undefined ||
            typeof jumlah !== "number" ||
            !Number.isInteger(jumlah) ||
            jumlah < 1 ||
            jumlah > 40) {
            res.status(400).json({ message: "Jumlah soal tidak valid, harus antara 1 dan 40" });
            return;
        }
        const result = await LatihanService.startSession({
            userId,
            mapel,
            jumlah,
        });
        if ("error" in result) {
            if (result.error === "no_questions_found") {
                res.status(400).json({ message: "Tidak ada soal tersedia untuk mata pelajaran ini" });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.status(201).json(result);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.startSession = startSession;
const submitSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { jawabans } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Token tidak valid" });
            return;
        }
        if (!jawabans || !Array.isArray(jawabans)) {
            res.status(400).json({ message: "Jawabans harus berupa array" });
            return;
        }
        for (const item of jawabans) {
            if (!item.soalId || typeof item.soalId !== "string") {
                res.status(400).json({ message: "Setiap item jawaban wajib memiliki soalId berupa string" });
                return;
            }
            if (item.jawaban === undefined || item.jawaban === null) {
                res.status(400).json({ message: "Setiap item jawaban tidak boleh kosong" });
                return;
            }
        }
        const result = await LatihanService.submitSession({
            userId,
            sessionId: sessionId,
            jawabans,
        });
        if ("error" in result) {
            if (result.error === "session_not_found") {
                res.status(404).json({ message: "Sesi latihan tidak ditemukan" });
                return;
            }
            if (result.error === "unauthorized_session") {
                res.status(403).json({ message: "Anda tidak memiliki akses ke sesi ini" });
                return;
            }
            if (result.error === "session_already_completed") {
                res.status(400).json({ message: "Sesi latihan sudah selesai" });
                return;
            }
            if (result.error === "empty_answers") {
                res.status(400).json({ message: "Jawaban tidak boleh kosong" });
                return;
            }
            if (result.error && result.error.startsWith("soal_not_found")) {
                res.status(400).json({ message: "Beberapa Soal ID tidak valid atau tidak ditemukan" });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.submitSession = submitSession;
const getRiwayat = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Token tidak valid" });
            return;
        }
        const result = await LatihanService.getRiwayat(userId);
        res.json({ data: result });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getRiwayat = getRiwayat;
const getSessionDetail = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "Token tidak valid" });
            return;
        }
        const result = await LatihanService.getSessionDetail(userId, sessionId);
        if ("error" in result) {
            if (result.error === "session_not_found") {
                res.status(404).json({ message: "Sesi latihan tidak ditemukan" });
                return;
            }
            if (result.error === "unauthorized_session") {
                res.status(403).json({ message: "Anda tidak memiliki akses ke sesi ini" });
                return;
            }
            res.status(400).json({ message: result.error });
            return;
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getSessionDetail = getSessionDetail;

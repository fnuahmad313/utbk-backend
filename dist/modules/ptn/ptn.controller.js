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
exports.deleteJurusan = exports.updateJurusan = exports.createJurusan = exports.getJurusanById = exports.getJurusanList = exports.getJurusanByPTN = exports.deletePTN = exports.updatePTN = exports.createPTN = exports.getPTNById = exports.getPTNList = void 0;
const PTNService = __importStar(require("./ptn.service"));
// getPTNList
const getPTNList = async (req, res) => {
    try {
        const { provinsi, tipe, akreditasi, search } = req.query;
        const filter = {
            provinsi: provinsi ? String(provinsi) : undefined,
            tipe: tipe ? String(tipe) : undefined,
            akreditasi: akreditasi ? String(akreditasi) : undefined,
            search: search ? String(search) : undefined,
        };
        const result = await PTNService.getPTNList(filter);
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPTNList = getPTNList;
// getPTNById
const getPTNById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await PTNService.getPTNById(id);
        if (result.error === 'ptn_not_found') {
            res.status(404).json({ message: 'PTN tidak ditemukan' });
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPTNById = getPTNById;
// createPTN
const createPTN = async (req, res) => {
    try {
        const result = await PTNService.createPTN(req.body);
        if (result.error === 'validation_error') {
            res.status(400).json({ message: result.message });
            return;
        }
        res.status(201).json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createPTN = createPTN;
const updatePTN = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await PTNService.updatePTN(id, req.body);
        if (result.error === 'ptn_not_found') {
            res.status(404).json({ message: 'PTN tidak ditemukan' });
            return;
        }
        if (result.error === 'validation_error') {
            res.status(400).json({ message: result.message });
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updatePTN = updatePTN;
// deletePTN
const deletePTN = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await PTNService.deletePTN(id);
        if (result.error === 'ptn_not_found') {
            res.status(404).json({ message: 'PTN tidak ditemukan' });
            return;
        }
        res.json({ message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deletePTN = deletePTN;
// getJurusanByPTN
const getJurusanByPTN = async (req, res) => {
    try {
        const { ptnId } = req.params;
        const { kelompok, jenjang, search } = req.query;
        const filter = {
            kelompok: kelompok ? String(kelompok) : undefined,
            jenjang: jenjang ? String(jenjang) : undefined,
            search: search ? String(search) : undefined,
        };
        const result = await PTNService.getJurusanByPTN(ptnId, filter);
        if (result.error === 'ptn_not_found') {
            res.status(404).json({ message: 'PTN tidak ditemukan' });
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getJurusanByPTN = getJurusanByPTN;
// getJurusanList
const getJurusanList = async (req, res) => {
    try {
        const { kelompok, jenjang, search } = req.query;
        const filter = {
            kelompok: kelompok ? String(kelompok) : undefined,
            jenjang: jenjang ? String(jenjang) : undefined,
            search: search ? String(search) : undefined,
        };
        const result = await PTNService.getJurusanList(filter);
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getJurusanList = getJurusanList;
// getJurusanById
const getJurusanById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await PTNService.getJurusanById(id);
        if (result.error === 'jurusan_not_found') {
            res.status(404).json({ message: 'Jurusan tidak ditemukan' });
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getJurusanById = getJurusanById;
// createJurusan
const createJurusan = async (req, res) => {
    try {
        const result = await PTNService.createJurusan(req.body);
        if (result.error === 'ptn_not_found') {
            res.status(404).json({ message: 'PTN tidak ditemukan' });
            return;
        }
        if (result.error === 'validation_error') {
            res.status(400).json({ message: result.message });
            return;
        }
        res.status(201).json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createJurusan = createJurusan;
// updateJurusan
const updateJurusan = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await PTNService.updateJurusan(id, req.body);
        if (result.error === 'jurusan_not_found') {
            res.status(404).json({ message: 'Jurusan tidak ditemukan' });
            return;
        }
        if (result.error === 'ptn_not_found') {
            res.status(404).json({ message: 'PTN tidak ditemukan' });
            return;
        }
        if (result.error === 'validation_error') {
            res.status(400).json({ message: result.message });
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateJurusan = updateJurusan;
// deleteJurusan
const deleteJurusan = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await PTNService.deleteJurusan(id);
        if (result.error === 'jurusan_not_found') {
            res.status(404).json({ message: 'Jurusan tidak ditemukan' });
            return;
        }
        res.json({ message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteJurusan = deleteJurusan;

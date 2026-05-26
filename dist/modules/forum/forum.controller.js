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
exports.toggleLikeKomentar = exports.deleteKomentar = exports.updateKomentar = exports.createKomentar = exports.toggleLockPost = exports.togglePinPost = exports.toggleLikePost = exports.deletePost = exports.updatePost = exports.createPost = exports.getPostById = exports.getPostList = exports.deleteKategori = exports.updateKategori = exports.createKategori = exports.getKategoriList = void 0;
const ForumService = __importStar(require("./forum.service"));
const handleError = (res, error) => {
    switch (error) {
        case 'nama_required':
            return res.status(400).json({ message: 'Nama kategori wajib diisi' });
        case 'kategori_already_exists':
            return res.status(400).json({ message: 'Kategori sudah ada atau slug duplikat' });
        case 'kategori_not_found':
            return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        case 'kategori_has_posts':
            return res.status(400).json({ message: 'Kategori masih memiliki post dan tidak bisa dihapus' });
        case 'post_not_found':
            return res.status(404).json({ message: 'Post tidak ditemukan' });
        case 'forbidden':
            return res.status(403).json({ message: 'Akses ditolak. Anda bukan pemilik resource ini' });
        case 'judul_invalid':
            return res.status(400).json({ message: 'Judul tidak boleh kosong dan minimal 5 karakter' });
        case 'konten_invalid':
            return res.status(400).json({ message: 'Konten tidak boleh kosong dan minimal 10 karakter' });
        case 'kategori_invalid':
            return res.status(400).json({ message: 'KategoriId harus valid' });
        case 'post_locked':
            return res.status(400).json({ message: 'Post ini sudah dikunci dan tidak bisa dikomentari' });
        case 'parent_komentar_not_found':
            return res.status(400).json({ message: 'Komentar parent tidak ditemukan' });
        case 'cannot_reply_to_reply':
            return res.status(400).json({ message: 'Tidak boleh reply di level komentar ini (maksimal 2 level)' });
        case 'komentar_not_found':
            return res.status(404).json({ message: 'Komentar tidak ditemukan' });
        default:
            return res.status(500).json({ message: 'Internal server error' });
    }
};
// ==========================================
// ===== KATEGORI =====
// ==========================================
const getKategoriList = async (req, res) => {
    try {
        const data = await ForumService.getKategoriList();
        res.json({ data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getKategoriList = getKategoriList;
const createKategori = async (req, res) => {
    try {
        const { nama, deskripsi } = req.body;
        const result = await ForumService.createKategori(nama, deskripsi);
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.status(201).json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createKategori = createKategori;
const updateKategori = async (req, res) => {
    try {
        const id = req.params.id;
        const { nama, deskripsi } = req.body;
        const result = await ForumService.updateKategori(id, { nama, deskripsi });
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateKategori = updateKategori;
const deleteKategori = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await ForumService.deleteKategori(id);
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.json({ message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteKategori = deleteKategori;
// ==========================================
// ===== POST =====
// ==========================================
const getPostList = async (req, res) => {
    try {
        const { kategoriId, kategoriSlug, userId, search, isPinned, page, limit } = req.query;
        const filter = {
            kategoriId: kategoriId,
            kategoriSlug: kategoriSlug,
            userId: userId,
            search: search,
            isPinned: isPinned !== undefined ? isPinned === 'true' : undefined
        };
        const pagination = {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20
        };
        const result = await ForumService.getPostList(filter, pagination);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPostList = getPostList;
const getPostById = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const result = await ForumService.getPostById(id, userId);
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPostById = getPostById;
const createPost = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { kategoriId, judul, konten } = req.body;
        const result = await ForumService.createPost(userId, { kategoriId, judul, konten });
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.status(201).json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createPost = createPost;
const updatePost = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { judul, konten } = req.body;
        const result = await ForumService.updatePost(id, userId, { judul, konten });
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updatePost = updatePost;
const deletePost = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        const role = req.user?.role;
        if (!userId || !role) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const result = await ForumService.deletePost(id, userId, role);
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.json({ message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deletePost = deletePost;
const toggleLikePost = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const result = await ForumService.toggleLikePost(id, userId);
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.toggleLikePost = toggleLikePost;
const togglePinPost = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await ForumService.togglePinPost(id);
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.togglePinPost = togglePinPost;
const toggleLockPost = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await ForumService.toggleLockPost(id);
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.toggleLockPost = toggleLockPost;
// ==========================================
// ===== KOMENTAR =====
// ==========================================
const createKomentar = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { konten, parentId } = req.body;
        const result = await ForumService.createKomentar(postId, userId, { konten, parentId });
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.status(201).json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createKomentar = createKomentar;
const updateKomentar = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { konten } = req.body;
        const result = await ForumService.updateKomentar(id, userId, konten);
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateKomentar = updateKomentar;
const deleteKomentar = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        const role = req.user?.role;
        if (!userId || !role) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const result = await ForumService.deleteKomentar(id, userId, role);
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.json({ message: result.message });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteKomentar = deleteKomentar;
const toggleLikeKomentar = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const result = await ForumService.toggleLikeKomentar(id, userId);
        if ('error' in result) {
            handleError(res, result.error);
            return;
        }
        res.json({ data: result.data });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.toggleLikeKomentar = toggleLikeKomentar;

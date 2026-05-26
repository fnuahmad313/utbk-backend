"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleLikeKomentar = exports.deleteKomentar = exports.updateKomentar = exports.createKomentar = exports.toggleLockPost = exports.togglePinPost = exports.toggleLikePost = exports.deletePost = exports.updatePost = exports.createPost = exports.getPostById = exports.getPostList = exports.deleteKategori = exports.updateKategori = exports.createKategori = exports.getKategoriList = void 0;
const prisma_1 = require("../../config/prisma");
const generateSlug = (nama) => {
    return nama
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
};
// ==========================================
// ===== KATEGORI =====
// ==========================================
const getKategoriList = async () => {
    const kategori = await prisma_1.prisma.kategoriForumPost.findMany({
        include: {
            _count: {
                select: { posts: true }
            }
        },
        orderBy: {
            nama: 'asc'
        }
    });
    return kategori;
};
exports.getKategoriList = getKategoriList;
const createKategori = async (nama, deskripsi) => {
    if (!nama || !nama.trim()) {
        return { error: 'nama_required' };
    }
    const slug = generateSlug(nama);
    // check uniqueness
    const existing = await prisma_1.prisma.kategoriForumPost.findFirst({
        where: {
            OR: [
                { nama },
                { slug }
            ]
        }
    });
    if (existing) {
        return { error: 'kategori_already_exists' };
    }
    const kategori = await prisma_1.prisma.kategoriForumPost.create({
        data: {
            nama,
            slug,
            deskripsi
        }
    });
    return { data: kategori };
};
exports.createKategori = createKategori;
const updateKategori = async (id, data) => {
    const existing = await prisma_1.prisma.kategoriForumPost.findUnique({
        where: { id }
    });
    if (!existing) {
        return { error: 'kategori_not_found' };
    }
    const updateData = {
        deskripsi: data.deskripsi
    };
    if (data.nama) {
        if (!data.nama.trim()) {
            return { error: 'nama_required' };
        }
        const slug = generateSlug(data.nama);
        // check unique
        const duplicate = await prisma_1.prisma.kategoriForumPost.findFirst({
            where: {
                id: { not: id },
                OR: [
                    { nama: data.nama },
                    { slug }
                ]
            }
        });
        if (duplicate) {
            return { error: 'kategori_already_exists' };
        }
        updateData.nama = data.nama;
        updateData.slug = slug;
    }
    const updated = await prisma_1.prisma.kategoriForumPost.update({
        where: { id },
        data: updateData
    });
    return { data: updated };
};
exports.updateKategori = updateKategori;
const deleteKategori = async (id) => {
    const existing = await prisma_1.prisma.kategoriForumPost.findUnique({
        where: { id },
        include: {
            _count: {
                select: { posts: true }
            }
        }
    });
    if (!existing) {
        return { error: 'kategori_not_found' };
    }
    if (existing._count.posts > 0) {
        return { error: 'kategori_has_posts' };
    }
    await prisma_1.prisma.kategoriForumPost.delete({
        where: { id }
    });
    return { message: 'Kategori berhasil dihapus' };
};
exports.deleteKategori = deleteKategori;
const getPostList = async (filter, pagination) => {
    const page = pagination.page || 1;
    let limit = pagination.limit || 20;
    if (limit < 1)
        limit = 1;
    if (limit > 50)
        limit = 50;
    const skip = (page - 1) * limit;
    const whereClause = {};
    if (filter.kategoriId) {
        whereClause.kategoriId = filter.kategoriId;
    }
    if (filter.kategoriSlug) {
        whereClause.kategori = { slug: filter.kategoriSlug };
    }
    if (filter.userId) {
        whereClause.userId = filter.userId;
    }
    if (filter.isPinned !== undefined) {
        whereClause.isPinned = filter.isPinned;
    }
    if (filter.search) {
        whereClause.OR = [
            { judul: { contains: filter.search, mode: 'insensitive' } },
            { konten: { contains: filter.search, mode: 'insensitive' } }
        ];
    }
    const [total, posts] = await Promise.all([
        prisma_1.prisma.forumPost.count({ where: whereClause }),
        prisma_1.prisma.forumPost.findMany({
            where: whereClause,
            select: {
                id: true,
                judul: true,
                konten: true,
                isPinned: true,
                isLocked: true,
                likeCount: true,
                viewCount: true,
                createdAt: true,
                user: {
                    select: { id: true, name: true }
                },
                kategori: {
                    select: { id: true, nama: true, slug: true }
                },
                _count: {
                    select: { komentar: true }
                }
            },
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' }
            ],
            skip,
            take: limit
        })
    ]);
    const mappedPosts = posts.map((post) => ({
        id: post.id,
        judul: post.judul,
        konten: post.konten.length > 200 ? post.konten.substring(0, 200) + '...' : post.konten,
        isPinned: post.isPinned,
        isLocked: post.isLocked,
        likeCount: post.likeCount,
        viewCount: post.viewCount,
        jumlahKomentar: post._count.komentar,
        createdAt: post.createdAt,
        user: post.user,
        kategori: post.kategori
    }));
    const totalPages = Math.ceil(total / limit);
    return {
        data: mappedPosts,
        meta: {
            total,
            page,
            limit,
            totalPages
        }
    };
};
exports.getPostList = getPostList;
const getPostById = async (id, userId) => {
    // Check if post exists first
    const check = await prisma_1.prisma.forumPost.findUnique({
        where: { id }
    });
    if (!check) {
        return { error: 'post_not_found' };
    }
    // Increment viewCount
    const post = await prisma_1.prisma.forumPost.update({
        where: { id },
        data: {
            viewCount: { increment: 1 }
        },
        include: {
            user: {
                select: { id: true, name: true }
            },
            kategori: {
                select: { id: true, nama: true, slug: true }
            },
            komentar: {
                where: { parentId: null },
                orderBy: { createdAt: 'asc' },
                include: {
                    user: {
                        select: { id: true, name: true }
                    },
                    replies: {
                        orderBy: { createdAt: 'asc' },
                        include: {
                            user: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                }
            }
        }
    });
    // Check if user liked the post
    const userPostLike = await prisma_1.prisma.forumPostLike.findUnique({
        where: {
            postId_userId: {
                postId: id,
                userId
            }
        }
    });
    // Get all comment/reply likes in one query to avoid N+1
    const allKomentarIds = [];
    for (const kom of post.komentar) {
        allKomentarIds.push(kom.id);
        for (const rep of kom.replies) {
            allKomentarIds.push(rep.id);
        }
    }
    const userKomentarLikes = await prisma_1.prisma.forumKomentarLike.findMany({
        where: {
            userId,
            komentarId: { in: allKomentarIds }
        }
    });
    const likedKomentarIds = new Set(userKomentarLikes.map((l) => l.komentarId));
    const formattedKomentar = post.komentar.map((kom) => ({
        id: kom.id,
        konten: kom.konten,
        likeCount: kom.likeCount,
        isLikedByUser: likedKomentarIds.has(kom.id),
        createdAt: kom.createdAt,
        user: kom.user,
        replies: kom.replies.map((rep) => ({
            id: rep.id,
            konten: rep.konten,
            likeCount: rep.likeCount,
            isLikedByUser: likedKomentarIds.has(rep.id),
            createdAt: rep.createdAt,
            user: rep.user
        }))
    }));
    const formattedPost = {
        id: post.id,
        judul: post.judul,
        konten: post.konten,
        isPinned: post.isPinned,
        isLocked: post.isLocked,
        likeCount: post.likeCount,
        viewCount: post.viewCount,
        isLikedByUser: !!userPostLike,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: post.user,
        kategori: post.kategori,
        komentar: formattedKomentar
    };
    return { data: formattedPost };
};
exports.getPostById = getPostById;
const createPost = async (userId, data) => {
    if (!data.judul || data.judul.trim().length < 5) {
        return { error: 'judul_invalid' };
    }
    if (!data.konten || data.konten.trim().length < 10) {
        return { error: 'konten_invalid' };
    }
    const kategori = await prisma_1.prisma.kategoriForumPost.findUnique({
        where: { id: data.kategoriId }
    });
    if (!kategori) {
        return { error: 'kategori_invalid' };
    }
    const post = await prisma_1.prisma.forumPost.create({
        data: {
            userId,
            kategoriId: data.kategoriId,
            judul: data.judul,
            konten: data.konten
        },
        include: {
            user: {
                select: { id: true, name: true }
            },
            kategori: {
                select: { id: true, nama: true, slug: true }
            }
        }
    });
    return { data: post };
};
exports.createPost = createPost;
const updatePost = async (id, userId, data) => {
    const post = await prisma_1.prisma.forumPost.findUnique({
        where: { id }
    });
    if (!post) {
        return { error: 'post_not_found' };
    }
    if (post.userId !== userId) {
        return { error: 'forbidden' };
    }
    const updateData = {};
    if (data.judul !== undefined) {
        if (data.judul.trim().length < 5) {
            return { error: 'judul_invalid' };
        }
        updateData.judul = data.judul;
    }
    if (data.konten !== undefined) {
        if (data.konten.trim().length < 10) {
            return { error: 'konten_invalid' };
        }
        updateData.konten = data.konten;
    }
    const updated = await prisma_1.prisma.forumPost.update({
        where: { id },
        data: updateData,
        include: {
            user: {
                select: { id: true, name: true }
            },
            kategori: {
                select: { id: true, nama: true, slug: true }
            }
        }
    });
    return { data: updated };
};
exports.updatePost = updatePost;
const deletePost = async (id, userId, role) => {
    const post = await prisma_1.prisma.forumPost.findUnique({
        where: { id }
    });
    if (!post) {
        return { error: 'post_not_found' };
    }
    if (role !== 'ADMIN' && post.userId !== userId) {
        return { error: 'forbidden' };
    }
    // Get comments to delete comment likes
    const comments = await prisma_1.prisma.forumKomentar.findMany({
        where: { postId: id }
    });
    const commentIds = comments.map((c) => c.id);
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.forumKomentarLike.deleteMany({
            where: { komentarId: { in: commentIds } }
        }),
        prisma_1.prisma.forumKomentar.deleteMany({
            where: { postId: id }
        }),
        prisma_1.prisma.forumPostLike.deleteMany({
            where: { postId: id }
        }),
        prisma_1.prisma.forumPost.delete({
            where: { id }
        })
    ]);
    return { message: 'Post berhasil dihapus' };
};
exports.deletePost = deletePost;
const toggleLikePost = async (postId, userId) => {
    const post = await prisma_1.prisma.forumPost.findUnique({
        where: { id: postId }
    });
    if (!post) {
        return { error: 'post_not_found' };
    }
    const existingLike = await prisma_1.prisma.forumPostLike.findUnique({
        where: {
            postId_userId: {
                postId,
                userId
            }
        }
    });
    const liked = !existingLike;
    const updatedPost = await prisma_1.prisma.$transaction(async (tx) => {
        if (liked) {
            await tx.forumPostLike.create({
                data: { postId, userId }
            });
            return tx.forumPost.update({
                where: { id: postId },
                data: { likeCount: { increment: 1 } }
            });
        }
        else {
            await tx.forumPostLike.delete({
                where: {
                    postId_userId: { postId, userId }
                }
            });
            return tx.forumPost.update({
                where: { id: postId },
                data: { likeCount: { decrement: 1 } }
            });
        }
    });
    return {
        data: {
            liked,
            likeCount: updatedPost.likeCount
        }
    };
};
exports.toggleLikePost = toggleLikePost;
const togglePinPost = async (id) => {
    const post = await prisma_1.prisma.forumPost.findUnique({
        where: { id }
    });
    if (!post) {
        return { error: 'post_not_found' };
    }
    const updated = await prisma_1.prisma.forumPost.update({
        where: { id },
        data: {
            isPinned: !post.isPinned
        }
    });
    return { data: updated };
};
exports.togglePinPost = togglePinPost;
const toggleLockPost = async (id) => {
    const post = await prisma_1.prisma.forumPost.findUnique({
        where: { id }
    });
    if (!post) {
        return { error: 'post_not_found' };
    }
    const updated = await prisma_1.prisma.forumPost.update({
        where: { id },
        data: {
            isLocked: !post.isLocked
        }
    });
    return { data: updated };
};
exports.toggleLockPost = toggleLockPost;
// ==========================================
// ===== KOMENTAR =====
// ==========================================
const createKomentar = async (postId, userId, data) => {
    const post = await prisma_1.prisma.forumPost.findUnique({
        where: { id: postId }
    });
    if (!post) {
        return { error: 'post_not_found' };
    }
    if (post.isLocked) {
        return { error: 'post_locked' };
    }
    if (!data.konten || data.konten.trim().length < 3) {
        return { error: 'konten_invalid' };
    }
    if (data.parentId) {
        const parent = await prisma_1.prisma.forumKomentar.findUnique({
            where: { id: data.parentId }
        });
        if (!parent || parent.postId !== postId) {
            return { error: 'parent_komentar_not_found' };
        }
        // Cannot reply to reply (reply level 3 is forbidden)
        if (parent.parentId !== null) {
            return { error: 'cannot_reply_to_reply' };
        }
    }
    const komentar = await prisma_1.prisma.forumKomentar.create({
        data: {
            postId,
            userId,
            konten: data.konten,
            parentId: data.parentId || null
        },
        include: {
            user: {
                select: { id: true, name: true }
            }
        }
    });
    return { data: komentar };
};
exports.createKomentar = createKomentar;
const updateKomentar = async (id, userId, konten) => {
    if (!konten || konten.trim().length < 3) {
        return { error: 'konten_invalid' };
    }
    const komentar = await prisma_1.prisma.forumKomentar.findUnique({
        where: { id }
    });
    if (!komentar) {
        return { error: 'komentar_not_found' };
    }
    if (komentar.userId !== userId) {
        return { error: 'forbidden' };
    }
    const updated = await prisma_1.prisma.forumKomentar.update({
        where: { id },
        data: { konten },
        include: {
            user: {
                select: { id: true, name: true }
            }
        }
    });
    return { data: updated };
};
exports.updateKomentar = updateKomentar;
const deleteKomentar = async (id, userId, role) => {
    const komentar = await prisma_1.prisma.forumKomentar.findUnique({
        where: { id },
        include: { replies: true }
    });
    if (!komentar)
        return { error: 'komentar_not_found' };
    if (role !== 'ADMIN' && komentar.userId !== userId) {
        return { error: 'forbidden' };
    }
    const replyIds = komentar.replies.map((r) => r.id);
    await prisma_1.prisma.$transaction([
        // 1. Hapus like dari semua replies dulu
        prisma_1.prisma.forumKomentarLike.deleteMany({
            where: { komentarId: { in: replyIds } }
        }),
        // 2. Hapus semua replies
        prisma_1.prisma.forumKomentar.deleteMany({
            where: { parentId: id }
        }),
        // 3. Hapus like dari komentar itu sendiri
        prisma_1.prisma.forumKomentarLike.deleteMany({
            where: { komentarId: id }
        }),
        // 4. Baru hapus komentar
        prisma_1.prisma.forumKomentar.delete({
            where: { id }
        })
    ]);
    return { message: 'Komentar berhasil dihapus' };
};
exports.deleteKomentar = deleteKomentar;
const toggleLikeKomentar = async (komentarId, userId) => {
    const komentar = await prisma_1.prisma.forumKomentar.findUnique({
        where: { id: komentarId }
    });
    if (!komentar) {
        return { error: 'komentar_not_found' };
    }
    const existingLike = await prisma_1.prisma.forumKomentarLike.findUnique({
        where: {
            komentarId_userId: {
                komentarId,
                userId
            }
        }
    });
    const liked = !existingLike;
    const updatedKomentar = await prisma_1.prisma.$transaction(async (tx) => {
        if (liked) {
            await tx.forumKomentarLike.create({
                data: { komentarId, userId }
            });
            return tx.forumKomentar.update({
                where: { id: komentarId },
                data: { likeCount: { increment: 1 } }
            });
        }
        else {
            await tx.forumKomentarLike.delete({
                where: {
                    komentarId_userId: { komentarId, userId }
                }
            });
            return tx.forumKomentar.update({
                where: { id: komentarId },
                data: { likeCount: { decrement: 1 } }
            });
        }
    });
    return {
        data: {
            liked,
            likeCount: updatedKomentar.likeCount
        }
    };
};
exports.toggleLikeKomentar = toggleLikeKomentar;

import request from 'supertest'
import app from '../app'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

vi.mock('../config/supabase', () => ({
  supabase: { auth: { signUp: vi.fn(), signInWithPassword: vi.fn() } },
  supabaseAdmin: {
    auth: {
      getUser: vi.fn().mockImplementation(async (token: string) => {
        if (token === 'siswa-token') {
          return { data: { user: { id: 'test-notif-siswa-uuid', email: 'siswa-notif@utbk.dev' } }, error: null }
        }
        if (token === 'siswa2-token') {
          return { data: { user: { id: 'test-notif-siswa2-uuid', email: 'siswa2-notif@utbk.dev' } }, error: null }
        }
        return { data: { user: null }, error: new Error('Token tidak valid') }
      })
    }
  }
}))

let notifIdSiswaUnread1: string;
let notifIdSiswaUnread2: string;
let notifIdSiswaRead: string;
let notifIdSiswa2: string;

beforeAll(async () => {
  const { prisma } = await import('../config/prisma')

  await prisma.user.upsert({
    where: { id: 'test-notif-siswa-uuid' },
    update: {},
    create: { id: 'test-notif-siswa-uuid', email: 'siswa-notif@utbk.dev', name: 'Test Siswa Notif', role: 'SISWA' }
  })

  await prisma.user.upsert({
    where: { id: 'test-notif-siswa2-uuid' },
    update: {},
    create: { id: 'test-notif-siswa2-uuid', email: 'siswa2-notif@utbk.dev', name: 'Test Siswa Notif 2', role: 'SISWA' }
  })

  // Buat notifikasi test langsung via Prisma
  const notifs = await prisma.notifikasi.createManyAndReturn({
    data: [
      {
        userId: 'test-notif-siswa-uuid',
        judul: 'Test Notif 1',
        pesan: 'Pesan notifikasi pertama',
        tipe: 'tryout_result',
        isRead: false,
        data: { tryoutId: 'uuid-test' }
      },
      {
        userId: 'test-notif-siswa-uuid',
        judul: 'Test Notif 2',
        pesan: 'Pesan notifikasi kedua',
        tipe: 'forum_reply',
        isRead: false,
        data: { postId: 'uuid-test' }
      },
      {
        userId: 'test-notif-siswa-uuid',
        judul: 'Test Notif 3',
        pesan: 'Pesan notifikasi ketiga sudah dibaca',
        tipe: 'tryout_started',
        isRead: true
      },
      {
        userId: 'test-notif-siswa2-uuid',
        judul: 'Test Notif 4',
        pesan: 'Notifikasi user lain',
        tipe: 'tryout_result',
        isRead: false
      }
    ]
  })

  const n1 = notifs.find(n => n.judul === 'Test Notif 1');
  const n2 = notifs.find(n => n.judul === 'Test Notif 2');
  const n3 = notifs.find(n => n.judul === 'Test Notif 3');
  const n4 = notifs.find(n => n.judul === 'Test Notif 4');
  
  if (n1) notifIdSiswaUnread1 = n1.id;
  if (n2) notifIdSiswaUnread2 = n2.id;
  if (n3) notifIdSiswaRead = n3.id;
  if (n4) notifIdSiswa2 = n4.id;
})

afterAll(async () => {
  const { prisma } = await import('../config/prisma')

  await prisma.notifikasi.deleteMany({
    where: { userId: { in: ['test-notif-siswa-uuid', 'test-notif-siswa2-uuid'] } }
  })
  await prisma.user.deleteMany({
    where: { id: { in: ['test-notif-siswa-uuid', 'test-notif-siswa2-uuid'] } }
  })
})

describe('GET /api/v1/notifikasi', () => {
  it('gagal tanpa token (401)', async () => {
    const res = await request(app).get('/api/v1/notifikasi')
    expect(res.status).toBe(401)
  })

  it('berhasil mendapat daftar notifikasi milik user', async () => {
    const res = await request(app)
      .get('/api/v1/notifikasi')
      .set('Authorization', 'Bearer siswa-token')

    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(res.body.data.notifikasi.length).toBeGreaterThanOrEqual(3)
  })

  it('notifikasi unread muncul di atas', async () => {
    const res = await request(app)
      .get('/api/v1/notifikasi')
      .set('Authorization', 'Bearer siswa-token')

    expect(res.status).toBe(200)
    // assuming they are ordered properly: unread first
    const firstNotif = res.body.data.notifikasi[0]
    expect(firstNotif.isRead).toBe(false)
  })

  it('response berisi total dan unreadCount yang benar', async () => {
    const res = await request(app)
      .get('/api/v1/notifikasi')
      .set('Authorization', 'Bearer siswa-token')

    expect(res.status).toBe(200)
    expect(res.body.data.total).toBe(3)
    expect(res.body.data.unreadCount).toBe(2)
  })

  it('tidak menampilkan notifikasi milik user lain', async () => {
    const res = await request(app)
      .get('/api/v1/notifikasi')
      .set('Authorization', 'Bearer siswa-token')

    expect(res.status).toBe(200)
    const hasOtherUserNotif = res.body.data.notifikasi.some((n: any) => n.id === notifIdSiswa2)
    expect(hasOtherUserNotif).toBe(false)
  })
})

describe('GET /api/v1/notifikasi/unread-count', () => {
  it('berhasil mendapat jumlah notifikasi unread', async () => {
    const res = await request(app)
      .get('/api/v1/notifikasi/unread-count')
      .set('Authorization', 'Bearer siswa-token')

    expect(res.status).toBe(200)
    expect(res.body.data.unreadCount).toBe(2)
  })

  it('return 0 jika semua sudah dibaca', async () => {
    const res = await request(app)
      .get('/api/v1/notifikasi/unread-count')
      .set('Authorization', 'Bearer siswa2-token')
    
    // We didn't read them but we can just mark all as read for siswa2 to test this
    await request(app)
      .patch('/api/v1/notifikasi/read-all')
      .set('Authorization', 'Bearer siswa2-token')

    const res2 = await request(app)
      .get('/api/v1/notifikasi/unread-count')
      .set('Authorization', 'Bearer siswa2-token')

    expect(res2.status).toBe(200)
    expect(res2.body.data.unreadCount).toBe(0)
  })
})

describe('PATCH /api/v1/notifikasi/:id/read', () => {
  it('berhasil tandai notifikasi sebagai dibaca', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifikasi/${notifIdSiswaUnread1}/read`)
      .set('Authorization', 'Bearer siswa-token')

    expect(res.status).toBe(200)
    expect(res.body.data.isRead).toBe(true)
    expect(res.body.data.id).toBe(notifIdSiswaUnread1)
  })

  it('gagal jika notifikasi milik user lain (403)', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifikasi/${notifIdSiswaUnread2}/read`)
      .set('Authorization', 'Bearer siswa2-token')

    expect(res.status).toBe(403)
  })

  it('kembalikan 404 jika notifikasi tidak ditemukan', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifikasi/wrong-id-123/read`)
      .set('Authorization', 'Bearer siswa-token')

    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/notifikasi/read-all', () => {
  it('berhasil tandai semua notifikasi sebagai dibaca', async () => {
    const res = await request(app)
      .patch('/api/v1/notifikasi/read-all')
      .set('Authorization', 'Bearer siswa-token')

    expect(res.status).toBe(200)
    expect(res.body.data.updatedCount).toBeGreaterThanOrEqual(1) // notifIdSiswaUnread2 is still unread
  })

  it('unread-count menjadi 0 setelah read-all', async () => {
    const res = await request(app)
      .get('/api/v1/notifikasi/unread-count')
      .set('Authorization', 'Bearer siswa-token')

    expect(res.status).toBe(200)
    expect(res.body.data.unreadCount).toBe(0)
  })
})

describe('DELETE /api/v1/notifikasi/:id', () => {
  it('gagal hapus notifikasi milik user lain (403)', async () => {
    const res = await request(app)
      .delete(`/api/v1/notifikasi/${notifIdSiswaRead}`)
      .set('Authorization', 'Bearer siswa2-token')

    expect(res.status).toBe(403)
  })

  it('kembalikan 404 jika notifikasi tidak ditemukan', async () => {
    const res = await request(app)
      .delete(`/api/v1/notifikasi/wrong-id-123`)
      .set('Authorization', 'Bearer siswa-token')

    expect(res.status).toBe(404)
  })

  it('berhasil hapus notifikasi milik sendiri', async () => {
    const res = await request(app)
      .delete(`/api/v1/notifikasi/${notifIdSiswaRead}`)
      .set('Authorization', 'Bearer siswa-token')

    expect(res.status).toBe(200)
  })
})

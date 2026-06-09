# UTBK Platform API Documentation

## Base URL

```
development: http://localhost:3000/api/v1
production: https://utbk-backend-production.up.railway.app/api/v1
alternatif: https://syarip0227-utbk-pro.hf.space/api/v1/
```

## Authentication

API ini menggunakan **Supabase Auth** dengan skema Bearer Token.

Untuk endpoint yang membutuhkan autentikasi, sertakan header berikut:

```
Authorization: Bearer <access_token>
```

Token didapatkan dari response endpoint `POST /api/v1/auth/login`.

---

## Endpoints

### Auth

#### POST /api/v1/auth/register

**Deskripsi:** Registrasi akun baru menggunakan email dan password. Email verifikasi akan dikirim otomatis oleh Supabase.  
**Auth required:** Tidak  
**Role required:** Tidak ada (Semua)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "siswa@utbk.dev",
  "password": "Password123!",
  "name": "Ahmad Fauzi"
}
```

**Success Response** `201 Created`:
```json
{
  "message": "Registrasi berhasil, cek email untuk verifikasi",
  "user": {
    "id": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
    "email": "siswa@utbk.dev"
  }
}
```

**Error Responses:**

`400 Bad Request` — email sudah terdaftar:
```json
{
  "message": "User already registered"
}
```

---

#### POST /api/v1/auth/login

**Deskripsi:** Login dengan email dan password, mengembalikan access token Supabase.  
**Auth required:** Tidak  
**Role required:** Tidak ada (Semua)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "siswa@utbk.dev",
  "password": "Password123!"
}
```

**Success Response** `200 OK`:
```json
{
  "message": "Login berhasil",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
    "email": "siswa@utbk.dev"
  }
}
```

**Error Responses:**

`400 Bad Request` — kredensial salah:
```json
{
  "message": "Invalid login credentials"
}
```

---

#### POST /api/v1/auth/logout

**Deskripsi:** Logout user dan invalidate token yang sedang aktif.  
**Auth required:** Ya  
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** `200 OK`:
```json
{
  "message": "Logout berhasil"
}
```

**Error Responses:**

`401 Unauthorized` — token tidak ditemukan:
```json
{
  "message": "Token tidak ditemukan"
}
```

`401 Unauthorized` — token tidak valid atau expired:
```json
{
  "message": "Token tidak valid atau sudah expired"
}
```

---

#### GET /api/v1/auth/me

**Deskripsi:** Mengambil data profil user yang sedang login dari database.  
**Auth required:** Ya  
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
    "email": "siswa@utbk.dev",
    "name": "Ahmad Fauzi",
    "role": "SISWA",
    "createdAt": "2026-05-20T10:30:00.000Z"
  }
}
```

**Error Responses:**

`401 Unauthorized` — token tidak valid atau expired:
```json
{
  "message": "Token tidak valid atau sudah expired"
}
```

`404 Not Found` — user tidak ditemukan di database:
```json
{
  "message": "User tidak ditemukan"
}
```

---

#### PATCH /api/v1/auth/role

**Deskripsi:** Mengubah role dari user tertentu (khusus untuk admin).  
**Auth required:** Ya  
**Role required:** `ADMIN`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**Request Body:**
```json
{
  "userId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
  "role": "ADMIN"
}
```

**Success Response** `200 OK`:
```json
{
  "message": "Role berhasil diubah",
  "data": {
    "id": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
    "email": "siswa@utbk.dev",
    "name": "Ahmad Fauzi",
    "role": "ADMIN"
  }
}
```

**Error Responses:**

`400 Bad Request` — parameter body tidak lengkap atau tidak valid:
```json
{
  "message": "userId dan role wajib diisi"
}
```
Atau:
```json
{
  "message": "Role tidak valid. Gunakan ADMIN atau SISWA"
}
```

`401 Unauthorized` — token tidak valid, tidak ditemukan, atau expired:
```json
{
  "message": "Token tidak valid atau sudah expired"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — user target tidak ditemukan di database:
```json
{
  "message": "User tidak ditemukan di database"
}
```

---

### Soal

> **Catatan:** Field `jawaban` (kunci jawaban benar) **tidak pernah dikembalikan** di response endpoint Soal manapun (GET, POST, PUT, DELETE).

#### GET /api/v1/soal

**Deskripsi:** Mengambil daftar semua soal. Mendukung filter berdasarkan `mapel` dan `tingkat`.  
**Auth required:** Ya  
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

| Parameter | Tipe   | Wajib | Nilai yang diterima                    |
|-----------|--------|-------|----------------------------------------|
| `mapel`   | string | Tidak | `TPS`, `TKA_SAINTEK`, `TKA_SOSHUM`    |
| `tingkat` | string | Tidak | `mudah`, `sedang`, `sulit`             |

**Contoh Request:**
```
GET /api/v1/soal?mapel=TPS&tingkat=mudah
```

**Success Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "pertanyaan": "Jika semua kucing adalah hewan, dan semua hewan bernapas, maka...",
      "opsi": {
        "A": "Semua kucing bernapas",
        "B": "Beberapa kucing tidak bernapas",
        "C": "Semua hewan adalah kucing",
        "D": "Tidak ada kucing yang bernapas",
        "E": "Semua yang bernapas adalah kucing"
      },
      "pembahasan": "Berdasarkan silogisme, jika semua kucing adalah hewan dan semua hewan bernapas, maka semua kucing bernapas.",
      "mapel": "TPS",
      "tingkat": "mudah",
      "createdAt": "2026-05-20T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

`400 Bad Request` — mapel tidak valid:
```json
{
  "message": "Mapel tidak valid"
}
```

`400 Bad Request` — tingkat tidak valid:
```json
{
  "message": "Tingkat tidak valid"
}
```

---

#### GET /api/v1/soal/:id

**Deskripsi:** Mengambil detail satu soal berdasarkan ID.  
**Auth required:** Ya  
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `id`      | string | Ya    | UUID soal       |

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "pertanyaan": "Jika semua kucing adalah hewan, dan semua hewan bernapas, maka...",
    "opsi": {
      "A": "Semua kucing bernapas",
      "B": "Beberapa kucing tidak bernapas",
      "C": "Semua hewan adalah kucing",
      "D": "Tidak ada kucing yang bernapas",
      "E": "Semua yang bernapas adalah kucing"
    },
    "pembahasan": "Berdasarkan silogisme, jika semua kucing adalah hewan dan semua hewan bernapas, maka semua kucing bernapas.",
    "mapel": "TPS",
    "tingkat": "mudah",
    "createdAt": "2026-05-20T10:30:00.000Z"
  }
}
```

**Error Responses:**

`404 Not Found` — soal tidak ditemukan:
```json
{
  "message": "Soal tidak ditemukan"
}
```

---

#### POST /api/v1/soal

**Deskripsi:** Membuat soal baru. Field `jawaban` dikirim di request body tetapi **tidak dikembalikan** di response.  
**Auth required:** Ya  
**Role required:** `ADMIN`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**Request Body:**
```json
{
  "pertanyaan": "Jika semua kucing adalah hewan, dan semua hewan bernapas, maka...",
  "opsi": {
    "A": "Semua kucing bernapas",
    "B": "Beberapa kucing tidak bernapas",
    "C": "Semua hewan adalah kucing",
    "D": "Tidak ada kucing yang bernapas",
    "E": "Semua yang bernapas adalah kucing"
  },
  "jawaban": "A",
  "pembahasan": "Berdasarkan silogisme, jika semua kucing adalah hewan dan semua hewan bernapas, maka semua kucing bernapas.",
  "mapel": "TPS",
  "tingkat": "mudah"
}
```

**Success Response** `201 Created`:
```json
{
  "message": "Berhasil dibuat",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "pertanyaan": "Jika semua kucing adalah hewan, dan semua hewan bernapas, maka...",
    "opsi": {
      "A": "Semua kucing bernapas",
      "B": "Beberapa kucing tidak bernapas",
      "C": "Semua hewan adalah kucing",
      "D": "Tidak ada kucing yang bernapas",
      "E": "Semua yang bernapas adalah kucing"
    },
    "pembahasan": "Berdasarkan silogisme, jika semua kucing adalah hewan dan semua hewan bernapas, maka semua kucing bernapas.",
    "mapel": "TPS",
    "tingkat": "mudah",
    "createdAt": "2026-05-20T10:30:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` — pertanyaan kosong:
```json
{
  "message": "Pertanyaan harus diisi dan berupa string"
}
```

`400 Bad Request` — opsi tidak lengkap:
```json
{
  "message": "Opsi A harus diisi dan berupa string"
}
```

`400 Bad Request` — jawaban tidak valid:
```json
{
  "message": "Jawaban tidak valid, harus A, B, C, D, atau E"
}
```

`400 Bad Request` — mapel tidak valid:
```json
{
  "message": "Mapel tidak valid, harus TPS, TKA_SAINTEK, atau TKA_SOSHUM"
}
```

`400 Bad Request` — tingkat tidak valid:
```json
{
  "message": "Tingkat tidak valid, harus mudah, sedang, atau sulit"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

---

#### PUT /api/v1/soal/:id

**Deskripsi:** Mengupdate soal berdasarkan ID. Hanya field yang dikirim yang akan diupdate (partial update). Field `jawaban` **tidak dikembalikan** di response.  
**Auth required:** Ya  
**Role required:** `ADMIN`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `id`      | string | Ya    | UUID soal       |

**Request Body (semua field opsional):**
```json
{
  "pertanyaan": "Pertanyaan yang sudah diupdate?",
  "tingkat": "sedang"
}
```

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "pertanyaan": "Pertanyaan yang sudah diupdate?",
    "opsi": {
      "A": "Semua kucing bernapas",
      "B": "Beberapa kucing tidak bernapas",
      "C": "Semua hewan adalah kucing",
      "D": "Tidak ada kucing yang bernapas",
      "E": "Semua yang bernapas adalah kucing"
    },
    "pembahasan": "Berdasarkan silogisme, jika semua kucing adalah hewan dan semua hewan bernapas, maka semua kucing bernapas.",
    "mapel": "TPS",
    "tingkat": "sedang",
    "createdAt": "2026-05-20T10:30:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` — tingkat tidak valid:
```json
{
  "message": "Tingkat tidak valid"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — soal tidak ditemukan:
```json
{
  "message": "Soal tidak ditemukan"
}
```

---

#### DELETE /api/v1/soal/:id

**Deskripsi:** Menghapus soal berdasarkan ID.  
**Auth required:** Ya  
**Role required:** `ADMIN`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `id`      | string | Ya    | UUID soal       |

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "pertanyaan": "Jika semua kucing adalah hewan, dan semua hewan bernapas, maka...",
    "opsi": {
      "A": "Semua kucing bernapas",
      "B": "Beberapa kucing tidak bernapas",
      "C": "Semua hewan adalah kucing",
      "D": "Tidak ada kucing yang bernapas",
      "E": "Semua yang bernapas adalah kucing"
    },
    "pembahasan": "Berdasarkan silogisme, jika semua kucing adalah hewan dan semua hewan bernapas, maka semua kucing bernapas.",
    "mapel": "TPS",
    "tingkat": "mudah",
    "createdAt": "2026-05-20T10:30:00.000Z"
  }
}
```

**Error Responses:**

`403 Forbidden` — role pengakses bukan ADMIN:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — soal tidak ditemukan:
```json
{
  "message": "Soal tidak ditemukan"
}
```

---

### Latihan

#### POST /api/v1/latihan/mulai

**Deskripsi:** Memulai sesi latihan baru. Soal akan diacak menggunakan algoritma Fisher-Yates. Jika soal yang tersedia di database kurang dari jumlah yang diminta, akan dikembalikan soal sebanyak yang tersedia tanpa error.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "mapel": "TPS",
  "jumlah": 10
}
```

| Field    | Tipe   | Wajib | Validasi                                     |
|----------|--------|-------|----------------------------------------------|
| `mapel`  | string | Ya    | `TPS`, `TKA_SAINTEK`, `TKA_SOSHUM`           |
| `jumlah` | number | Ya    | Integer, minimum 1, maksimum 40              |

**Success Response** `201 Created`:
```json
{
  "data": {
    "id": "f7e8d9c0-b1a2-3456-7890-abcdef012345",
    "mapel": "TPS",
    "selesai": false,
    "createdAt": "2026-05-22T08:00:00.000Z",
    "soal": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "pertanyaan": "Jika semua kucing adalah hewan, dan semua hewan bernapas, maka...",
        "opsi": {
          "A": "Semua kucing bernapas",
          "B": "Beberapa kucing tidak bernapas",
          "C": "Semua hewan adalah kucing",
          "D": "Tidak ada kucing yang bernapas",
          "E": "Semua yang bernapas adalah kucing"
        },
        "pembahasan": "Berdasarkan silogisme, jika semua kucing adalah hewan dan semua hewan bernapas, maka semua kucing bernapas.",
        "mapel": "TPS",
        "tingkat": "mudah",
        "createdAt": "2026-05-20T10:30:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

`400 Bad Request` — mapel tidak valid:
```json
{
  "message": "Mapel tidak valid, harus TPS, TKA_SAINTEK, atau TKA_SOSHUM"
}
```

`400 Bad Request` — jumlah di luar range:
```json
{
  "message": "Jumlah soal tidak valid, harus antara 1 dan 40"
}
```

`400 Bad Request` — tidak ada soal tersedia:
```json
{
  "message": "Tidak ada soal tersedia untuk mata pelajaran ini"
}
```

`403 Forbidden` — role pengakses bukan SISWA:
```json
{
  "message": "Akses ditolak. Diperlukan role: SISWA"
}
```

---

#### POST /api/v1/latihan/:sessionId/submit

**Deskripsi:** Submit jawaban untuk sesi latihan. Skor dihitung otomatis berdasarkan persentase jawaban benar, dibulatkan ke integer terdekat. Data jawaban dan update skor disimpan dalam satu transaksi database.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**

| Parameter   | Tipe   | Wajib | Deskripsi              |
|-------------|--------|-------|------------------------|
| `sessionId` | string | Ya    | UUID sesi latihan      |

**Request Body:**
```json
{
  "jawabans": [
    { "soalId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "jawaban": "A" },
    { "soalId": "b2c3d4e5-f6a7-8901-bcde-f12345678901", "jawaban": "C" }
  ]
}
```

| Field             | Tipe   | Wajib | Validasi                  |
|-------------------|--------|-------|---------------------------|
| `jawabans`        | array  | Ya    | Array of object           |
| `jawabans[].soalId` | string | Ya  | UUID soal yang valid      |
| `jawabans[].jawaban` | string | Ya | `A`, `B`, `C`, `D`, `E`  |

**Success Response** `200 OK`:
```json
{
  "data": {
    "skor": 50,
    "jumlahBenar": 1,
    "jumlahSalah": 1,
    "totalSoal": 2
  }
}
```

**Error Responses:**

`400 Bad Request` — session sudah selesai:
```json
{
  "message": "Sesi latihan sudah selesai"
}
```

`400 Bad Request` — jawaban kosong atau format tidak valid:
```json
{
  "message": "Jawaban tidak boleh kosong"
}
```

`403 Forbidden` — session milik user lain ATAU role pengakses bukan SISWA:
```json
{
  "message": "Anda tidak memiliki akses ke sesi ini"
}
```

`404 Not Found` — session tidak ditemukan:
```json
{
  "message": "Sesi latihan tidak ditemukan"
}
```

---

#### GET /api/v1/latihan/riwayat

**Deskripsi:** Mengambil daftar riwayat semua sesi latihan milik user yang sedang login, diurutkan dari yang terbaru.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "f7e8d9c0-b1a2-3456-7890-abcdef012345",
      "userId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
      "mapel": "TPS",
      "skor": 80,
      "selesai": true,
      "createdAt": "2026-05-22T08:00:00.000Z"
    },
    {
      "id": "e6d7c8b9-a0f1-2345-6789-abcdef012345",
      "userId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
      "mapel": "TKA_SAINTEK",
      "skor": null,
      "selesai": false,
      "createdAt": "2026-05-21T14:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

`403 Forbidden` — role pengakses bukan SISWA:
```json
{
  "message": "Akses ditolak. Diperlukan role: SISWA"
}
```

---

#### GET /api/v1/latihan/:sessionId

**Deskripsi:** Mengambil detail lengkap sesi latihan, termasuk jawaban user, kunci jawaban benar, status benar/salah, dan pembahasan untuk setiap soal.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**

| Parameter   | Tipe   | Wajib | Deskripsi              |
|-------------|--------|-------|------------------------|
| `sessionId` | string | Ya    | UUID sesi latihan      |

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "f7e8d9c0-b1a2-3456-7890-abcdef012345",
    "mapel": "TPS",
    "skor": 50,
    "selesai": true,
    "createdAt": "2026-05-22T08:00:00.000Z",
    "jawabans": [
      {
        "id": "d4e5f6a7-b8c9-0123-4567-890abcdef012",
        "soalId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "jawabanUser": "A",
        "kunciJawaban": "A",
        "benar": true,
        "soal": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "pertanyaan": "Jika semua kucing adalah hewan, dan semua hewan bernapas, maka...",
          "opsi": {
            "A": "Semua kucing bernapas",
            "B": "Beberapa kucing tidak bernapas",
            "C": "Semua hewan adalah kucing",
            "D": "Tidak ada kucing yang bernapas",
            "E": "Semua yang bernapas adalah kucing"
          },
          "pembahasan": "Berdasarkan silogisme, jika semua kucing adalah hewan dan semua hewan bernapas, maka semua kucing bernapas.",
          "mapel": "TPS",
          "tingkat": "mudah"
        }
      },
      {
        "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef01",
        "soalId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "jawabanUser": "A",
        "kunciJawaban": "C",
        "benar": false,
        "soal": {
          "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          "pertanyaan": "Berapakah hasil dari 15% × 240?",
          "opsi": {
            "A": "30",
            "B": "32",
            "C": "36",
            "D": "40",
            "E": "42"
          },
          "pembahasan": "15% × 240 = 15/100 × 240 = 36.",
          "mapel": "TPS",
          "tingkat": "sedang"
        }
      }
    ]
  }
}
```

**Error Responses:**

`403 Forbidden` — session milik user lain ATAU role pengakses bukan SISWA:
```json
{
  "message": "Anda tidak memiliki akses ke sesi ini"
}
```

`404 Not Found` — session tidak ditemukan:
```json
{
  "message": "Sesi latihan tidak ditemukan"
}
```

---

### Info PTN

#### GET /api/v1/info/jalur

**Deskripsi:** Mengambil daftar semua jalur masuk PTN yang tersedia.  
**Auth required:** Tidak  
**Role required:** Tidak ada (Semua)

**Success Response** `200 OK`:
```json
{
  "data": [
    {
      "slug": "snbt",
      "nama": "SNBT (Seleksi Nasional Berdasarkan Tes)",
      "deskripsi": "Seleksi masuk PTN berdasarkan hasil UTBK-SNBT",
      "syarat": [
        "Lulusan SMA/MA/SMK maksimal 3 tahun terakhir",
        "Setiap siswa hanya bisa ikut UTBK 2 kali"
      ],
      "tahapan": [
        "Pendaftaran akun SNPMB",
        "Daftar UTBK",
        "Pelaksanaan UTBK",
        "Pengumuman"
      ],
      "tips": [
        "Fokus pada TPS karena berlaku untuk semua jurusan",
        "Latihan soal minimal 2 jam per hari"
      ]
    },
    {
      "slug": "mandiri",
      "nama": "Jalur Mandiri",
      "deskripsi": "Seleksi yang diselenggarakan langsung oleh masing-masing PTN",
      "syarat": ["..."],
      "tahapan": ["..."],
      "tips": ["..."]
    },
    {
      "slug": "prestasi",
      "nama": "Jalur Prestasi (SNBP)",
      "deskripsi": "Seleksi berdasarkan prestasi akademik dan non-akademik",
      "syarat": ["..."],
      "tahapan": ["..."],
      "tips": ["..."]
    }
  ]
}
```

---

#### GET /api/v1/info/jalur/:slug

**Deskripsi:** Mengambil detail jalur masuk PTN berdasarkan slug.  
**Auth required:** Tidak  
**Role required:** Tidak ada (Semua)

**URL Parameters:**

| Parameter | Tipe   | Wajib | Nilai yang diterima               |
|-----------|--------|-------|-----------------------------------|
| `slug`    | string | Ya    | `snbt`, `mandiri`, `prestasi`     |

**Contoh Request:**
```
GET /api/v1/info/jalur/snbt
```

**Success Response** `200 OK`:
```json
{
  "data": {
    "slug": "snbt",
    "nama": "SNBT (Seleksi Nasional Berdasarkan Tes)",
    "deskripsi": "Seleksi masuk PTN berdasarkan hasil UTBK-SNBT",
    "syarat": [
      "Lulusan SMA/MA/SMK maksimal 3 tahun terakhir",
      "Setiap siswa hanya bisa ikut UTBK 2 kali"
    ],
    "tahapan": [
      "Pendaftaran akun SNPMB",
      "Daftar UTBK",
      "Pelaksanaan UTBK",
      "Pengumuman"
    ],
    "tips": [
      "Fokus pada TPS karena berlaku untuk semua jurusan",
      "Latihan soal minimal 2 jam per hari"
    ]
  }
}
```

**Error Responses:**

`404 Not Found` — slug tidak ditemukan:
```json
{
  "message": "Jalur masuk tidak ditemukan"
}
```

---

### Tryout

#### POST /api/v1/tryout

**Deskripsi:** Buat tryout baru (status DRAFT). Secara otomatis menginisialisasi subtes TPS (urutan 1) dan TKA_SAINTEK (urutan 2).  
**Auth required:** Ya  
**Role required:** `ADMIN`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "judul": "Tryout UTBK Batch 1 2026",
  "deskripsi": "Simulasi UTBK penuh TPS dan TKA Saintek",
  "mulaiAt": "2026-06-01T08:00:00.000Z",
  "selesaiAt": "2026-06-01T14:00:00.000Z",
  "durasiTps": 150,
  "durasiTka": 90
}
```

**Success Response** `201 Created`:
```json
{
  "message": "Tryout berhasil dibuat",
  "data": {
    "id": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
    "judul": "Tryout UTBK Batch 1 2026",
    "deskripsi": "Simulasi UTBK penuh TPS dan TKA Saintek",
    "status": "DRAFT",
    "mulaiAt": "2026-06-01T08:00:00.000Z",
    "selesaiAt": "2026-06-01T14:00:00.000Z",
    "durasiTps": 150,
    "durasiTka": 90,
    "createdAt": "2026-05-25T10:00:00.000Z",
    "subtes": [
      {
        "id": "f8e9d0c1-b2a3-4567-8901-abcdef012345",
        "tryoutId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
        "mapel": "TPS",
        "urutan": 1,
        "durasi": 150
      },
      {
        "id": "e7d8c9b0-a1f2-3456-7890-abcdef012345",
        "tryoutId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
        "mapel": "TKA_SAINTEK",
        "urutan": 2,
        "durasi": 90
      }
    ]
  }
}
```

**Error Responses:**

`400 Bad Request` — judul kosong:
```json
{
  "message": "Judul wajib diisi dan tidak boleh kosong"
}
```

`400 Bad Request` — selesaiAt sebelum mulaiAt:
```json
{
  "message": "Waktu selesai harus setelah waktu mulai"
}
```

`400 Bad Request` — durasi tidak valid:
```json
{
  "message": "Durasi TPS dan TKA wajib berupa integer lebih besar dari 0"
}
```

`403 Forbidden` — bukan admin:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

---

#### PATCH /api/v1/tryout/:id/status

**Deskripsi:** Update status tryout. Transisi status yang diizinkan: `DRAFT → PUBLISHED → ONGOING → ENDED`.  
**Auth required:** Ya  
**Role required:** `ADMIN`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <admin_access_token>
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `id`      | string | Ya    | UUID tryout     |

**Request Body:**
```json
{
  "status": "PUBLISHED"
}
```

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
    "judul": "Tryout UTBK Batch 1 2026",
    "status": "PUBLISHED"
  }
}
```

**Error Responses:**

`400 Bad Request` — transisi tidak valid:
```json
{
  "message": "Transisi status tidak valid"
}
```

`400 Bad Request` — subtes TPS belum punya soal:
```json
{
  "message": "Subtes TPS belum memiliki soal"
}
```

`400 Bad Request` — subtes TKA belum punya soal:
```json
{
  "message": "Subtes TKA belum memiliki soal"
}
```

`404 Not Found` — tryout tidak ditemukan:
```json
{
  "message": "Tryout tidak ditemukan"
}
```

---

#### POST /api/v1/tryout/:id/subtes

**Deskripsi:** Tambah/replace soal di subtes TPS atau TKA. Operasi ini bersifat replace — soal lama di subtes tersebut akan dihapus dan diganti dengan soal baru. Untuk TKA, jika mapel di request berbeda dengan yang tersimpan (misal dari default TKA_SAINTEK ke TKA_SOSHUM), mapel subtes akan otomatis diupdate.  
**Auth required:** Ya  
**Role required:** `ADMIN`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <admin_access_token>
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `id`      | string | Ya    | UUID tryout     |

**Request Body:**
```json
{
  "mapel": "TPS",
  "soalIds": [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  ]
}
```

**Success Response** `200 OK`:
```json
{
  "message": "Soal berhasil ditambahkan ke subtes"
}
```

**Error Responses:**

`400 Bad Request` — mapel tidak valid:
```json
{
  "message": "Mapel tidak valid"
}
```

`400 Bad Request` — soalIds kosong:
```json
{
  "message": "soalIds wajib diisi dan tidak boleh kosong"
}
```

`400 Bad Request` — tryout bukan DRAFT:
```json
{
  "message": "Soal hanya bisa ditambahkan pada tryout berstatus DRAFT"
}
```

`400 Bad Request` — soal ID tidak ditemukan:
```json
{
  "message": "Beberapa Soal ID tidak valid atau tidak ditemukan"
}
```

`404 Not Found` — tryout tidak ditemukan:
```json
{
  "message": "Tryout tidak ditemukan"
}
```

---

#### DELETE /api/v1/tryout/:id

**Deskripsi:** Hapus tryout (hanya status DRAFT). Penghapusan bersifat cascade: SubtesSoal → SubtesTryout → Tryout.  
**Auth required:** Ya  
**Role required:** `ADMIN`

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `id`      | string | Ya    | UUID tryout     |

**Success Response** `200 OK`:
```json
{
  "message": "Tryout berhasil dihapus"
}
```

**Error Responses:**

`400 Bad Request` — bukan DRAFT:
```json
{
  "message": "Hanya tryout berstatus DRAFT yang bisa dihapus"
}
```

`404 Not Found` — tidak ditemukan:
```json
{
  "message": "Tryout tidak ditemukan"
}
```

---

#### GET /api/v1/tryout

**Deskripsi:** Daftar tryout PUBLISHED dan ONGOING untuk siswa. Sistem secara otomatis mengupdate status tryout sebelum dikembalikan.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Authorization: Bearer <siswa_access_token>
```

**Success Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
      "judul": "Tryout UTBK Batch 1 2026",
      "deskripsi": "Simulasi UTBK penuh TPS dan TKA Saintek",
      "status": "ONGOING",
      "mulaiAt": "2026-06-01T08:00:00.000Z",
      "selesaiAt": "2026-06-01T14:00:00.000Z",
      "durasiTps": 150,
      "durasiTka": 90,
      "totalSoalTps": 90,
      "totalSoalTka": 60,
      "mapelTka": "TKA_SAINTEK"
    }
  ]
}
```

**Error Responses:**

`401 Unauthorized` — token tidak valid atau expired:
```json
{
  "message": "Token tidak valid atau sudah expired"
}
```

`403 Forbidden` — role pengakses bukan SISWA:
```json
{
  "message": "Akses ditolak. Diperlukan role: SISWA"
}
```

---

#### GET /api/v1/tryout/:id

**Deskripsi:** Detail tryout untuk siswa (hanya jika tryout berstatus ONGOING).  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Authorization: Bearer <siswa_access_token>
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `id`      | string | Ya    | UUID tryout     |

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
    "judul": "Tryout UTBK Batch 1 2026",
    "status": "ONGOING",
    "mulaiAt": "2026-06-01T08:00:00.000Z",
    "selesaiAt": "2026-06-01T14:00:00.000Z",
    "durasiTps": 150,
    "durasiTka": 90,
    "subtes": [
      {
        "id": "f8e9d0c1-b2a3-4567-8901-abcdef012345",
        "mapel": "TPS",
        "urutan": 1,
        "durasi": 150
      },
      {
        "id": "e7d8c9b0-a1f2-3456-7890-abcdef012345",
        "mapel": "TKA_SAINTEK",
        "urutan": 2,
        "durasi": 90
      }
    ]
  }
}
```

**Error Responses:**

`404 Not Found` — tidak ditemukan:
```json
{
  "message": "Tryout tidak ditemukan"
}
```

`400 Bad Request` — tryout belum dalam status ONGOING:
```json
{
  "message": "Tryout belum dalam status ONGOING"
}
```

---

#### POST /api/v1/tryout/:id/mulai

**Deskripsi:** Mulai sesi tryout siswa. Menginisialisasi subtes TPS (urutan 1), menetapkan deadline subtes TPS, dan mengembalikan daftar soal TPS tanpa menyertakan kunci jawaban.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Authorization: Bearer <siswa_access_token>
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `id`      | string | Ya    | UUID tryout     |

**Success Response** `201 Created`:
```json
{
  "message": "Sesi tryout dimulai",
  "data": {
    "sesiId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
    "tryoutId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "subtesAktif": {
      "id": "f8e9d0c1-b2a3-4567-8901-abcdef012345",
      "mapel": "TPS",
      "urutan": 1,
      "durasi": 150,
      "deadline": "2026-06-01T10:30:00.000Z"
    },
    "soal": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "nomorSoal": 1,
        "pertanyaan": "Manakah pernyataan yang paling logis?",
        "tipe": "SINGLE_CHOICE",
        "opsi": {
          "A": "Pernyataan A",
          "B": "Pernyataan B",
          "C": "Pernyataan C",
          "D": "Pernyataan D",
          "E": "Pernyataan E"
        }
      }
    ]
  }
}
```

**Error Responses:**

`400 Bad Request` — tryout belum ONGOING:
```json
{
  "message": "Tryout belum berlangsung atau sudah selesai"
}
```

`400 Bad Request` — waktu sudah habis:
```json
{
  "message": "Waktu pelaksanaan tryout telah berakhir"
}
```

`400 Bad Request` — sudah punya sesi aktif:
```json
{
  "message": "Anda sudah memiliki sesi aktif untuk tryout ini"
}
```

`404 Not Found` — tryout tidak ditemukan:
```json
{
  "message": "Tryout tidak ditemukan"
}
```

---

#### POST /api/v1/tryout/sesi/:sesiId/submit-subtes

**Deskripsi:** Submit jawaban subtes aktif (TPS), lanjut ke subtes berikutnya (TKA). Menghitung skor TPS siswa, menyimpan seluruh jawaban, memperbarui deadline TKA, dan mengembalikan daftar soal TKA tanpa menyertakan kunci jawaban.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <siswa_access_token>
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `sesiId`  | string | Ya    | UUID sesi tryout|

**Request Body:**
```json
{
  "jawabans": [
    { "soalId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "jawaban": "A" },
    { "soalId": "b2c3d4e5-f6a7-8901-bcde-f12345678901", "jawaban": ["A", "C"] },
    { "soalId": "c3d4e5f6-a7b8-9012-3456-7890abcdef01", "jawaban": { "0": true, "1": false } }
  ]
}
```

**Success Response** `200 OK`:
```json
{
  "message": "Subtes TPS selesai, lanjut ke TKA",
  "data": {
    "skorSubtesTps": 75,
    "subtesBerikutnya": {
      "id": "e7d8c9b0-a1f2-3456-7890-abcdef012345",
      "mapel": "TKA_SAINTEK",
      "urutan": 2,
      "durasi": 90,
      "deadline": "2026-06-01T12:00:00.000Z"
    },
    "soal": [
      {
        "id": "d4e5f6a7-b8c9-0123-4567-890abcdef012",
        "nomorSoal": 1,
        "pertanyaan": "Berapakah nilai integral dari...",
        "tipe": "SHORT_ANSWER",
        "opsi": null
      }
    ]
  }
}
```

**Error Responses:**

`400 Bad Request` — sesi tidak aktif:
```json
{
  "message": "Sesi tryout tidak aktif atau sudah selesai"
}
```

`403 Forbidden` — sesi bukan milik user:
```json
{
  "message": "Akses ditolak"
}
```

`404 Not Found` — sesi tidak ditemukan:
```json
{
  "message": "Sesi tryout tidak ditemukan"
}
```

---

#### POST /api/v1/tryout/sesi/:sesiId/selesai

**Deskripsi:** Selesaikan tryout dan submit jawaban subtes terakhir (TKA). Menghitung skor TKA, skor total rata-rata, menandai status sesi (`SUBMITTED` atau `EXPIRED`), dan merekam waktu selesai.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <siswa_access_token>
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `sesiId`  | string | Ya    | UUID sesi tryout|

**Request Body:**
```json
{
  "jawabans": [
    { "soalId": "d4e5f6a7-b8c9-0123-4567-890abcdef012", "jawaban": "B" }
  ]
}
```

**Success Response** `200 OK`:
```json
{
  "message": "Tryout selesai",
  "data": {
    "sesiId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
    "skorTps": 75,
    "skorTka": 80,
    "skorTotal": 77,
    "selesaiAt": "2026-06-01T11:45:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` — sesi sudah disubmit sebelumnya:
```json
{
  "message": "Sesi tryout tidak aktif atau sudah disubmit sebelumnya"
}
```

`403 Forbidden` — sesi bukan milik user:
```json
{
  "message": "Akses ditolak"
}
```

`404 Not Found` — sesi tidak ditemukan:
```json
{
  "message": "Sesi tryout tidak ditemukan"
}
```

---

#### GET /api/v1/tryout/sesi/:sesiId/hasil

**Deskripsi:** Lihat hasil analisis detail sesi tryout. Hanya bisa diakses apabila sesi telah berstatus `SUBMITTED` atau `EXPIRED`.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Authorization: Bearer <siswa_access_token>
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `sesiId`  | string | Ya    | UUID sesi tryout|

**Success Response** `200 OK`:
```json
{
  "data": {
    "sesiId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
    "tryout": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "judul": "Tryout UTBK Batch 1 2026"
    },
    "status": "SUBMITTED",
    "skorTps": 75,
    "skorTka": 80,
    "skorTotal": 77,
    "mulaiAt": "2026-06-01T08:00:00.000Z",
    "selesaiAt": "2026-06-01T11:45:00.000Z",
    "detailSubtes": [
      {
        "mapel": "TPS",
        "totalSoal": 90,
        "jumlahBenar": 67,
        "jumlahSalah": 23,
        "skor": 75
      },
      {
        "mapel": "TKA_SAINTEK",
        "totalSoal": 60,
        "jumlahBenar": 48,
        "jumlahSalah": 12,
        "skor": 80
      }
    ]
  }
}
```

**Error Responses:**

`400 Bad Request` — hasil belum bisa dilihat karena sesi masih berlangsung:
```json
{
  "message": "Hasil tryout belum bisa dilihat karena sesi masih berlangsung"
}
```

`403 Forbidden` — sesi bukan milik user:
```json
{
  "message": "Akses ditolak"
}
```

`404 Not Found` — sesi tidak ditemukan:
```json
{
  "message": "Sesi tryout tidak ditemukan"
}
```

---

#### GET /api/v1/tryout/sesi/riwayat

**Deskripsi:** Riwayat sesi tryout milik siswa yang sedang login, diurutkan dari terbaru.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Authorization: Bearer <siswa_access_token>
```

**Success Response** `200 OK`:
```json
{
  "data": [
    {
      "sesiId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
      "tryout": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "judul": "Tryout UTBK Batch 1 2026"
      },
      "status": "SUBMITTED",
      "skorTps": 75,
      "skorTka": 80,
      "skorTotal": 77,
      "mulaiAt": "2026-06-01T08:00:00.000Z",
      "selesaiAt": "2026-06-01T11:45:00.000Z"
    }
  ]
}
```

**Error Responses:**

`401 Unauthorized` — token tidak valid atau expired:
```json
{
  "message": "Token tidak valid atau sudah expired"
}
```

`403 Forbidden` — role pengakses bukan SISWA:
```json
{
  "message": "Akses ditolak. Diperlukan role: SISWA"
}
```

---

### PTN & Jurusan

> Semua endpoint PTN dan Jurusan membutuhkan autentikasi (`Authorization: Bearer <token>`). Endpoint mutasi (POST, PUT, DELETE) hanya bisa diakses oleh user dengan role `ADMIN`.

#### GET /api/v1/ptn

**Deskripsi:** Mengambil daftar semua PTN. Mendukung filter dan pencarian.
**Auth required:** Ya
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

| Parameter    | Tipe   | Wajib | Nilai yang diterima                                              |
|--------------|--------|-------|------------------------------------------------------------------|
| `provinsi`   | string | Tidak | Nama provinsi, contoh: `Jawa Barat`                              |
| `tipe`       | string | Tidak | `Universitas`, `Institut`, `Politeknik`, `Sekolah Tinggi`        |
| `akreditasi` | string | Tidak | `Unggul`, `Baik Sekali`, `Baik`, `A`, `B`, `C`                   |
| `search`     | string | Tidak | Pencarian parsial (case-insensitive) pada `nama` atau `singkatan`|

**Contoh Request:**
```
GET /api/v1/ptn?provinsi=Jawa Barat&tipe=Universitas
GET /api/v1/ptn?search=UI
```

**Success Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nama": "Universitas Indonesia",
      "singkatan": "UI",
      "kota": "Depok",
      "provinsi": "Jawa Barat",
      "akreditasi": "Unggul",
      "tipe": "Universitas",
      "website": "https://www.ui.ac.id",
      "logoUrl": null,
      "deskripsi": "Universitas terkemuka di Indonesia yang berlokasi di Depok, Jawa Barat.",
      "createdAt": "2026-05-26T02:00:00.000Z",
      "_count": {
        "jurusans": 12
      }
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "nama": "Universitas Gadjah Mada",
      "singkatan": "UGM",
      "kota": "Yogyakarta",
      "provinsi": "Daerah Istimewa Yogyakarta",
      "akreditasi": "Unggul",
      "tipe": "Universitas",
      "website": "https://www.ugm.ac.id",
      "logoUrl": null,
      "deskripsi": "Universitas negeri tertua di Indonesia yang berlokasi di Yogyakarta.",
      "createdAt": "2026-05-26T02:00:00.000Z",
      "_count": {
        "jurusans": 18
      }
    }
  ]
}
```

---

#### GET /api/v1/ptn/:id

**Deskripsi:** Mengambil detail satu PTN beserta seluruh daftar jurusannya.
**Auth required:** Ya
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi    |
|-----------|--------|-------|--------------|
| `id`      | string | Ya    | UUID dari PTN|

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nama": "Universitas Indonesia",
    "singkatan": "UI",
    "kota": "Depok",
    "provinsi": "Jawa Barat",
    "akreditasi": "Unggul",
    "tipe": "Universitas",
    "website": "https://www.ui.ac.id",
    "logoUrl": null,
    "deskripsi": "Universitas terkemuka di Indonesia yang berlokasi di Depok, Jawa Barat.",
    "createdAt": "2026-05-26T02:00:00.000Z",
    "jurusans": [
      {
        "id": "c3d4e5f6-a7b8-9012-cdef-012345678901",
        "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "nama": "Ilmu Komputer",
        "kode": "UI-IK",
        "fakultas": "Fakultas Ilmu Komputer",
        "jenjang": "S1",
        "kelompok": "SAINTEK",
        "dayaTampung": 120,
        "passingGrade": 750.5,
        "deskripsi": "Program studi yang mempelajari ilmu komputer dan pemrograman.",
        "prospekKerja": "Software Engineer, Data Scientist, AI Engineer",
        "createdAt": "2026-05-26T02:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

`404 Not Found` — PTN tidak ditemukan:
```json
{
  "message": "PTN tidak ditemukan"
}
```

---

#### POST /api/v1/ptn

**Deskripsi:** Membuat data PTN baru.
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**Request Body:**

| Field        | Tipe   | Wajib | Validasi                                                          |
|--------------|--------|-------|-------------------------------------------------------------------|
| `nama`       | string | Ya    | Tidak boleh kosong                                                |
| `singkatan`  | string | Ya    | Tidak boleh kosong                                                |
| `kota`       | string | Ya    | Tidak boleh kosong                                                |
| `provinsi`   | string | Ya    | Tidak boleh kosong                                                |
| `akreditasi` | string | Ya    | `Unggul`, `Baik Sekali`, `Baik`, `A`, `B`, atau `C`              |
| `tipe`       | string | Ya    | `Universitas`, `Institut`, `Politeknik`, atau `Sekolah Tinggi`    |
| `website`    | string | Tidak | URL website PTN                                                   |
| `logoUrl`    | string | Tidak | URL logo PTN                                                      |
| `deskripsi`  | string | Tidak | Deskripsi singkat PTN                                             |

```json
{
  "nama": "Institut Teknologi Bandung",
  "singkatan": "ITB",
  "kota": "Bandung",
  "provinsi": "Jawa Barat",
  "akreditasi": "Unggul",
  "tipe": "Institut",
  "website": "https://www.itb.ac.id",
  "deskripsi": "Institut teknologi terbaik di Indonesia yang terletak di Bandung."
}
```

**Success Response** `201 Created`:
```json
{
  "data": {
    "id": "d4e5f6a7-b8c9-0123-4567-890abcdef012",
    "nama": "Institut Teknologi Bandung",
    "singkatan": "ITB",
    "kota": "Bandung",
    "provinsi": "Jawa Barat",
    "akreditasi": "Unggul",
    "tipe": "Institut",
    "website": "https://www.itb.ac.id",
    "logoUrl": null,
    "deskripsi": "Institut teknologi terbaik di Indonesia yang terletak di Bandung.",
    "createdAt": "2026-05-26T03:00:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` — field wajib tidak diisi:
```json
{
  "message": "Field nama, singkatan, kota, provinsi, akreditasi, dan tipe wajib diisi"
}
```

`400 Bad Request` — tipe tidak valid:
```json
{
  "message": "Tipe PTN tidak valid"
}
```

`400 Bad Request` — akreditasi tidak valid:
```json
{
  "message": "Akreditasi PTN tidak valid"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

---

#### PUT /api/v1/ptn/:id

**Deskripsi:** Mengupdate data PTN. Hanya field yang dikirim yang akan diupdate (partial update).
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi    |
|-----------|--------|-------|--------------|
| `id`      | string | Ya    | UUID dari PTN|

**Request Body (semua field opsional):**
```json
{
  "kota": "Bandung Barat",
  "akreditasi": "Unggul",
  "website": "https://www.itb.ac.id"
}
```

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "d4e5f6a7-b8c9-0123-4567-890abcdef012",
    "nama": "Institut Teknologi Bandung",
    "singkatan": "ITB",
    "kota": "Bandung Barat",
    "provinsi": "Jawa Barat",
    "akreditasi": "Unggul",
    "tipe": "Institut",
    "website": "https://www.itb.ac.id",
    "logoUrl": null,
    "deskripsi": "Institut teknologi terbaik di Indonesia yang terletak di Bandung.",
    "createdAt": "2026-05-26T03:00:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` — tipe atau akreditasi tidak valid:
```json
{
  "message": "Tipe PTN tidak valid"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — PTN tidak ditemukan:
```json
{
  "message": "PTN tidak ditemukan"
}
```

---

#### DELETE /api/v1/ptn/:id

**Deskripsi:** Menghapus PTN beserta **seluruh jurusan** yang dimilikinya secara permanen.
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi    |
|-----------|--------|-------|--------------|
| `id`      | string | Ya    | UUID dari PTN|

**Success Response** `200 OK`:
```json
{
  "message": "PTN dan semua jurusan berhasil dihapus"
}
```

**Error Responses:**

`403 Forbidden` — role pengakses bukan ADMIN:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — PTN tidak ditemukan:
```json
{
  "message": "PTN tidak ditemukan"
}
```

---

#### GET /api/v1/ptn/:ptnId/jurusan

**Deskripsi:** Mengambil daftar seluruh jurusan milik satu PTN. Mendukung filter opsional.
**Auth required:** Ya
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi    |
|-----------|--------|-------|--------------|
| `ptnId`   | string | Ya    | UUID dari PTN|

**Query Parameters:**

| Parameter  | Tipe   | Wajib | Nilai yang diterima                      |
|------------|--------|-------|------------------------------------------|
| `kelompok` | string | Tidak | `SAINTEK`, `SOSHUM`, `CAMPURAN`          |
| `jenjang`  | string | Tidak | `S1`, `D3`, `D4`                         |
| `search`   | string | Tidak | Pencarian parsial pada `nama` atau `fakultas`|

**Contoh Request:**
```
GET /api/v1/ptn/a1b2c3d4-e5f6-7890-abcd-ef1234567890/jurusan?kelompok=SAINTEK
```

**Success Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-012345678901",
      "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nama": "Ilmu Komputer",
      "kode": "UI-IK",
      "fakultas": "Fakultas Ilmu Komputer",
      "jenjang": "S1",
      "kelompok": "SAINTEK",
      "dayaTampung": 120,
      "passingGrade": 750.5,
      "deskripsi": "Program studi yang mempelajari ilmu komputer dan pemrograman.",
      "prospekKerja": "Software Engineer, Data Scientist, AI Engineer",
      "createdAt": "2026-05-26T02:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

`404 Not Found` — PTN tidak ditemukan:
```json
{
  "message": "PTN tidak ditemukan"
}
```

---

#### GET /api/v1/ptn/jurusan

**Deskripsi:** Mengambil daftar seluruh jurusan dari semua PTN, beserta informasi PTN masing-masing. Mendukung filter dan pencarian.
**Auth required:** Ya
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

| Parameter  | Tipe   | Wajib | Nilai yang diterima                          |
|------------|--------|-------|----------------------------------------------|
| `kelompok` | string | Tidak | `SAINTEK`, `SOSHUM`, `CAMPURAN`              |
| `jenjang`  | string | Tidak | `S1`, `D3`, `D4`                             |
| `search`   | string | Tidak | Pencarian parsial pada `nama` atau `fakultas`|

**Contoh Request:**
```
GET /api/v1/ptn/jurusan?kelompok=SAINTEK&jenjang=S1
GET /api/v1/ptn/jurusan?search=Teknik Informatika
```

**Success Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-012345678901",
      "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nama": "Ilmu Komputer",
      "kode": "UI-IK",
      "fakultas": "Fakultas Ilmu Komputer",
      "jenjang": "S1",
      "kelompok": "SAINTEK",
      "dayaTampung": 120,
      "passingGrade": 750.5,
      "deskripsi": "Program studi yang mempelajari ilmu komputer dan pemrograman.",
      "prospekKerja": "Software Engineer, Data Scientist, AI Engineer",
      "createdAt": "2026-05-26T02:00:00.000Z",
      "ptn": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "nama": "Universitas Indonesia",
        "singkatan": "UI",
        "kota": "Depok"
      }
    },
    {
      "id": "e5f6a7b8-c9d0-1234-5678-90abcdef0123",
      "ptnId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "nama": "Teknik Informatika",
      "kode": "ITB-IF",
      "fakultas": "Sekolah Teknik Elektro dan Informatika",
      "jenjang": "S1",
      "kelompok": "SAINTEK",
      "dayaTampung": 100,
      "passingGrade": 780.0,
      "deskripsi": "Program studi teknik informatika dengan fokus pada rekayasa perangkat lunak.",
      "prospekKerja": "Software Engineer, System Architect, Tech Lead",
      "createdAt": "2026-05-26T02:00:00.000Z",
      "ptn": {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "nama": "Institut Teknologi Bandung",
        "singkatan": "ITB",
        "kota": "Bandung"
      }
    }
  ]
}
```

---

#### GET /api/v1/ptn/jurusan/:id

**Deskripsi:** Mengambil detail satu jurusan beserta data PTN-nya.
**Auth required:** Ya
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi       |
|-----------|--------|-------|-----------------|
| `id`      | string | Ya    | UUID dari jurusan|

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "c3d4e5f6-a7b8-9012-cdef-012345678901",
    "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nama": "Ilmu Komputer",
    "kode": "UI-IK",
    "fakultas": "Fakultas Ilmu Komputer",
    "jenjang": "S1",
    "kelompok": "SAINTEK",
    "dayaTampung": 120,
    "passingGrade": 750.5,
    "deskripsi": "Program studi yang mempelajari ilmu komputer dan pemrograman.",
    "prospekKerja": "Software Engineer, Data Scientist, AI Engineer",
    "createdAt": "2026-05-26T02:00:00.000Z",
    "ptn": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nama": "Universitas Indonesia",
      "singkatan": "UI",
      "kota": "Depok",
      "provinsi": "Jawa Barat",
      "akreditasi": "Unggul",
      "tipe": "Universitas",
      "website": "https://www.ui.ac.id",
      "logoUrl": null,
      "deskripsi": "Universitas terkemuka di Indonesia yang berlokasi di Depok, Jawa Barat.",
      "createdAt": "2026-05-26T02:00:00.000Z"
    }
  }
}
```

**Error Responses:**

`404 Not Found` — jurusan tidak ditemukan:
```json
{
  "message": "Jurusan tidak ditemukan"
}
```

---

#### POST /api/v1/ptn/jurusan

**Deskripsi:** Membuat data jurusan baru di bawah PTN tertentu.
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**Request Body:**

| Field          | Tipe   | Wajib | Validasi                                          |
|----------------|--------|-------|---------------------------------------------------|
| `ptnId`        | string | Ya    | UUID PTN yang valid dan terdaftar di database     |
| `nama`         | string | Ya    | Tidak boleh kosong                                |
| `kode`         | string | Ya    | Tidak boleh kosong, contoh: `UI-IK`               |
| `fakultas`     | string | Ya    | Tidak boleh kosong                                |
| `jenjang`      | string | Ya    | `S1`, `D3`, atau `D4`                             |
| `kelompok`     | string | Ya    | `SAINTEK`, `SOSHUM`, atau `CAMPURAN`              |
| `dayaTampung`  | number | Tidak | Integer positif                                   |
| `passingGrade` | number | Tidak | Nilai float, contoh: `750.5`                      |
| `deskripsi`    | string | Tidak | Deskripsi program studi                           |
| `prospekKerja` | string | Tidak | Deskripsi prospek karier                          |

```json
{
  "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "nama": "Sistem Informasi",
  "kode": "UI-SI",
  "fakultas": "Fakultas Ilmu Komputer",
  "jenjang": "S1",
  "kelompok": "SAINTEK",
  "dayaTampung": 90,
  "passingGrade": 735.0,
  "deskripsi": "Program studi yang memadukan teknologi informasi dengan manajemen bisnis.",
  "prospekKerja": "System Analyst, IT Consultant, Business Intelligence Analyst"
}
```

**Success Response** `201 Created`:
```json
{
  "data": {
    "id": "f6a7b8c9-d0e1-2345-6789-0abcdef01234",
    "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nama": "Sistem Informasi",
    "kode": "UI-SI",
    "fakultas": "Fakultas Ilmu Komputer",
    "jenjang": "S1",
    "kelompok": "SAINTEK",
    "dayaTampung": 90,
    "passingGrade": 735.0,
    "deskripsi": "Program studi yang memadukan teknologi informasi dengan manajemen bisnis.",
    "prospekKerja": "System Analyst, IT Consultant, Business Intelligence Analyst",
    "createdAt": "2026-05-26T03:30:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` — field wajib tidak diisi:
```json
{
  "message": "Field ptnId, nama, kode, fakultas, jenjang, dan kelompok wajib diisi"
}
```

`400 Bad Request` — jenjang tidak valid:
```json
{
  "message": "Jenjang tidak valid"
}
```

`400 Bad Request` — kelompok tidak valid:
```json
{
  "message": "Kelompok tidak valid"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — PTN dengan ptnId tidak ditemukan:
```json
{
  "message": "PTN tidak ditemukan"
}
```

---

#### PUT /api/v1/ptn/jurusan/:id

**Deskripsi:** Mengupdate data jurusan. Hanya field yang dikirim yang akan diupdate (partial update).
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi        |
|-----------|--------|-------|------------------|
| `id`      | string | Ya    | UUID dari jurusan|

**Request Body (semua field opsional):**
```json
{
  "dayaTampung": 100,
  "passingGrade": 740.0,
  "prospekKerja": "System Analyst, IT Manager, CTO"
}
```

**Success Response** `200 OK`:
```json
{
  "data": {
    "id": "f6a7b8c9-d0e1-2345-6789-0abcdef01234",
    "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nama": "Sistem Informasi",
    "kode": "UI-SI",
    "fakultas": "Fakultas Ilmu Komputer",
    "jenjang": "S1",
    "kelompok": "SAINTEK",
    "dayaTampung": 100,
    "passingGrade": 740.0,
    "deskripsi": "Program studi yang memadukan teknologi informasi dengan manajemen bisnis.",
    "prospekKerja": "System Analyst, IT Manager, CTO",
    "createdAt": "2026-05-26T03:30:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` — jenjang atau kelompok tidak valid:
```json
{
  "message": "Jenjang tidak valid"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — jurusan tidak ditemukan:
```json
{
  "message": "Jurusan tidak ditemukan"
}
```

---

#### DELETE /api/v1/ptn/jurusan/:id

**Deskripsi:** Menghapus satu jurusan secara permanen.
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi        |
|-----------|--------|-------|------------------|
| `id`      | string | Ya    | UUID dari jurusan|

**Success Response** `200 OK`:
```json
{
  "message": "Jurusan berhasil dihapus"
}
```

**Error Responses:**

`403 Forbidden` — role pengakses bukan ADMIN:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — jurusan tidak ditemukan:
```json
{
  "message": "Jurusan tidak ditemukan"
}
```

---

### PTN & Jurusan

> Semua endpoint PTN dan Jurusan membutuhkan autentikasi (`Authorization: Bearer <token>`). Endpoint mutasi (POST, PUT, DELETE) hanya bisa diakses oleh user dengan role `ADMIN`.

#### GET /api/v1/ptn

**Deskripsi:** Mengambil daftar semua PTN. Mendukung filter dan pencarian.
**Auth required:** Ya
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

| Parameter    | Tipe   | Wajib | Nilai yang diterima                                               |
| ------------ | ------ | ----- | ----------------------------------------------------------------- |
| `provinsi`   | string | Tidak | Nama provinsi, contoh: `Jawa Barat`                               |
| `tipe`       | string | Tidak | `Universitas`, `Institut`, `Politeknik`, `Sekolah Tinggi`         |
| `akreditasi` | string | Tidak | `Unggul`, `Baik Sekali`, `Baik`, `A`, `B`, `C`                    |
| `search`     | string | Tidak | Pencarian parsial (case-insensitive) pada `nama` atau `singkatan` |

**Contoh Request:**

```
GET /api/v1/ptn?provinsi=Jawa Barat&tipe=Universitas
GET /api/v1/ptn?search=UI
```

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nama": "Universitas Indonesia",
      "singkatan": "UI",
      "kota": "Depok",
      "provinsi": "Jawa Barat",
      "akreditasi": "Unggul",
      "tipe": "Universitas",
      "website": "https://www.ui.ac.id",
      "logoUrl": null,
      "deskripsi": "Universitas terkemuka di Indonesia yang berlokasi di Depok, Jawa Barat.",
      "createdAt": "2026-05-26T02:00:00.000Z",
      "_count": {
        "jurusans": 12
      }
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "nama": "Universitas Gadjah Mada",
      "singkatan": "UGM",
      "kota": "Yogyakarta",
      "provinsi": "Daerah Istimewa Yogyakarta",
      "akreditasi": "Unggul",
      "tipe": "Universitas",
      "website": "https://www.ugm.ac.id",
      "logoUrl": null,
      "deskripsi": "Universitas negeri tertua di Indonesia yang berlokasi di Yogyakarta.",
      "createdAt": "2026-05-26T02:00:00.000Z",
      "_count": {
        "jurusans": 18
      }
    }
  ]
}
```

---

#### GET /api/v1/ptn/:id

**Deskripsi:** Mengambil detail satu PTN beserta seluruh daftar jurusannya.
**Auth required:** Ya
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi     |
| --------- | ------ | ----- | ------------- |
| `id`      | string | Ya    | UUID dari PTN |

**Success Response** `200 OK`:

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nama": "Universitas Indonesia",
    "singkatan": "UI",
    "kota": "Depok",
    "provinsi": "Jawa Barat",
    "akreditasi": "Unggul",
    "tipe": "Universitas",
    "website": "https://www.ui.ac.id",
    "logoUrl": null,
    "deskripsi": "Universitas terkemuka di Indonesia yang berlokasi di Depok, Jawa Barat.",
    "createdAt": "2026-05-26T02:00:00.000Z",
    "jurusans": [
      {
        "id": "c3d4e5f6-a7b8-9012-cdef-012345678901",
        "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "nama": "Ilmu Komputer",
        "kode": "UI-IK",
        "fakultas": "Fakultas Ilmu Komputer",
        "jenjang": "S1",
        "kelompok": "SAINTEK",
        "dayaTampung": 120,
        "passingGrade": 750.5,
        "deskripsi": "Program studi yang mempelajari ilmu komputer dan pemrograman.",
        "prospekKerja": "Software Engineer, Data Scientist, AI Engineer",
        "createdAt": "2026-05-26T02:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

`404 Not Found` — PTN tidak ditemukan:

```json
{
  "message": "PTN tidak ditemukan"
}
```

---

#### POST /api/v1/ptn

**Deskripsi:** Membuat data PTN baru.
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**Request Body:**

| Field        | Tipe   | Wajib | Validasi                                                       |
| ------------ | ------ | ----- | -------------------------------------------------------------- |
| `nama`       | string | Ya    | Tidak boleh kosong                                             |
| `singkatan`  | string | Ya    | Tidak boleh kosong                                             |
| `kota`       | string | Ya    | Tidak boleh kosong                                             |
| `provinsi`   | string | Ya    | Tidak boleh kosong                                             |
| `akreditasi` | string | Ya    | `Unggul`, `Baik Sekali`, `Baik`, `A`, `B`, atau `C`           |
| `tipe`       | string | Ya    | `Universitas`, `Institut`, `Politeknik`, atau `Sekolah Tinggi` |
| `website`    | string | Tidak | URL website PTN                                                |
| `logoUrl`    | string | Tidak | URL logo PTN                                                   |
| `deskripsi`  | string | Tidak | Deskripsi singkat PTN                                          |

```json
{
  "nama": "Institut Teknologi Bandung",
  "singkatan": "ITB",
  "kota": "Bandung",
  "provinsi": "Jawa Barat",
  "akreditasi": "Unggul",
  "tipe": "Institut",
  "website": "https://www.itb.ac.id",
  "deskripsi": "Institut teknologi terbaik di Indonesia yang terletak di Bandung."
}
```

**Success Response** `201 Created`:

```json
{
  "data": {
    "id": "d4e5f6a7-b8c9-0123-4567-890abcdef012",
    "nama": "Institut Teknologi Bandung",
    "singkatan": "ITB",
    "kota": "Bandung",
    "provinsi": "Jawa Barat",
    "akreditasi": "Unggul",
    "tipe": "Institut",
    "website": "https://www.itb.ac.id",
    "logoUrl": null,
    "deskripsi": "Institut teknologi terbaik di Indonesia yang terletak di Bandung.",
    "createdAt": "2026-05-26T03:00:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` — field wajib tidak diisi:

```json
{
  "message": "Field nama, singkatan, kota, provinsi, akreditasi, dan tipe wajib diisi"
}
```

`400 Bad Request` — tipe tidak valid:

```json
{
  "message": "Tipe PTN tidak valid"
}
```

`400 Bad Request` — akreditasi tidak valid:

```json
{
  "message": "Akreditasi PTN tidak valid"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:

```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

---

#### PUT /api/v1/ptn/:id

**Deskripsi:** Mengupdate data PTN. Hanya field yang dikirim yang akan diupdate (partial update).
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi     |
| --------- | ------ | ----- | ------------- |
| `id`      | string | Ya    | UUID dari PTN |

**Request Body (semua field opsional):**

```json
{
  "kota": "Bandung Barat",
  "akreditasi": "Unggul",
  "website": "https://www.itb.ac.id"
}
```

**Success Response** `200 OK`:

```json
{
  "data": {
    "id": "d4e5f6a7-b8c9-0123-4567-890abcdef012",
    "nama": "Institut Teknologi Bandung",
    "singkatan": "ITB",
    "kota": "Bandung Barat",
    "provinsi": "Jawa Barat",
    "akreditasi": "Unggul",
    "tipe": "Institut",
    "website": "https://www.itb.ac.id",
    "logoUrl": null,
    "deskripsi": "Institut teknologi terbaik di Indonesia yang terletak di Bandung.",
    "createdAt": "2026-05-26T03:00:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` — tipe atau akreditasi tidak valid:

```json
{
  "message": "Tipe PTN tidak valid"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:

```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — PTN tidak ditemukan:

```json
{
  "message": "PTN tidak ditemukan"
}
```

---

#### DELETE /api/v1/ptn/:id

**Deskripsi:** Menghapus PTN beserta **seluruh jurusan** yang dimilikinya secara permanen.
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi     |
| --------- | ------ | ----- | ------------- |
| `id`      | string | Ya    | UUID dari PTN |

**Success Response** `200 OK`:

```json
{
  "message": "PTN dan semua jurusan berhasil dihapus"
}
```

**Error Responses:**

`403 Forbidden` — role pengakses bukan ADMIN:

```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — PTN tidak ditemukan:

```json
{
  "message": "PTN tidak ditemukan"
}
```

---

#### GET /api/v1/ptn/:ptnId/jurusan

**Deskripsi:** Mengambil daftar seluruh jurusan milik satu PTN. Mendukung filter opsional.
**Auth required:** Ya
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi     |
| --------- | ------ | ----- | ------------- |
| `ptnId`   | string | Ya    | UUID dari PTN |

**Query Parameters:**

| Parameter  | Tipe   | Wajib | Nilai yang diterima                           |
| ---------- | ------ | ----- | --------------------------------------------- |
| `kelompok` | string | Tidak | `SAINTEK`, `SOSHUM`, `CAMPURAN`               |
| `jenjang`  | string | Tidak | `S1`, `D3`, `D4`                              |
| `search`   | string | Tidak | Pencarian parsial pada `nama` atau `fakultas` |

**Contoh Request:**

```
GET /api/v1/ptn/a1b2c3d4-e5f6-7890-abcd-ef1234567890/jurusan?kelompok=SAINTEK
```

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-012345678901",
      "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nama": "Ilmu Komputer",
      "kode": "UI-IK",
      "fakultas": "Fakultas Ilmu Komputer",
      "jenjang": "S1",
      "kelompok": "SAINTEK",
      "dayaTampung": 120,
      "passingGrade": 750.5,
      "deskripsi": "Program studi yang mempelajari ilmu komputer dan pemrograman.",
      "prospekKerja": "Software Engineer, Data Scientist, AI Engineer",
      "createdAt": "2026-05-26T02:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

`404 Not Found` — PTN tidak ditemukan:

```json
{
  "message": "PTN tidak ditemukan"
}
```

---

#### GET /api/v1/ptn/jurusan

**Deskripsi:** Mengambil daftar seluruh jurusan dari semua PTN, beserta informasi PTN masing-masing. Mendukung filter dan pencarian.
**Auth required:** Ya
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

| Parameter  | Tipe   | Wajib | Nilai yang diterima                           |
| ---------- | ------ | ----- | --------------------------------------------- |
| `kelompok` | string | Tidak | `SAINTEK`, `SOSHUM`, `CAMPURAN`               |
| `jenjang`  | string | Tidak | `S1`, `D3`, `D4`                              |
| `search`   | string | Tidak | Pencarian parsial pada `nama` atau `fakultas` |

**Contoh Request:**

```
GET /api/v1/ptn/jurusan?kelompok=SAINTEK&jenjang=S1
GET /api/v1/ptn/jurusan?search=Teknik Informatika
```

**Success Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-012345678901",
      "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nama": "Ilmu Komputer",
      "kode": "UI-IK",
      "fakultas": "Fakultas Ilmu Komputer",
      "jenjang": "S1",
      "kelompok": "SAINTEK",
      "dayaTampung": 120,
      "passingGrade": 750.5,
      "deskripsi": "Program studi yang mempelajari ilmu komputer dan pemrograman.",
      "prospekKerja": "Software Engineer, Data Scientist, AI Engineer",
      "createdAt": "2026-05-26T02:00:00.000Z",
      "ptn": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "nama": "Universitas Indonesia",
        "singkatan": "UI",
        "kota": "Depok"
      }
    },
    {
      "id": "e5f6a7b8-c9d0-1234-5678-90abcdef0123",
      "ptnId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "nama": "Teknik Informatika",
      "kode": "ITB-IF",
      "fakultas": "Sekolah Teknik Elektro dan Informatika",
      "jenjang": "S1",
      "kelompok": "SAINTEK",
      "dayaTampung": 100,
      "passingGrade": 780.0,
      "deskripsi": "Program studi teknik informatika dengan fokus pada rekayasa perangkat lunak.",
      "prospekKerja": "Software Engineer, System Architect, Tech Lead",
      "createdAt": "2026-05-26T02:00:00.000Z",
      "ptn": {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "nama": "Institut Teknologi Bandung",
        "singkatan": "ITB",
        "kota": "Bandung"
      }
    }
  ]
}
```

---

#### GET /api/v1/ptn/jurusan/:id

**Deskripsi:** Mengambil detail satu jurusan beserta data PTN-nya.
**Auth required:** Ya
**Role required:** `ADMIN` atau `SISWA`

**Request Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi         |
| --------- | ------ | ----- | ----------------- |
| `id`      | string | Ya    | UUID dari jurusan |

**Success Response** `200 OK`:

```json
{
  "data": {
    "id": "c3d4e5f6-a7b8-9012-cdef-012345678901",
    "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nama": "Ilmu Komputer",
    "kode": "UI-IK",
    "fakultas": "Fakultas Ilmu Komputer",
    "jenjang": "S1",
    "kelompok": "SAINTEK",
    "dayaTampung": 120,
    "passingGrade": 750.5,
    "deskripsi": "Program studi yang mempelajari ilmu komputer dan pemrograman.",
    "prospekKerja": "Software Engineer, Data Scientist, AI Engineer",
    "createdAt": "2026-05-26T02:00:00.000Z",
    "ptn": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nama": "Universitas Indonesia",
      "singkatan": "UI",
      "kota": "Depok",
      "provinsi": "Jawa Barat",
      "akreditasi": "Unggul",
      "tipe": "Universitas",
      "website": "https://www.ui.ac.id",
      "logoUrl": null,
      "deskripsi": "Universitas terkemuka di Indonesia yang berlokasi di Depok, Jawa Barat.",
      "createdAt": "2026-05-26T02:00:00.000Z"
    }
  }
}
```

**Error Responses:**

`404 Not Found` — jurusan tidak ditemukan:

```json
{
  "message": "Jurusan tidak ditemukan"
}
```

---

#### POST /api/v1/ptn/jurusan

**Deskripsi:** Membuat data jurusan baru di bawah PTN tertentu.
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**Request Body:**

| Field          | Tipe   | Wajib | Validasi                                      |
| -------------- | ------ | ----- | --------------------------------------------- |
| `ptnId`        | string | Ya    | UUID PTN yang valid dan terdaftar di database |
| `nama`         | string | Ya    | Tidak boleh kosong                            |
| `kode`         | string | Ya    | Tidak boleh kosong, contoh: `UI-IK`           |
| `fakultas`     | string | Ya    | Tidak boleh kosong                            |
| `jenjang`      | string | Ya    | `S1`, `D3`, atau `D4`                         |
| `kelompok`     | string | Ya    | `SAINTEK`, `SOSHUM`, atau `CAMPURAN`          |
| `dayaTampung`  | number | Tidak | Integer positif                               |
| `passingGrade` | number | Tidak | Nilai float, contoh: `750.5`                  |
| `deskripsi`    | string | Tidak | Deskripsi program studi                       |
| `prospekKerja` | string | Tidak | Deskripsi prospek karier                      |

```json
{
  "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "nama": "Sistem Informasi",
  "kode": "UI-SI",
  "fakultas": "Fakultas Ilmu Komputer",
  "jenjang": "S1",
  "kelompok": "SAINTEK",
  "dayaTampung": 90,
  "passingGrade": 735.0,
  "deskripsi": "Program studi yang memadukan teknologi informasi dengan manajemen bisnis.",
  "prospekKerja": "System Analyst, IT Consultant, Business Intelligence Analyst"
}
```

**Success Response** `201 Created`:

```json
{
  "data": {
    "id": "f6a7b8c9-d0e1-2345-6789-0abcdef01234",
    "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nama": "Sistem Informasi",
    "kode": "UI-SI",
    "fakultas": "Fakultas Ilmu Komputer",
    "jenjang": "S1",
    "kelompok": "SAINTEK",
    "dayaTampung": 90,
    "passingGrade": 735.0,
    "deskripsi": "Program studi yang memadukan teknologi informasi dengan manajemen bisnis.",
    "prospekKerja": "System Analyst, IT Consultant, Business Intelligence Analyst",
    "createdAt": "2026-05-26T03:30:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` — field wajib tidak diisi:

```json
{
  "message": "Field ptnId, nama, kode, fakultas, jenjang, dan kelompok wajib diisi"
}
```

`400 Bad Request` — jenjang tidak valid:

```json
{
  "message": "Jenjang tidak valid"
}
```

`400 Bad Request` — kelompok tidak valid:

```json
{
  "message": "Kelompok tidak valid"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:

```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — PTN dengan ptnId tidak ditemukan:

```json
{
  "message": "PTN tidak ditemukan"
}
```

---

#### PUT /api/v1/ptn/jurusan/:id

**Deskripsi:** Mengupdate data jurusan. Hanya field yang dikirim yang akan diupdate (partial update).
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi         |
| --------- | ------ | ----- | ----------------- |
| `id`      | string | Ya    | UUID dari jurusan |

**Request Body (semua field opsional):**

```json
{
  "dayaTampung": 100,
  "passingGrade": 740.0,
  "prospekKerja": "System Analyst, IT Manager, CTO"
}
```

**Success Response** `200 OK`:

```json
{
  "data": {
    "id": "f6a7b8c9-d0e1-2345-6789-0abcdef01234",
    "ptnId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nama": "Sistem Informasi",
    "kode": "UI-SI",
    "fakultas": "Fakultas Ilmu Komputer",
    "jenjang": "S1",
    "kelompok": "SAINTEK",
    "dayaTampung": 100,
    "passingGrade": 740.0,
    "deskripsi": "Program studi yang memadukan teknologi informasi dengan manajemen bisnis.",
    "prospekKerja": "System Analyst, IT Manager, CTO",
    "createdAt": "2026-05-26T03:30:00.000Z"
  }
}
```

**Error Responses:**

`400 Bad Request` — jenjang atau kelompok tidak valid:

```json
{
  "message": "Jenjang tidak valid"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:

```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — jurusan tidak ditemukan:

```json
{
  "message": "Jurusan tidak ditemukan"
}
```

---

#### DELETE /api/v1/ptn/jurusan/:id

**Deskripsi:** Menghapus satu jurusan secara permanen.
**Auth required:** Ya
**Role required:** `ADMIN`

**Request Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Token Admin)
```

**URL Parameters:**

| Parameter | Tipe   | Wajib | Deskripsi         |
| --------- | ------ | ----- | ----------------- |
| `id`      | string | Ya    | UUID dari jurusan |

**Success Response** `200 OK`:

```json
{
  "message": "Jurusan berhasil dihapus"
}
```

**Error Responses:**

`403 Forbidden` — role pengakses bukan ADMIN:

```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

`404 Not Found` — jurusan tidak ditemukan:

```json
{
  "message": "Jurusan tidak ditemukan"
}
```

---

### Dashboard

#### GET /api/v1/dashboard

**Deskripsi:** Mengambil data ringkasan dan analisis performa belajar siswa, termasuk overview latihan, overview tryout, statistik latihan per mata pelajaran, dan riwayat serta tren tryout.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Authorization: Bearer <siswa_access_token>
```

**Success Response** `200 OK`:
```json
{
  "data": {
    "overview": {
      "totalLatihan": 2,
      "totalTryout": 1,
      "rataRataSkorLatihan": 70.0,
      "rataRataSkorTryout": 72.0,
      "totalSoalDijawab": 21
    },
    "latihanAnalytics": {
      "perMapel": [
        {
          "mapel": "TPS",
          "totalSesi": 1,
          "rataRataSkor": 80.0,
          "skorTertinggi": 80,
          "skorTerendah": 80,
          "trenSkor": [
            {
              "sesiId": "f7e8d9c0-b1a2-3456-7890-abcdef012345",
              "skor": 80,
              "tanggal": "2026-05-22T08:00:00.000Z"
            }
          ]
        },
        {
          "mapel": "TKA_SAINTEK",
          "totalSesi": 1,
          "rataRataSkor": 60.0,
          "skorTertinggi": 60,
          "skorTerendah": 60,
          "trenSkor": [
            {
              "sesiId": "e6d7c8b9-a0f1-2345-6789-abcdef012345",
              "skor": 60,
              "tanggal": "2026-05-22T09:00:00.000Z"
            }
          ]
        }
      ],
      "kelemahanMapel": "TKA_SAINTEK"
    },
    "tryoutAnalytics": {
      "riwayat": [
        {
          "sesiId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
          "judulTryout": "Tryout UTBK Batch 1 2026",
          "skorTps": 70,
          "skorTka": 75,
          "skorTotal": 72,
          "status": "SUBMITTED",
          "tanggal": "2026-05-25T10:00:00.000Z"
        }
      ],
      "trenSkorTotal": [
        {
          "sesiId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
          "judulTryout": "Tryout UTBK Batch 1 2026",
          "skorTotal": 72,
          "tanggal": "2026-05-25T10:00:00.000Z"
        }
      ],
      "skorTerbaik": {
        "sesiId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
        "judulTryout": "Tryout UTBK Batch 1 2026",
        "skorTotal": 72
      },
      "progressDariAwal": null
    }
  }
}
```

**Error Responses:**

`401 Unauthorized` — token tidak valid atau expired:
```json
{
  "message": "Token tidak valid atau sudah expired"
}
```

`403 Forbidden` — role pengakses bukan SISWA:
```json
{
  "message": "Akses ditolak. Diperlukan role: SISWA"
}
```

---

#### GET /api/v1/dashboard/admin

**Deskripsi:** Mengambil data ringkasan performa dan statistik seluruh platform untuk admin, mencakup jumlah user, soal, ptn, jurusan, tryout, total aktivitas belajar, statistik tryout, dan daftar 10 siswa terbaik.  
**Auth required:** Ya  
**Role required:** `ADMIN`

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Success Response** `200 OK`:
```json
{
  "data": {
    "platform": {
      "totalUser": 150,
      "totalSoal": 500,
      "totalPTN": 12,
      "totalJurusan": 85,
      "totalTryout": 5,
      "totalTryoutOngoing": 1
    },
    "aktivitasBelajar": {
      "totalSesiLatihan": 320,
      "totalSesiTryout": 140,
      "rataRataSkorLatihan": 68.5,
      "rataRataSkorTryout": 62.3
    },
    "tryoutStats": [
      {
        "tryoutId": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
        "judul": "Tryout UTBK Batch 1 2026",
        "status": "ENDED",
        "totalPeserta": 95,
        "rataRataSkorTotal": 65.2,
        "skorTertinggi": 88.0,
        "skorTerendah": 35.0
      }
    ],
    "topSiswa": [
      {
        "userId": "test-rek-siswa-uuid",
        "nama": "Test Siswa Rek",
        "email": "siswa-rek@utbk.dev",
        "totalTryout": 2,
        "rataRataSkorTryout": 76.5
      }
    ]
  }
}
```

**Error Responses:**

`401 Unauthorized` — token tidak valid atau expired:
```json
{
  "message": "Token tidak valid atau sudah expired"
}
```

`403 Forbidden` — role pengakses bukan ADMIN:
```json
{
  "message": "Akses ditolak. Diperlukan role: ADMIN"
}
```

---

### Rekomendasi

#### GET /api/v1/rekomendasi

**Deskripsi:** Mengambil daftar rekomendasi jurusan PTN berdasarkan rata-rata skor tryout siswa. Jurusan dikelompokkan dan diurutkan berdasarkan tingkat kelulusan (`aman`, `kompetitif`, `tantangan`) dan selisih passing grade.  
**Auth required:** Ya  
**Role required:** `SISWA`

**Request Headers:**
```
Authorization: Bearer <siswa_access_token>
```

**Query Parameters:**

| Parameter | Tipe   | Wajib | Nilai yang diterima                     | Deskripsi |
|-----------|--------|-------|-----------------------------------------|-----------|
| `kelompok`| string | Tidak | `SAINTEK`, `SOSHUM`, `CAMPURAN`          | Filter berdasarkan kelompok ujian |
| `limit`   | number | Tidak | Integer antara 1 hingga 50 (default 10) | Membatasi jumlah rekomendasi |

**Contoh Request:**
```
GET /api/v1/rekomendasi?kelompok=SAINTEK&limit=5
```

**Success Response** `200 OK`:
```json
{
  "data": {
    "skorReferensi": 715.0,
    "totalRekomendasi": 3,
    "rekomendasi": [
      {
        "jurusanId": "c3d4e5f6-a7b8-9012-cdef-012345678901",
        "namaJurusan": "Ilmu Perpustakaan",
        "fakultas": "Fakultas Ilmu Pengetahuan Budaya",
        "jenjang": "S1",
        "kelompok": "SOSHUM",
        "ptn": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "nama": "Universitas Indonesia",
          "singkatan": "UI",
          "kota": "Depok"
        },
        "passingGrade": 680.0,
        "selisih": -35.0,
        "kategori": "aman"
      },
      {
        "jurusanId": "d4e5f6a7-b8c9-0123-cdef-012345678902",
        "namaJurusan": "Sastra Indonesia",
        "fakultas": "Fakultas Ilmu Pengetahuan Budaya",
        "jenjang": "S1",
        "kelompok": "SOSHUM",
        "ptn": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "nama": "Universitas Indonesia",
          "singkatan": "UI",
          "kota": "Depok"
        },
        "passingGrade": 720.0,
        "selisih": 5.0,
        "kategori": "kompetitif"
      },
      {
        "jurusanId": "e5f6a7b8-c9d0-1234-cdef-012345678903",
        "namaJurusan": "Ilmu Hukum",
        "fakultas": "Fakultas Hukum",
        "jenjang": "S1",
        "kelompok": "SOSHUM",
        "ptn": {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "nama": "Universitas Indonesia",
          "singkatan": "UI",
          "kota": "Depok"
        },
        "passingGrade": 750.0,
        "selisih": 35.0,
        "kategori": "tantangan"
      }
    ]
  }
}
```

**Error Responses:**

`400 Bad Request` — belum memiliki data tryout yang selesai:
```json
{
  "message": "Belum ada data tryout yang diselesaikan untuk menghitung skor referensi"
}
```

`400 Bad Request` — filter kelompok tidak valid:
```json
{
  "message": "Kelompok tidak valid, harus SAINTEK, SOSHUM, atau CAMPURAN"
}
```

`401 Unauthorized` — token tidak valid atau expired:
```json
{
  "message": "Token tidak valid atau sudah expired"
}
```

`403 Forbidden` — role pengakses bukan SISWA:
```json
{
  "message": "Akses ditolak. Diperlukan role: SISWA"
}
```

---

## Error Codes

| Status Code | Deskripsi                                                        |
|-------------|------------------------------------------------------------------|
| `200`       | Request berhasil                                                 |
| `201`       | Resource berhasil dibuat                                         |
| `400`       | Bad Request — validasi gagal atau input tidak valid               |
| `401`       | Unauthorized — token tidak ada, tidak valid, atau sudah expired   |
| `403`       | Forbidden — user tidak memiliki akses karena role tidak memadai    |
| `404`       | Not Found — resource tidak ditemukan                              |
| `500`       | Internal Server Error — kesalahan server                          |

Semua error response menggunakan format:
```json
{
  "message": "Deskripsi error dalam Bahasa Indonesia"
}
```

> **Catatan:** Pesan error dari Supabase Auth (seperti `"Invalid login credentials"` dan `"User already registered"`) dikembalikan dalam Bahasa Inggris sesuai default Supabase.

# UTBK Platform API Documentation

## Base URL

```
development: http://localhost:3000/api/v1
production: https://utbk-backend-production.up.railway.app/
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

**Deskripsi:** Mengambil data profil user yang sedang login.  
**Auth required:** Ya

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** `200 OK`:
```json
{
  "user": {
    "id": "cbb75c0d-ac8b-4939-9f24-b69379271c68",
    "email": "siswa@utbk.dev"
  }
}
```

**Error Responses:**

`401 Unauthorized` — token tidak valid:
```json
{
  "message": "Token tidak valid atau sudah expired"
}
```

---

### Soal

> **Catatan:** Field `jawaban` (kunci jawaban benar) **tidak pernah dikembalikan** di response endpoint Soal manapun (GET, POST, PUT, DELETE).

#### GET /api/v1/soal

**Deskripsi:** Mengambil daftar semua soal. Mendukung filter berdasarkan `mapel` dan `tingkat`.  
**Auth required:** Ya

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

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

---

#### PUT /api/v1/soal/:id

**Deskripsi:** Mengupdate soal berdasarkan ID. Hanya field yang dikirim yang akan diupdate (partial update). Field `jawaban` **tidak dikembalikan** di response.  
**Auth required:** Ya

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

### Latihan

#### POST /api/v1/latihan/mulai

**Deskripsi:** Memulai sesi latihan baru. Soal akan diacak menggunakan algoritma Fisher-Yates. Jika soal yang tersedia di database kurang dari jumlah yang diminta, akan dikembalikan soal sebanyak yang tersedia tanpa error.  
**Auth required:** Ya

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

---

#### POST /api/v1/latihan/:sessionId/submit

**Deskripsi:** Submit jawaban untuk sesi latihan. Skor dihitung otomatis berdasarkan persentase jawaban benar, dibulatkan ke integer terdekat. Data jawaban dan update skor disimpan dalam satu transaksi database.  
**Auth required:** Ya

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

`404 Not Found` — session tidak ditemukan:
```json
{
  "message": "Sesi latihan tidak ditemukan"
}
```

`403 Forbidden` — session milik user lain:
```json
{
  "message": "Anda tidak memiliki akses ke sesi ini"
}
```

`400 Bad Request` — session sudah selesai:
```json
{
  "message": "Sesi latihan sudah selesai"
}
```

`400 Bad Request` — jawaban kosong:
```json
{
  "message": "Jawaban tidak boleh kosong"
}
```

`400 Bad Request` — format jawaban tidak valid:
```json
{
  "message": "Setiap item jawaban wajib memiliki jawaban yang valid (A-E)"
}
```

---

#### GET /api/v1/latihan/riwayat

**Deskripsi:** Mengambil daftar riwayat semua sesi latihan milik user yang sedang login, diurutkan dari yang terbaru.  
**Auth required:** Ya

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

---

#### GET /api/v1/latihan/:sessionId

**Deskripsi:** Mengambil detail lengkap sesi latihan, termasuk jawaban user, kunci jawaban benar, status benar/salah, dan pembahasan untuk setiap soal.  
**Auth required:** Ya

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

`404 Not Found` — session tidak ditemukan:
```json
{
  "message": "Sesi latihan tidak ditemukan"
}
```

`403 Forbidden` — session milik user lain:
```json
{
  "message": "Anda tidak memiliki akses ke sesi ini"
}
```

---

### Info PTN

#### GET /api/v1/info/jalur

**Deskripsi:** Mengambil daftar semua jalur masuk PTN yang tersedia.  
**Auth required:** Tidak

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

## Error Codes

| Status Code | Deskripsi                                                        |
|-------------|------------------------------------------------------------------|
| `200`       | Request berhasil                                                 |
| `201`       | Resource berhasil dibuat                                         |
| `400`       | Bad Request — validasi gagal atau input tidak valid               |
| `401`       | Unauthorized — token tidak ada, tidak valid, atau sudah expired   |
| `403`       | Forbidden — user tidak memiliki akses ke resource ini             |
| `404`       | Not Found — resource tidak ditemukan                              |
| `500`       | Internal Server Error — kesalahan server                          |

Semua error response menggunakan format:
```json
{
  "message": "Deskripsi error dalam Bahasa Indonesia"
}
```

> **Catatan:** Pesan error dari Supabase Auth (seperti `"Invalid login credentials"` dan `"User already registered"`) dikembalikan dalam Bahasa Inggris sesuai default Supabase.

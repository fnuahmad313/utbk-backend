# UTBK Backend

REST API backend for the UTBK (Ujian Tulis Berbasis Komputer) preparation platform. Built with Express.js, Prisma ORM, and Supabase Auth, it provides practice exam management, session tracking, and PTN admission pathway information for students preparing for Indonesia's national university entrance exam.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [API Endpoints](#api-endpoints)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## Features

- **Supabase Auth integration** — JWT-based authentication using Supabase's managed auth service
- **Role-based access control (RBAC)** — `ADMIN` and `SISWA` roles with per-route enforcement
- **Practice exam sessions** — Start randomised sessions, submit answers, and review results with answer keys and explanations
- **Question bank management** — Full CRUD for exam questions (admin only), with support for `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, and `SHORT_ANSWER` question types
- **PTN admission info** — Static information on SNBT, Mandiri, and Prestasi (SNBP) admission pathways
- **Answer key protection** — The `jawaban` (answer key) field is never returned in any public response
- **Database migrations** — Prisma-managed PostgreSQL migrations, including the `role` column added to the `User` table

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Runtime      | Node.js                             |
| Framework    | Express.js v5                       |
| Language     | TypeScript                          |
| ORM          | Prisma v6                           |
| Database     | PostgreSQL (via Supabase)           |
| Auth         | Supabase Auth (`@supabase/supabase-js`) |
| Testing      | Vitest + Supertest                  |

---

## Prerequisites

- Node.js 18 or later
- A [Supabase](https://supabase.com) project with a PostgreSQL database
- `npm` or compatible package manager

---

## Installation & Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd utbk-backend

# 2. Install dependencies
npm install

# 3. Copy the example environment file and fill in your values
cp .env.example .env

# 4. Run database migrations
npx prisma migrate deploy

# 5. (Optional) Seed example questions
npm run db:seed
```

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase project URL — found in Project Settings > API
SUPABASE_URL=https://<project-ref>.supabase.co

# Supabase anon/public key — used for client-side auth operations (sign up, sign in)
SUPABASE_ANON_KEY=eyJ...

# Supabase service role key — used server-side for admin operations (token verification, user management)
# Keep this secret — it bypasses Row Level Security
SUPABASE_SERVICE_KEY=eyJ...

# Prisma connection pooling URL — use the pooler connection string from Supabase
# Format: postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
DATABASE_URL=postgresql://...

# Direct (non-pooled) connection URL — required by Prisma for migrations
# Format: postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
DIRECT_URL=postgresql://...
```

| Variable              | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `SUPABASE_URL`        | Your Supabase project URL                                                   |
| `SUPABASE_ANON_KEY`   | Public anon key for client-facing auth (sign up, sign in)                  |
| `SUPABASE_SERVICE_KEY`| Service role key for server-side admin operations; **never expose publicly**|
| `DATABASE_URL`        | Pooled connection string used by Prisma at runtime                          |
| `DIRECT_URL`          | Direct connection string used by Prisma CLI for migrations                  |

Both `DATABASE_URL` and `DIRECT_URL` can be found in your Supabase dashboard under **Project Settings → Database → Connection string**.

---

## Database Setup

### Migrations

This project uses Prisma Migrate. All migration files live in `prisma/migrations/`.

```bash
# Apply all pending migrations (production-safe)
npx prisma migrate deploy

# Create and apply a new migration during development
npm run db:migrate

# Open Prisma Studio to browse data
npm run db:studio
```

### Schema Overview

```
User
  id        String   (Supabase Auth UUID)
  email     String   (unique)
  name      String
  role      Role     (ADMIN | SISWA, default: SISWA)
  createdAt DateTime

Soal
  id         String   (UUID)
  pertanyaan String
  tipe       TipeSoal (SINGLE_CHOICE | MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER)
  opsi       Json?
  jawaban    Json     (answer key — never returned in API responses)
  pembahasan String?
  mapel      String   (TPS | TKA_SAINTEK | TKA_SOSHUM)
  tingkat    String   (mudah | sedang | sulit)
  createdAt  DateTime

LatihanSession
  id        String
  userId    String   → User.id
  mapel     String
  skor      Int?
  selesai   Boolean
  createdAt DateTime

JawabanSiswa
  id        String
  sessionId String   → LatihanSession.id
  soalId    String   → Soal.id
  jawaban   Json
  benar     Boolean

PTN
  id          String   (UUID)
  nama        String
  singkatan   String
  kota        String
  provinsi    String
  akreditasi  String   (Unggul | Baik Sekali | Baik | A | B | C)
  tipe        String   (Universitas | Institut | Politeknik | Sekolah Tinggi)
  website     String?
  logoUrl     String?
  deskripsi   String?
  createdAt   DateTime

Jurusan
  id             String   (UUID)
  ptnId          String   → PTN.id
  nama           String
  kode           String
  fakultas       String
  jenjang        String   (S1 | D3 | D4)
  kelompok       String   (SAINTEK | SOSHUM | CAMPURAN)
  dayaTampung    Int?
  passingGrade   Float?
  deskripsi      String?
  prospekKerja   String?
  createdAt      DateTime
```

### Migration History

| Migration | Description |
|-----------|-------------|
| `20260521231034_init` | Initial schema — `User`, `Soal`, `LatihanSession`, `JawabanSiswa` tables |
| `20260522000001_add_role_to_user` | Added `Role` enum (`ADMIN`, `SISWA`) and `role` column to `User` table |

---

## Role-Based Access Control (RBAC)

### Roles

| Role    | Description                                                                 |
|---------|-----------------------------------------------------------------------------|
| `SISWA` | Default role assigned to all newly registered users. Can access the question bank (read-only) and all latihan (practice) endpoints. |
| `ADMIN` | Elevated role. Can manage questions (create, update, delete) and change the role of any user via `PATCH /auth/role`. |

### How It Works

1. A user registers via `POST /auth/register`. Supabase creates the auth record and a webhook (or the first authenticated request) syncs the user to the `User` table in PostgreSQL with `role = SISWA`.
2. On every protected request, the `Authorization: Bearer <token>` header is validated against Supabase using the service role key.
3. For role-restricted routes, the `requireRole` middleware looks up the user's `role` in the PostgreSQL `User` table and rejects the request with `403 Forbidden` if the role does not match.

### Creating an Admin User

New users always receive the `SISWA` role by default. To promote a user to `ADMIN`, use one of the following methods:

**Method 1 — Via the API (requires an existing ADMIN token):**

```bash
curl -X PATCH https://utbk-backend-production.up.railway.app/api/v1/auth/role \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<target_user_id>", "role": "ADMIN"}'
```

**Method 2 — Via Supabase Dashboard (for the first admin):**

1. Open your Supabase project → **Table Editor** → `User` table.
2. Find the row for the user you want to promote.
3. Click the `role` cell and change the value from `SISWA` to `ADMIN`.
4. Save the row.

**Method 3 — Via SQL Editor:**

```sql
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'your-admin@example.com';
```

---

## API Endpoints

### Quick Reference

| Method   | Endpoint                          | Auth | Role            | Description                        |
|----------|-----------------------------------|------|-----------------|------------------------------------|
| `GET`    | `/health`                         | —    | —               | Health check                       |
| `POST`   | `/api/v1/auth/register`           | —    | —               | Register a new account             |
| `POST`   | `/api/v1/auth/login`              | —    | —               | Login and receive tokens           |
| `POST`   | `/api/v1/auth/logout`             | ✓    | Any             | Logout and invalidate token        |
| `GET`    | `/api/v1/auth/me`                 | ✓    | Any             | Get current user profile           |
| `PATCH`  | `/api/v1/auth/role`               | ✓    | `ADMIN`         | Change a user's role               |
| `GET`    | `/api/v1/soal`                    | ✓    | Any             | List all questions (filterable)    |
| `GET`    | `/api/v1/soal/:id`                | ✓    | Any             | Get a single question              |
| `POST`   | `/api/v1/soal`                    | ✓    | `ADMIN`         | Create a question                  |
| `PUT`    | `/api/v1/soal/:id`                | ✓    | `ADMIN`         | Update a question                  |
| `DELETE` | `/api/v1/soal/:id`                | ✓    | `ADMIN`         | Delete a question                  |
| `POST`   | `/api/v1/latihan/mulai`           | ✓    | `SISWA`         | Start a practice session           |
| `POST`   | `/api/v1/latihan/:sessionId/submit` | ✓  | `SISWA`         | Submit answers for a session       |
| `GET`    | `/api/v1/latihan/riwayat`         | ✓    | `SISWA`         | List all past sessions             |
| `GET`    | `/api/v1/latihan/:sessionId`      | ✓    | `SISWA`         | Get session detail with results    |
| `GET`    | `/api/v1/info/jalur`              | —    | —               | List all PTN admission pathways    |
| `GET`    | `/api/v1/info/jalur/:slug`        | —    | —               | Get a specific admission pathway   |
| `GET`    | `/api/v1/dashboard`               | ✓    | `SISWA`         | Get student dashboard analytics    |
| `GET`    | `/api/v1/dashboard/admin`         | ✓    | `ADMIN`         | Get admin dashboard platform stats |
| `GET`    | `/api/v1/rekomendasi`             | ✓    | `SISWA`         | Get major recommendations          |


### Tryout (`/api/v1/tryout`)

| Method | Path | Role | Deskripsi |
|--------|------|------|-----------|
| POST | /api/v1/tryout | ADMIN | Buat tryout baru (status DRAFT) |
| PATCH | /api/v1/tryout/:id/status | ADMIN | Update status tryout (DRAFT→PUBLISHED→ONGOING→ENDED) |
| POST | /api/v1/tryout/:id/subtes | ADMIN | Tambah/replace soal di subtes TPS atau TKA |
| DELETE | /api/v1/tryout/:id | ADMIN | Hapus tryout (hanya status DRAFT) |
| GET | /api/v1/tryout | SISWA | Daftar tryout PUBLISHED dan ONGOING |
| GET | /api/v1/tryout/:id | SISWA | Detail tryout |
| POST | /api/v1/tryout/:id/mulai | SISWA | Mulai sesi tryout, mendapat soal TPS |
| POST | /api/v1/tryout/sesi/:sesiId/submit-subtes | SISWA | Submit jawaban subtes aktif, lanjut ke subtes berikutnya |
| POST | /api/v1/tryout/sesi/:sesiId/selesai | SISWA | Selesaikan tryout, hitung skor final |
| GET | /api/v1/tryout/sesi/:sesiId/hasil | SISWA | Lihat hasil sesi tryout |
| GET | /api/v1/tryout/sesi/riwayat | SISWA | Riwayat sesi tryout milik siswa |

### PTN & Jurusan (`/api/v1/ptn`)

| Method | Path | Role | Deskripsi |
|--------|------|------|-----------|
| GET | /api/v1/ptn | Any | Daftar PTN (filterable by `provinsi`, `tipe`, `akreditasi`, `search`) |
| GET | /api/v1/ptn/:id | Any | Detail PTN beserta semua jurusannya |
| POST | /api/v1/ptn | ADMIN | Buat PTN baru |
| PUT | /api/v1/ptn/:id | ADMIN | Update data PTN |
| DELETE | /api/v1/ptn/:id | ADMIN | Hapus PTN beserta semua jurusannya |
| GET | /api/v1/ptn/:ptnId/jurusan | Any | Daftar jurusan dari PTN tertentu (filterable by `kelompok`, `jenjang`, `search`) |
| GET | /api/v1/ptn/jurusan | Any | Daftar semua jurusan dari semua PTN (filterable by `kelompok`, `jenjang`, `search`) |
| GET | /api/v1/ptn/jurusan/:id | Any | Detail jurusan beserta data PTN |
| POST | /api/v1/ptn/jurusan | ADMIN | Buat jurusan baru |
| PUT | /api/v1/ptn/jurusan/:id | ADMIN | Update data jurusan |
| DELETE | /api/v1/ptn/jurusan/:id | ADMIN | Hapus jurusan |

### Dashboard (`/api/v1/dashboard`)

| Method | Path | Role | Deskripsi |
|--------|------|------|-----------|
| GET | /api/v1/dashboard | SISWA | Dashboard siswa (overview & analisis belajar) |
| GET | /api/v1/dashboard/admin | ADMIN | Dashboard admin (status platform, aktivitas, & top siswa) |

### Rekomendasi (`/api/v1/rekomendasi`)

| Method | Path | Role | Deskripsi |
|--------|------|------|-----------|
| GET | /api/v1/rekomendasi | SISWA | Daftar rekomendasi jurusan PTN berdasarkan rata-rata skor tryout |

For full request/response schemas, see [`docs/API.md`](docs/API.md).


---

## Running Locally

```bash
# Start the development server with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

The server starts on `http://localhost:3000` by default. Set the `PORT` environment variable to override.

---

## Deployment

This project is deployed on [Railway](https://railway.app).

**Pre-deploy command** (runs before each deploy to apply pending migrations):

```
npx prisma migrate deploy
```

**Start command:**

```
node dist/app.js
```

**Build command:**

```
npm run build
```

Ensure all [environment variables](#environment-variables) are configured in your Railway service settings before deploying.

---

## Project Structure

```
utbk-backend/
├── prisma/
│   ├── migrations/
│   │   ├── 20260521231034_init/          # Initial schema
│   │   └── 20260522000001_add_role_to_user/ # RBAC: role column
│   ├── schema.prisma                     # Prisma schema (models + enums)
│   └── seed.ts                           # Database seeder
├── src/
│   ├── config/
│   │   ├── env.ts                        # Loads .env via dotenv
│   │   ├── prisma.ts                     # Prisma client singleton
│   │   └── supabase.ts                   # Supabase client + admin client
│   ├── middlewares/
│   │   ├── auth.middleware.ts            # Bearer token verification (Supabase)
│   │   └── role.middleware.ts            # Role-based access control guard
│   ├── modules/
│   │   ├── auth/
│   │   │   └── auth.routes.ts            # /register, /login, /logout, /me, /role
│   │   ├── soal/
│   │   │   ├── soal.controller.ts
│   │   │   ├── soal.routes.ts            # Question CRUD
│   │   │   └── soal.service.ts
│   │   ├── latihan/
│   │   │   ├── latihan.controller.ts
│   │   │   ├── latihan.routes.ts         # Practice session management
│   │   │   └── latihan.service.ts
│   │   └── info/
│   │       ├── info.controller.ts
│   │       ├── info.routes.ts            # PTN admission info
│   │       └── info.service.ts
│   ├── routes/
│   │   └── index.ts                      # Root router — mounts all modules
│   ├── tests/
│   │   ├── auth.test.ts
│   │   ├── soal.test.ts
│   │   ├── latihan.test.ts
│   │   ├── info.test.ts
│   │   └── setup.ts
│   └── app.ts                            # Express app entry point
├── docs/
│   └── API.md                            # Full API reference with request/response examples
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## API Documentation

Full API reference with detailed request/response examples is available in [`docs/API.md`](docs/API.md).

### Base URL

```
development:  http://localhost:3000/api/v1
production:   https://utbk-backend-production.up.railway.app/api/v1
```

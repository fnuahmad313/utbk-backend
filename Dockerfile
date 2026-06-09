# ==========================================
# STAGE 1: Build Image
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Salin package management untuk instalasi dependensi
COPY package*.json ./
COPY prisma ./prisma/

# Install semua dependensi (termasuk devDependencies untuk TypeScript)
RUN npm ci

# Salin seluruh kode sumber project
COPY . .

# Generate Prisma Client agar sinkron dengan skema database Supabase-mu
RUN npx prisma generate

# Compile TypeScript ke JavaScript (output akan berada di folder dist/)
RUN npm run build

# Bersihkan devDependencies untuk menghemat ruang di stage produksi
RUN npm prune --production


# ==========================================
# STAGE 2: Production Image
# ==========================================
FROM node:18-alpine AS runner

WORKDIR /app

# Terapkan lingkungan produksi
ENV NODE_ENV=production
# WAJIB: Hugging Face hanya mendengarkan port 7860
ENV PORT=7860
EXPOSE 7860

# Salin hanya file yang dibutuhkan untuk menjalankan aplikasi dari stage builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Jalankan aplikasi menggunakan build terkompilasi
CMD ["node", "dist/app.js"]
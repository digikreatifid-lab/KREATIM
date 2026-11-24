# Kreatim — MVP Phase 1

Tim kreatif AI untuk brand yang baru tumbuh. Spesifikasi lengkap ada di [`docs/PRD_PHASE_1.md`](docs/PRD_PHASE_1.md), aturan kerja engineering di [`CLAUDE.md`](CLAUDE.md).

## Menjalankan secara lokal

Prasyarat: Node.js 20+ dan PostgreSQL 16.

```bash
npm install
cp .env.example .env            # isi DATABASE_URL, AUTH_SECRET, dll.
npx prisma db push              # atau: npm run db:migrate
npm run dev                     # http://localhost:3000
```

`AUTH_SECRET` bisa dibuat dengan `npx auth secret` atau `openssl rand -base64 32`.
Tombol "Lanjutkan dengan Google" otomatis muncul jika `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` terisi
(redirect URI: `<APP_URL>/api/auth/callback/google`).

## Test

Test memakai database PostgreSQL sungguhan (bukan mock) agar race condition saldo benar-benar teruji.

```bash
cp .env.test.example .env.test  # arahkan ke database KHUSUS test, isinya dihapus tiap test
npm test
```

## Perintah lain

| Perintah | Fungsi |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | Pemeriksaan TypeScript |
| `npm run build` | Build produksi |

## Struktur utama

```
src/
├── app/
│   ├── (auth)/              login & register
│   ├── (dashboard)/         area aplikasi setelah login
│   └── api/                 API routes
├── auth.ts, auth.config.ts  Auth.js v5 (Email/Password + Google)
├── components/ui/           komponen gaya shadcn/ui
├── lib/                     prisma, plans (harga & kuota), helper API
└── services/                creditService, userService, ...
tests/                       Vitest (pakai database test)
```

# Panduan Prompt Eksekusi Bertahap (Claude Code & Antigravity)

Gunakan prompt di bawah ini satu per satu sesuai urutan Sprint. Pastikan file `CLAUDE.md`, `docs/PRD_PHASE_1.md`, dan `prisma/schema.prisma` sudah ada di root repositori sebelum memulai.

---

## SPRINT 1 — Fondasi, Auth & Credit Ledger Engine (Jalankan di Claude Code)
```text
Baca CLAUDE.md, docs/PRD_PHASE_1.md, dan prisma/schema.prisma secara menyeluruh.
Kita mulai dari SPRINT 1 saja:
1. Inisialisasi Next.js 15 (App Router, TypeScript, Tailwind CSS, shadcn/ui, Zod, Vitest).
2. Integrasikan Prisma Client dengan schema yang sudah ada di prisma/schema.prisma.
3. Setup autentikasi Email/Password + Google OAuth (Better Auth atau NextAuth v5) di mana user baru otomatis mendapat 15 subCredits (FREE_TRIAL).
4. Bangun src/services/creditService.ts dengan fungsi:
   - reserveCredits(userId, cost, type, referenceId, description) -> atomik, potong subCredits dulu lalu topupCredits, tolak jika saldo kurang.
   - refundCredits(userId, amount, originalBucketSplit, referenceId, reason) -> catat REFUND_FAILED_JOB.
   - grantCredits(userId, amount, bucket, type, referenceId, description).
5. Tulis unit test di tests/creditService.test.ts termasuk simulasi 2 request paralel (race condition) saat saldo tepat 5 kredit.
Tampilkan rencana struktur file terlebih dahulu sebelum mulai menulis kode.
```

---

## SPRINT 2 — Onboarding & Brand Brain + R2 Upload (Claude Code + Antigravity)
```text
Lanjutkan ke SPRINT 2 sesuai docs/PRD_PHASE_1.md:
1. Buat helper src/lib/r2.ts dan endpoint POST /api/upload/presign untuk upload logo & foto produk ke Cloudflare R2 (validasi tipe PNG/JPG/WebP, maks 5 MB).
2. Buat CRUD API /api/brands dengan validasi batas kuota paket (FREE_TRIAL/STARTER: 1 brand, GROWTH: 3 brand, PRO: 10 brand).
3. Buat src/services/brandContextService.ts dengan fungsi buildBrandContextPrompt(brandId) yang menyusun ringkasan JSON profil brand untuk disuntikkan ke prompt AI.
4. Bangun UI Onboarding Wizard 3 langkah dan halaman manajemen Brand Brain (profil, warna Hex dengan live preview, logo, dan katalog produk) yang clean dan minimalis.
```

---

## SPRINT 3 — Agent Penulis & Agent Desain Grafis Hybrid (Claude Code + Antigravity)
```text
Lanjutkan ke SPRINT 3 sesuai docs/PRD_PHASE_1.md:
1. Bangun Agent Penulis:
   - Endpoint POST /api/agents/copywriter (reserve 1 kredit -> panggil Gemini Flash/Claude Haiku -> output 3 variasi JSON bahasa Indonesia natural -> auto-refund jika error).
   - UI Copywriter dengan tombol Salin, Simpan, dan "Kirim ke Agent Desain".
2. Bangun Agent Desain Grafis Hybrid:
   - Endpoint POST /api/agents/design/generate (reserve 5 kredit -> panggil Image AI Layer 1 tanpa teks -> simpan bgUrl ke R2 -> render awal Layer 2 via Satori + @resvg/resvg-js -> auto-refund jika error).
   - Buat src/services/satoriRenderer.ts berisi 5 template minimalis (Hero Promo, Split Product, Minimalist Badge, Bold Typography, Story Showcase) mendukung rasio 4:5 (1080x1350) dan 9:16 (1080x1920).
   - Endpoint POST /api/agents/design/render (0 KREDIT / GRATIS) untuk live edit headline, sub-headline, harga, CTA, dan ganti template tanpa memotong saldo.
   - Bangun UI Design Studio lengkap dengan live preview dan tombol Download PNG resolusi tinggi.
```

---

## SPRINT 4 — Billing, Webhook Idempoten & Launch Readiness (Claude Code)
```text
Lanjutkan ke SPRINT 4 sesuai docs/PRD_PHASE_1.md:
1. Buat halaman Pricing & Billing (Starter Rp 99rb, Growth Rp 249rb, Pro Rp 499rb, Top-Up Mini Rp 49rb, Boost Rp 129rb) serta tabel Riwayat Mutasi Credit Ledger.
2. Bangun endpoint POST /api/billing/checkout (integrasi Midtrans Snap atau Tripay) dan POST /api/webhooks/payment dengan verifikasi signature serta idempotency check pada externalOrderId.
3. Buat endpoint POST /api/cron/reset-credits (dilindungi CRON_SECRET header) untuk mereset subCredits yang melewati subExpiresAt dan mencatat MONTHLY_EXPIRATION di CreditLedger.
4. Lakukan audit keamanan dasar (cek IDOR, validasi Zod, sanitasi URL R2 di Satori) dan siapkan Dockerfile + panduan deploy ke VPS.
```

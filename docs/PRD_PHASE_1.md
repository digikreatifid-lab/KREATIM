# Product Requirements Document (PRD): Kreatim — MVP Phase 1

**Produk:** Kreatim (`kreatim.id` / `kreatim.ai`)
**Versi:** Phase 1.0 (MVP Commercial Launch)
**Target Pasar:** Pemilik brand perintis & UMKM di Indonesia

## 1. Ruang Lingkup (Scope)
### In-Scope (Phase 1)
1. Autentikasi (Email/Password + Google OAuth) & Dashboard minimalis.
2. **Brand Brain:** Profil brand terpusat (logo, warna Hex, font preset, target audiens, tone of voice, katalog produk).
3. **Agent Penulis (1 kredit/aksi):** Caption IG/TikTok, Ad Copy Meta/Google, Skrip Video 30 dtk, Deskripsi Marketplace (output 3 variasi JSON terstruktur).
4. **Agent Desain Grafis Hybrid (5 kredit/aksi):**
   - Layer 1: AI Background/Product Staging tanpa teks (Gemini Image API / Flux Fal.ai).
   - Layer 2: Render deterministik via Satori + `@resvg/resvg-js` dengan 5 template minimalis rasio **4:5 (`1080x1350`)** dan **9:16 (`1080x1920`)**.
   - Live Re-Render Edit Teks/Harga/Logo/Template: **0 kredit (Gratis)**.
5. **Credit Ledger & Billing:** Sistem kredit anti-bocor (Reserve -> Execute -> Refund), paket Starter/Growth/Pro + Top-Up Mini/Boost, integrasi Midtrans/Tripay, dan cron *monthly credit reset*.

### Out-of-Scope (Ditunda ke Phase 2 & 3)
- Agent Admin Sosmed (Auto-Scheduler Meta/TikTok API).
- Agent Video Editor (FFmpeg, Whisper, Voiceover, Image-to-Video).

## 2. Paket Harga & Kuota
- **Free Trial:** Rp 0 — 15 kredit sekali daftar (1 Brand).
- **Starter:** Rp 99.000/bln — 200 kredit/bln, reset 30 hari (1 Brand).
- **Growth:** Rp 249.000/bln — 600 kredit/bln, reset 30 hari (3 Brand).
- **Pro / Agency:** Rp 499.000/bln — 1.500 kredit/bln, reset 30 hari (10 Brand).
- **Top-Up Mini Pack:** Rp 49.000 — 100 kredit (berlaku 90 hari).
- **Top-Up Boost Pack:** Rp 129.000 — 300 kredit (berlaku 90 hari).

## 3. Bobot Kredit Phase 1
- Agent Penulis: **1 kredit**
- Agent Desain Grafis Hybrid (Generate AI Layer 1 + Render Awal Layer 2): **5 kredit**
- Re-Render / Live Edit Desain (Layer 2 Satori saja): **0 kredit**

## 4. Kontrak API Utama
- `GET/POST /api/brands` — CRUD Brand Brain (cek batas kuota paket).
- `POST /api/upload/presign` — Generate Cloudflare R2 presigned URL (maks 5 MB).
- `POST /api/agents/copywriter` — Reserve 1 kredit -> LLM -> 3 variasi JSON (auto-refund jika gagal).
- `POST /api/agents/design/generate` — Reserve 5 kredit -> Image AI -> R2 -> Satori PNG -> return URL & layers config.
- `POST /api/agents/design/render` — 0 kredit -> Satori re-render menggunakan `bgUrl` milik user.
- `POST /api/billing/checkout` — Buat transaksi PENDING & URL bayar Midtrans/Tripay.
- `POST /api/webhooks/payment` — Verifikasi signature + idempotency `externalOrderId` -> `grantCredits()`.
- `GET /api/credits/ledger` — Saldo aktif & riwayat mutasi kredit.

## 5. Rencana 4 Sprint
- **Sprint 1:** Setup Next.js 15 + Prisma + Auth + `creditService.ts` + unit test concurrency.
- **Sprint 2:** Onboarding Wizard + CRUD Brand Brain + Cloudflare R2 upload + `brandContextService.ts`.
- **Sprint 3:** Agent Penulis (1 kr) + Agent Desain Hybrid (5 kr, 5 template Satori 4:5 & 9:16) + Live Edit (0 kr).
- **Sprint 4:** Midtrans/Tripay Checkout + Idempotent Webhook + Cron Reset Bulanan + Polish & Deploy VPS.

# CLAUDE.md — Kreatim (MVP Phase 1)

Kamu adalah Senior Fullstack & AI Engineer yang membangun **Kreatim** (`kreatim.id`), platform SaaS tim kreatif AI untuk pemilik brand dan UMKM Indonesia.

## 1. Sumber Kebenaran Tunggal (Single Source of Truth)
- Selalu baca `docs/PRD_PHASE_1.md` sebelum membuat fitur baru.
- **DILARANG** membangun fitur Phase 2/3 (Agent Admin Sosmed / Auto-Scheduler & Agent Video Editor / FFmpeg) pada tahap ini.

## 2. Tech Stack Wajib
- **Framework:** Next.js 15 (App Router, TypeScript strict mode).
- **UI:** Tailwind CSS + `shadcn/ui` (clean, minimalist, desktop-first & mobile-responsive).
- **Database:** PostgreSQL + Prisma ORM (`prisma/schema.prisma`).
- **Validasi:** `zod` di seluruh API Routes dan Server Actions.
- **Render Desain (Layer 2):** `satori` + `@resvg/resvg-js` (JANGAN pakai Puppeteer/Playwright).
- **Storage:** Cloudflare R2 (S3-compatible SDK).

## 3. Aturan Ketat Credit Ledger (NON-NEGOTIABLE)
1. **Atomic Transaction:** Setiap pemotongan kredit WAJIB menggunakan `prisma.$transaction` dengan pengecekan saldo di dalam transaksi (atau conditional `updateMany` / row lock `SELECT ... FOR UPDATE`) untuk mencegah *race condition* dan saldo minus.
2. **Urutan Pemotongan Bucket:** Potong `subCredits` terlebih dahulu; jika kurang, potong sisanya dari `topupCredits`.
3. **Pola Reserve -> Execute -> Finalize/Refund:**
   - Potong kredit **sebelum** memanggil API AI (Gemini/Claude/Flux).
   - Catat setiap mutasi di tabel `CreditLedger` (immutable, jangan pernah `DELETE` atau `UPDATE` row ledger).
   - Jika panggilan API AI gagal/timeout, **WAJIB** memanggil `refundCredits()` dengan tipe `REFUND_FAILED_JOB`.
4. **Live Edit Gratis (0 Kredit):** Endpoint `/api/agents/design/render` (re-render Layer 2 Satori) tidak boleh memotong kredit.
5. **Webhook Idempotency:** Webhook Midtrans/Tripay wajib memverifikasi signature dan mengecek `externalOrderId` agar tidak pernah menggandakan kredit.

## 4. Konvensi Keamanan & Kualitas
- Cek kepemilikan resource (`userId === session.user.id`) di setiap endpoint (anti-IDOR).
- Sanitasi seluruh URL gambar yang masuk ke Satori agar hanya berasal dari domain Cloudflare R2 milik Kreatim.
- Tampilkan rencana file yang akan dibuat/diubah sebelum mulai menulis kode pada setiap Sprint.
- Jalankan `npm run lint` dan unit test (`vitest` / `jest`) setelah menyelesaikan fitur inti.

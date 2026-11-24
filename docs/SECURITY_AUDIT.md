# Security Audit — Kreatim MVP Phase 1

Status per Sprint 4. Semua poin di bawah dicek lewat kode + tes (`npm test`, 49 tes).

## Sudah diterapkan
| Area | Implementasi |
|---|---|
| Credit ledger atomik | `creditService`: `$transaction` + `SELECT ... FOR UPDATE` pada baris User; sub dulu baru topup; ledger append-only; refund idempoten per `referenceId` (`REFUND_FAILED_JOB`). Tes paralel memastikan saldo tak pernah minus. |
| Live Edit gratis | `/api/agents/design/render` tidak memanggil creditService (tes memverifikasi saldo tetap). |
| Webhook idempoten | Signature diverifikasi (Midtrans SHA512, Tripay HMAC-SHA256 raw body) sebelum apa pun; transaksi dikunci per `externalOrderId`; status final tidak diproses ulang; nominal harus cocok (`amount_mismatch` ditolak). Body dibatasi 64 KB. |
| Anti-IDOR | Semua query brand/job/transaksi difilter `userId` dari session; resource milik orang lain → 404. |
| Validasi input | Zod di semua API route (brand, agents, checkout, upload, render). |
| Anti-SSRF Satori | Semua URL gambar harus `R2_PUBLIC_BASE_URL` + folder milik user (`isKreatimR2Url`); gambar di-fetch server lalu di-embed sebagai data URI, dengan batas ukuran & tipe. |
| Upload | Presigned PUT R2 dengan Content-Type & Content-Length ditandatangani, whitelist MIME, max size; key acak di folder user. |
| Auth | Auth.js v5 JWT, password bcrypt, middleware melindungi `/dashboard` dan API. |
| Rate limit | Login 10/10 mnt per email, register 5/jam per IP, endpoint AI per user. |
| Header keamanan | `X-Frame-Options DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS; `poweredByHeader` mati. |
| Cron | `/api/cron/reset-credits` butuh `CRON_SECRET` (perbandingan constant-time, min. 16 karakter). |
| Mode mock | AI mock & pembayaran mock diblokir di production; `/dev-uploads` 404 di production. |

## Batasan yang diketahui (rekomendasi lanjutan)
1. **Rate limit in-memory**: hanya akurat untuk satu instance. Jika scale ke >1 container, pindahkan ke Redis/Upstash.
2. **Langganan tidak auto-recurring**: perpanjangan = checkout ulang tiap bulan. Recurring/auto-debit belum ada.
3. **Belum ada CSP ketat**: tambahkan Content-Security-Policy setelah domain & aset final.
4. **Belum ada verifikasi email / reset password** untuk akun email+password.
5. **Integrasi nyata belum diuji di environment ini**: Claude, Gemini, Fal, R2, Midtrans, Tripay perlu diuji dengan key sandbox sebelum live.

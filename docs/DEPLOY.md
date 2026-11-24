# Deploy Kreatim ke VPS (Docker)

Panduan ini untuk satu VPS (Ubuntu 22.04/24.04, min. 2 vCPU / 2 GB RAM) dengan Docker Compose, sesuai PRD §4.

## 1. Persiapan server
```bash
curl -fsSL https://get.docker.com | sh
git clone https://github.com/digikreatifid-lab/kreatim.git && cd kreatim
cp .env.example .env
```

## 2. Isi `.env`
| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://kreatim.id` (dipakai untuk redirect pembayaran & CORS) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID/SECRET` | Opsional. Redirect URI: `https://kreatim.id/api/auth/callback/google` |
| `POSTGRES_PASSWORD` | Password DB untuk container `db` (DATABASE_URL di-set otomatis oleh compose) |
| `AI_TEXT_PROVIDER` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | Agent Penulis |
| `AI_IMAGE_PROVIDER` / `FAL_KEY` / `GEMINI_API_KEY` | Background Agent Desain |
| `R2_*` | Cloudflare R2. **Wajib** di production (penyimpanan lokal mati di production) |
| `PAYMENT_PROVIDER` | `midtrans` atau `tripay` (+ key masing-masing, `*_IS_PRODUCTION=true` saat live) |
| `CRON_SECRET` | `openssl rand -hex 32` (min. 16 karakter) |

Mode `mock` (AI & pembayaran) otomatis diblokir di production.

## 3. Build, migrasi, jalankan
```bash
docker compose build
docker compose run --rm migrate     # prisma migrate deploy
docker compose up -d app
curl -s http://127.0.0.1:3000/api/health   # {"ok":true,...}
```
Update versi: `git pull && docker compose build && docker compose run --rm migrate && docker compose up -d app`.

## 4. HTTPS (Caddy)
App hanya listen di `127.0.0.1:3000`. Contoh `/etc/caddy/Caddyfile`:
```
kreatim.id {
  encode gzip
  reverse_proxy 127.0.0.1:3000
}
```
Caddy mengurus sertifikat Let's Encrypt otomatis. (Nginx juga bisa: `proxy_pass http://127.0.0.1:3000;` + certbot.)

## 5. Cron reset kredit bulanan
Tambahkan ke `crontab -e` di VPS (jalan tiap jam, aman diulang):
```
0 * * * * curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" https://kreatim.id/api/cron/reset-credits > /dev/null
```
(ganti `$CRON_SECRET` dengan nilainya, atau pakai header `Authorization: Bearer <secret>`).

## 6. Cloudflare R2
1. Buat bucket `kreatim-assets`, hubungkan custom domain `assets.kreatim.id` (public).
2. Buat API token R2 (Object Read & Write) → isi `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
3. CORS bucket:
```json
[{"AllowedOrigins":["https://kreatim.id"],"AllowedMethods":["PUT","GET"],"AllowedHeaders":["content-type","content-length"],"MaxAgeSeconds":3600}]
```

## 7. Payment gateway
- **Midtrans**: Dashboard → Settings → Payment → Notification URL = `https://kreatim.id/api/webhooks/payment`. Finish redirect = `https://kreatim.id/dashboard/billing`.
- **Tripay**: Merchant → Callback URL = `https://kreatim.id/api/webhooks/payment`.
- Uji dulu dengan sandbox (`*_IS_PRODUCTION=false`), lalu lakukan 1 transaksi kecil di production.

## 8. Backup database
```
0 3 * * * docker compose -f /root/kreatim/docker-compose.yml exec -T db pg_dump -U kreatim kreatim | gzip > /root/backup/kreatim-$(date +\%F).sql.gz
```

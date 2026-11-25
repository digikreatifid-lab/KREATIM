import Link from "next/link";
import { Brain, Check, Palette, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCosmos } from "@/components/cosmos/hero-cosmos";
import { Starfield } from "@/components/cosmos/starfield";
import { CREDIT_COST, FREE_TRIAL_CREDITS, SUBSCRIPTION_PLANS } from "@/lib/plans";
import { formatIdr } from "@/lib/utils";

const FEATURES = [
  {
    icon: Brain,
    tone: "bg-aurora/12 text-aurora",
    title: "Brand Brain mengingat semua tentang brand kamu",
    body: "Warna, logo, font, produk, target pembeli, sampai kata yang wajib dan dilarang. Isi sekali, dipakai oleh semua agent.",
    visual: (
      <div className="grid gap-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <span className="grid size-11 place-items-center rounded-xl bg-[#3b2a20] text-sm font-bold text-white">KS</span>
          <div>
            <p className="font-bold">Kopi Senja</p>
            <p className="text-sm text-muted-foreground">Kuliner, pekerja muda 22–35 tahun</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {["#3B2A20", "#D98E32"].map((c) => (
            <span key={c} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
              <span className="size-3 rounded-full" style={{ background: c }} />
              {c}
            </span>
          ))}
          <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">Nada santai</span>
          <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">Wajib: gula aren</span>
        </div>
      </div>
    ),
  },
  {
    icon: PenLine,
    tone: "bg-sun/25 text-[#9a6500]",
    title: "Agent Penulis menulis caption yang terdengar seperti kamu",
    body: `Caption IG dan TikTok, iklan Meta dan Google, skrip video 30 detik, deskripsi marketplace. Tiga variasi per permintaan, ${CREDIT_COST.COPYWRITER} kredit.`,
    visual: (
      <div className="grid gap-3">
        {["Senin berat? Mulai pelan-pelan bareng es kopi susu gula aren.", "Manisnya pas, kafeinnya nendang. Cobain sebelum kehabisan."].map((t, i) => (
          <div key={t} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Variasi {i + 1}</p>
            <p className="leading-relaxed">{t}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Palette,
    tone: "bg-comet/20 text-[#0b7f73]",
    title: "Agent Desain membuat feed dan story yang rapi",
    body: `AI membuat latar foto, lalu teks, harga, dan logo ditempel presisi sesuai Brand Brain. ${CREDIT_COST.DESIGN_HYBRID} kredit per desain, edit teks setelahnya gratis.`,
    visual: (
      <div className="flex items-end gap-4">
        <div className="relative aspect-[4/5] w-40 overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#e9c49a,#8a5a3b_62%,#3b2a20)] p-3 text-white shadow-lg">
          <p className="absolute inset-x-3 bottom-3 text-lg font-extrabold leading-none tracking-tight">Diskon 20% akhir pekan</p>
        </div>
        <div className="relative aspect-[9/16] w-24 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#bfe9ff,#3f7fd1)] p-2 text-white shadow-lg">
          <p className="absolute inset-x-2 bottom-3 text-sm font-extrabold leading-none tracking-tight">Menu baru</p>
        </div>
      </div>
    ),
  },
];

const STEPS = [
  { title: "Kenalkan brand kamu", body: "Upload logo, pilih warna dan font, tambahkan produk. Sekitar tiga menit." },
  { title: "Tulis apa yang mau dipromosikan", body: "Caption dan desain jadi dalam hitungan detik, sudah memakai gaya brand kamu." },
  { title: "Rapikan, unduh, posting", body: "Edit teks desain tanpa kredit, salin caption, lalu unggah ke Instagram atau TikTok." },
];

export default function Home() {
  return (
    <div className="overflow-x-clip">
      <header className="sticky top-3 z-50 mx-auto mt-3 max-w-6xl px-3">
        <div className="flex items-center justify-between rounded-full border border-border/70 bg-white/85 py-2 pl-5 pr-2 shadow-[0_10px_30px_-18px_rgb(13_18_48/0.35)] backdrop-blur">
          <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg bg-night text-sun">✦</span>
            kreatim
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#fitur" className="hover:text-ink">Fitur</a>
            <a href="#cara" className="hover:text-ink">Cara kerja</a>
            <a href="#harga" className="hover:text-ink">Harga</a>
          </nav>
          <div className="flex items-center gap-1">
            <Button variant="ghost" asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Coba gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-16 text-center sm:pt-24">
        <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-sm font-medium">
          <span className="size-1.5 rounded-full bg-comet" /> {FREE_TRIAL_CREDITS} kredit gratis saat daftar
        </p>
        <h1 className="mx-auto max-w-4xl text-[clamp(2.5rem,6.2vw,4.75rem)] font-extrabold leading-[1.02]">
          Tim kreatif AI yang paham brand kamu
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Caption, iklan, dan desain feed atau story yang selalu konsisten dengan warna, logo, dan gaya bahasa brand. Mulai
          Rp 99.000 per bulan.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/register">Mulai gratis</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a href="#fitur">Lihat cara kerjanya</a>
          </Button>
        </div>
        <div className="mt-14 sm:mt-16">
          <HeroCosmos />
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
        <h2 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">Satu brief, tiga spesialis bekerja bersama.</h2>
        <div className="mt-14 grid gap-16">
          {FEATURES.map((f, i) => (
            <article key={f.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <div className={i % 2 ? "md:order-2" : undefined}>
                <span className={`grid size-12 place-items-center rounded-2xl ${f.tone}`}>
                  <f.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-3xl font-extrabold leading-tight">{f.title}</h3>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
              <div className="rounded-[28px] bg-secondary p-6 sm:p-10">{f.visual}</div>
            </article>
          ))}
        </div>
      </section>

      <section id="cara" className="scroll-mt-24 px-4">
        <div className="cosmos relative mx-auto max-w-6xl overflow-hidden rounded-[36px] px-6 py-16 sm:px-14 sm:py-20">
          <Starfield density={0.7} />
          <h2 className="relative max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">Dari ide ke posting dalam tiga langkah.</h2>
          <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="glass rounded-3xl p-6">
                <span className="text-aurora-gradient text-5xl font-extrabold">{i + 1}</span>
                <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-white/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="harga" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
        <h2 className="text-4xl font-extrabold sm:text-5xl">Harga yang masuk akal untuk UMKM.</h2>
        <p className="mt-3 text-lg text-muted-foreground">Bayar lewat QRIS, virtual account, atau e-wallet. Kredit masuk otomatis.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {SUBSCRIPTION_PLANS.map((p) => (
            <div
              key={p.id}
              className={
                p.highlight
                  ? "cosmos relative overflow-hidden rounded-[28px] p-8 shadow-[0_30px_60px_-30px_var(--aurora)]"
                  : "rounded-[28px] border border-border p-8"
              }
            >
              {p.highlight && <Starfield density={0.5} meteors={false} />}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  {p.highlight && <span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold text-ink">Paling laris</span>}
                </div>
                <p className="mt-5 text-4xl font-extrabold tracking-tight">
                  {formatIdr(p.priceIdr)}
                  <span className="text-base font-medium opacity-60">/bulan</span>
                </p>
                <ul className={`mt-6 grid gap-2.5 text-sm ${p.highlight ? "text-white/80" : "text-muted-foreground"}`}>
                  <li className="flex gap-2"><Check className="size-4 shrink-0 text-comet" />{p.credits.toLocaleString("id-ID")} kredit setiap 30 hari</li>
                  <li className="flex gap-2"><Check className="size-4 shrink-0 text-comet" />Kira-kira {Math.floor(p.credits / CREDIT_COST.DESIGN_HYBRID)} desain atau {p.credits} set caption</li>
                  <li className="flex gap-2"><Check className="size-4 shrink-0 text-comet" />Edit teks desain gratis</li>
                </ul>
                <Button className="mt-8 w-full" variant={p.highlight ? "brand" : "outline"} asChild>
                  <Link href="/register">Pilih {p.name}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="cosmos relative mx-auto max-w-6xl overflow-hidden rounded-[36px] px-6 py-20 text-center sm:py-24">
          <Starfield density={1.2} />
          <h2 className="relative mx-auto max-w-2xl text-4xl font-extrabold leading-tight sm:text-6xl">Coba gratis hari ini.</h2>
          <p className="relative mx-auto mt-4 max-w-md text-lg text-white/70">
            {FREE_TRIAL_CREDITS} kredit cukup untuk beberapa caption dan dua desain. Tanpa kartu kredit.
          </p>
          <Button size="lg" className="relative mt-8 bg-white text-ink hover:bg-white/90" asChild>
            <Link href="/register">Buat akun gratis</Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pb-10 text-sm text-muted-foreground">
        <span className="font-extrabold text-ink">kreatim</span>
        <span>Dibuat untuk UMKM Indonesia.</span>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clay, ClayBuddy, type BuddyKind } from "@/components/clay/clay";
import { HeroStage } from "@/components/marketing/hero-stage";
import { CREDIT_COST, FREE_TRIAL_CREDITS, SUBSCRIPTION_PLANS } from "@/lib/plans";
import { formatIdr } from "@/lib/utils";

const CREW: { kind: BuddyKind; name: string; role: string; body: string; sample: React.ReactNode; tint: string }[] = [
  {
    kind: "brain",
    name: "Brand Brain",
    role: "Ingatan brand kamu",
    body: "Isi sekali: warna, logo, produk, target pembeli, dan kata yang wajib atau dilarang. Semua agent membacanya sebelum bekerja.",
    tint: "bg-lilac/45",
    sample: (
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5"><span className="size-3 rounded-full bg-[#3b2a20]" />#3B2A20</span>
        <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5"><span className="size-3 rounded-full bg-[#d98e32]" />#D98E32</span>
        <span className="rounded-full bg-white px-3 py-1.5">Nada: santai</span>
        <span className="rounded-full bg-white px-3 py-1.5">Wajib: gula aren</span>
      </div>
    ),
  },
  {
    kind: "penulis",
    name: "Agent Penulis",
    role: `Caption, iklan, skrip video, ${CREDIT_COST.COPYWRITER} kredit`,
    body: "Tulis brief singkat, pilih AIDA, PAS, atau Hook-Story-Offer. Kamu dapat tiga variasi siap salin dengan hashtag.",
    tint: "bg-butter/55",
    sample: (
      <p className="rounded-2xl bg-white p-4 text-sm leading-relaxed">
        &ldquo;Senin berat? Mulai pelan-pelan bareng es kopi susu gula aren. Manisnya pas, kafeinnya nendang.&rdquo;
      </p>
    ),
  },
  {
    kind: "desainer",
    name: "Agent Desain",
    role: `Feed 4:5 dan story 9:16, ${CREDIT_COST.DESIGN_HYBRID} kredit`,
    body: "AI membuat latar foto, lalu teks, harga, dan logo kamu ditempel presisi. Ganti tulisan sepuasnya tanpa potong kredit.",
    tint: "bg-guava/30",
    sample: (
      <div className="flex gap-3">
        <div className="aspect-[4/5] w-24 rounded-2xl bg-[linear-gradient(160deg,#e9c49a,#8a5a3b_62%,#3b2a20)] p-2 font-display text-[11px] font-extrabold leading-none text-white">
          <span className="mt-auto block pt-16">Diskon 20%</span>
        </div>
        <div className="aspect-[9/16] w-[68px] rounded-2xl bg-[linear-gradient(180deg,#b8f2d8,#5fb894)] p-2 font-display text-[11px] font-extrabold leading-none text-[#123]">
          <span className="block pt-20">Menu baru</span>
        </div>
      </div>
    ),
  },
];

const STEPS = [
  { title: "Kenalkan brand kamu", body: "Upload logo, pilih warna dan font, tambahkan produk. Sekitar tiga menit." },
  { title: "Minta ke agent", body: "Tulis apa yang mau dipromosikan. Caption dan desain jadi dalam hitungan detik." },
  { title: "Rapikan, unduh, posting", body: "Edit teks desain gratis, salin caption, lalu unggah ke Instagram atau TikTok." },
];

export default function Home() {
  return (
    <div className="overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
          <Clay color="violet" size={22} />
          kreatim
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Masuk</Link>
          </Button>
          <Button variant="brand" asChild>
            <Link href="/register">Coba gratis</Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold">
            <Clay color="mint" size={14} /> {FREE_TRIAL_CREDITS} kredit gratis saat daftar, tanpa kartu kredit
          </p>
          <h1 className="text-[clamp(2.6rem,6.4vw,5rem)] font-extrabold leading-[0.95]">
            Punya tim kreatif sendiri, mulai Rp 99 ribu sebulan.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Penulis dan desainer AI yang hafal warna, logo, dan gaya bahasa brand kamu. Caption jadi dalam detik, desain
            feed dan story siap unggah.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="brand" asChild>
              <Link href="/register">Buat konten pertama</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#tim">Kenalan dengan timnya</Link>
            </Button>
          </div>
        </div>
        <HeroStage />
      </section>

      <section id="tim" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-16">
        <h2 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">Tiga anggota tim, satu selera brand.</h2>
        <div className="mt-10 grid gap-5">
          {CREW.map((m) => (
            <article key={m.kind} className={`grid items-center gap-6 rounded-[36px] p-6 sm:p-8 md:grid-cols-[auto_1fr_1fr] ${m.tint}`}>
              <ClayBuddy kind={m.kind} size={88} />
              <div>
                <h3 className="text-2xl font-extrabold">{m.name}</h3>
                <p className="text-sm font-semibold text-accent-foreground">{m.role}</p>
                <p className="mt-3 max-w-md leading-relaxed text-ink/80">{m.body}</p>
              </div>
              <div>{m.sample}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-4xl font-extrabold sm:text-5xl">Dari ide ke posting dalam tiga langkah.</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="font-display text-7xl font-extrabold leading-none text-lilac">{i + 1}</span>
              <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="harga" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-4xl font-extrabold sm:text-5xl">Harga yang masuk akal untuk UMKM.</h2>
        <p className="mt-3 text-muted-foreground">Bayar lewat QRIS, virtual account, atau e-wallet. Kredit masuk otomatis.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {SUBSCRIPTION_PLANS.map((p) => (
            <div
              key={p.id}
              className={
                p.highlight
                  ? "relative rounded-[32px] bg-ink p-8 text-white shadow-[0_30px_60px_-30px_var(--violet)]"
                  : "rounded-[32px] border border-border bg-white p-8"
              }
            >
              {p.highlight && <Clay color="butter" size={40} className="float-mid absolute -top-4 right-8" />}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="mt-4 font-display text-4xl font-extrabold">
                {formatIdr(p.priceIdr)}
                <span className="text-base font-medium opacity-70">/bulan</span>
              </p>
              <p className={p.highlight ? "mt-2 text-white/75" : "mt-2 text-muted-foreground"}>
                {p.credits.toLocaleString("id-ID")} kredit, kira-kira {Math.floor(p.credits / CREDIT_COST.DESIGN_HYBRID)} desain
              </p>
              <Button className="mt-6 w-full" variant={p.highlight ? "brand" : "outline"} asChild>
                <Link href="/register">Pilih {p.name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="relative overflow-hidden rounded-[40px] bg-violet px-8 py-14 text-white sm:px-14">
          <Clay color="guava" size={140} className="absolute -right-10 -top-12 opacity-90" />
          <Clay shape="ring" color="mint" size={90} className="absolute -bottom-8 right-40" />
          <h2 className="relative max-w-xl text-4xl font-extrabold sm:text-5xl">Coba dulu, gratis {FREE_TRIAL_CREDITS} kredit.</h2>
          <p className="relative mt-3 max-w-lg text-white/80">Cukup untuk beberapa caption dan dua desain. Tidak perlu kartu kredit.</p>
          <Button size="lg" className="relative mt-8 bg-white text-ink hover:bg-white/90" asChild>
            <Link href="/register">Daftar sekarang</Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground">
        <span className="font-display text-lg font-extrabold text-ink">kreatim</span>
        <span>Dibuat untuk UMKM Indonesia.</span>
      </footer>
    </div>
  );
}

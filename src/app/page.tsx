import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <span className="text-lg font-semibold tracking-tight">
          kreatim<span className="text-brand">.</span>
        </span>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Coba Gratis</Link>
          </Button>
        </nav>
      </header>
      <section className="flex flex-1 flex-col items-start justify-center gap-6 py-24">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">15 kredit gratis saat daftar</span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Tim kreatif AI untuk brand yang baru tumbuh.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Tulis caption, ad copy, dan buat desain feed 4:5 atau story 9:16 yang selalu konsisten dengan warna, logo,
          dan gaya bahasa brand kamu. Mulai Rp 99.000/bulan.
        </p>
        <div className="flex gap-3">
          <Button size="lg" variant="brand" asChild>
            <Link href="/register">Mulai Sekarang</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Saya sudah punya akun</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

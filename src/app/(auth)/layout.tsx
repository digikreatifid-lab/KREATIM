import Link from "next/link";
import { Starfield } from "@/components/cosmos/starfield";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <section className="flex flex-col px-6 py-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-night text-sun">✦</span>
          kreatim
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</div>
      </section>
      <aside className="p-3 max-lg:hidden">
        <div className="cosmos relative flex h-full flex-col justify-end overflow-hidden rounded-[32px] p-12">
          <Starfield density={1.3} />
          <div className="relative max-w-md">
            <p className="text-4xl font-extrabold leading-tight tracking-tight">Konten seminggu, jadi dalam satu sore.</p>
            <p className="mt-4 text-white/70">Caption dan desain yang selalu memakai warna, logo, dan gaya bahasa brand kamu.</p>
          </div>
        </div>
      </aside>
    </main>
  );
}

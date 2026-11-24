import Link from "next/link";
import { Clay, ClayBuddy } from "@/components/clay/clay";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col px-6 py-8">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
          <Clay color="violet" size={22} />
          kreatim
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</div>
      </section>
      <aside className="stage relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative size-[420px]">
            <ClayBuddy kind="brain" size={150} className="float-slow absolute left-[34%] top-[30%]" />
            <ClayBuddy kind="penulis" size={96} className="float-mid absolute left-[2%] top-[8%]" />
            <ClayBuddy kind="desainer" size={110} className="float-mid absolute bottom-[4%] right-[2%]" />
            <Clay shape="ring" color="mint" size={70} className="float-slow absolute bottom-[10%] left-[6%]" />
            <Clay color="butter" size={40} className="absolute right-[14%] top-[6%]" />
          </div>
        </div>
        <p className="absolute inset-x-12 bottom-12 max-w-md font-display text-3xl font-extrabold leading-tight">
          Timmu sudah siap. Tinggal kasih tahu mau promosi apa.
        </p>
      </aside>
    </main>
  );
}

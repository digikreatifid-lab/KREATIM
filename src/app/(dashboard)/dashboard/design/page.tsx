import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { DesignStudio, type ExistingDesign } from "@/components/agents/design-studio";
import { NoBrandNotice } from "@/components/agents/no-brand";
import { toBrandOptions } from "@/lib/brand-options-server";
import { listBrands } from "@/services/brandService";
import type { DesignState } from "@/services/designService";
import { getOwnedJob, JobNotFoundError, listRecentJobs } from "@/services/jobService";

export const metadata: Metadata = { title: "Agent Desain" };

type Search = { job?: string; brandId?: string; productId?: string; headline?: string; subheadline?: string; cta?: string };

export default async function DesignPage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await auth();
  const userId = session!.user.id;
  const sp = await searchParams;
  const [brands, recent] = await Promise.all([listBrands(userId), listRecentJobs(userId, "DESIGN_HYBRID", 12)]);

  let existing: ExistingDesign | null = null;
  if (sp.job) {
    const job = await getOwnedJob(userId, sp.job, "DESIGN_HYBRID").catch((e) => {
      if (e instanceof JobNotFoundError) return null;
      throw e;
    });
    if (job?.status === "COMPLETED" && job.outputPayload) {
      const s = job.outputPayload as unknown as DesignState;
      existing = { jobId: job.id, brandId: job.brandId, imageUrl: s.imageUrl, ratio: s.ratio, template: s.template, logoPosition: s.logoPosition, content: s.content };
    }
  }

  const clip = (v: string | undefined, n: number) => (v ? v.slice(0, n) : undefined);

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Agent Desain Grafis</h1>
        <p className="text-muted-foreground">Latar visual dari AI, tipografi dan logo presisi dari Brand Brain. Edit teks sepuasnya tanpa kredit.</p>
      </div>
      {brands.length === 0 ? (
        <NoBrandNotice />
      ) : (
        <DesignStudio
          key={existing?.jobId ?? "new"}
          brands={toBrandOptions(brands)}
          existing={existing}
          initial={{
            brandId: sp.brandId,
            productId: sp.productId,
            headline: clip(sp.headline, 80),
            subheadline: clip(sp.subheadline, 140),
            cta: clip(sp.cta, 28),
          }}
        />
      )}
      {recent.length > 0 && (
        <div className="grid gap-3">
          <h2 className="font-semibold">Desain terbaru</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {recent.map((job) => {
              const s = job.outputPayload as unknown as DesignState | null;
              return (
                <Link key={job.id} href={`/dashboard/design?job=${job.id}`} className="overflow-hidden rounded-2xl border bg-secondary/50 hover:ring-2 hover:ring-brand">
                  {s?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imageUrl} alt={s.content?.headline ?? "Desain"} className={s.ratio === "9:16" ? "aspect-[9/16] w-full object-cover" : "aspect-[4/5] w-full object-cover"} />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

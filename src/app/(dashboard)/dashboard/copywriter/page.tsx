import type { Metadata } from "next";
import { Star } from "lucide-react";
import { auth } from "@/auth";
import { CopywriterStudio } from "@/components/agents/copywriter-studio";
import { NoBrandNotice } from "@/components/agents/no-brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CopyOutput } from "@/lib/ai/copy-schema";
import { toBrandOptions } from "@/lib/brand-options-server";
import { listBrands } from "@/services/brandService";
import { listRecentJobs } from "@/services/jobService";

export const metadata: Metadata = { title: "Agent Penulis" };

export default async function CopywriterPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [brands, recent] = await Promise.all([listBrands(userId), listRecentJobs(userId, "COPYWRITER", 8)]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agent Penulis</h1>
        <p className="text-muted-foreground">Caption, ad copy, skrip video, dan deskripsi marketplace sesuai gaya brand kamu.</p>
      </div>
      {brands.length === 0 ? <NoBrandNotice /> : <CopywriterStudio brands={toBrandOptions(brands)} />}
      {recent.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Riwayat terbaru</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {recent.map((job) => {
              const first = (job.outputPayload as unknown as CopyOutput | null)?.variations?.[0];
              return (
                <div key={job.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                  {job.isFavorite && <Star className="mt-0.5 size-4 shrink-0 fill-amber-400 text-amber-400" />}
                  <div className="grid gap-1">
                    <span className="font-medium">{first?.headline ?? "(tanpa judul)"}</span>
                    <span className="line-clamp-2 text-muted-foreground">{first?.body}</span>
                    <span className="text-xs text-muted-foreground">{job.brand.name} · {job.createdAt.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

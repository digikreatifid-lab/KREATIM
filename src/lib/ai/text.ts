import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { AI_TIMEOUT_MS, AiProviderError } from "./errors";
import { copyOutputSchema, type CopyOutput } from "./copy-schema";

/**
 * Text adapter for Agent Penulis (PRD §3.2). Provider is picked by
 * AI_TEXT_PROVIDER: "anthropic" (Claude Haiku), "gemini" (Gemini 2.5 Flash),
 * or "mock" for local development without API keys.
 */

export type TextProvider = "anthropic" | "gemini" | "mock";

export function textProvider(): TextProvider {
  const explicit = process.env.AI_TEXT_PROVIDER as TextProvider | undefined;
  if (explicit) return explicit;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "mock";
}

/** Never charge real users for placeholder output: mock is blocked in production unless explicitly allowed. */
export function assertMockAllowed() {
  if (process.env.NODE_ENV === "production" && process.env.AI_ALLOW_MOCK !== "1") {
    throw new AiProviderError("Provider AI belum dikonfigurasi di server.");
  }
}

export type CopyPrompt = { system: string; user: string };

const CLAUDE_MODEL = process.env.ANTHROPIC_COPY_MODEL ?? "claude-haiku-5-5";
const GEMINI_MODEL = process.env.GEMINI_COPY_MODEL ?? "gemini-2.5-flash";

function finalize(raw: unknown): CopyOutput {
  const parsed = copyOutputSchema.safeParse(raw);
  if (!parsed.success || parsed.data.variations.length === 0) {
    throw new AiProviderError("Output AI tidak sesuai format.");
  }
  return { variations: parsed.data.variations.slice(0, 3) };
}

async function viaAnthropic(prompt: CopyPrompt): Promise<CopyOutput> {
  const client = new Anthropic({ timeout: AI_TIMEOUT_MS, maxRetries: 1 });
  try {
    const response = await client.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(copyOutputSchema) },
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });
    if (response.stop_reason === "refusal") throw new AiProviderError("Permintaan ditolak oleh model AI.");
    if (!response.parsed_output) throw new AiProviderError("Output AI kosong.");
    return finalize(response.parsed_output);
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    throw new AiProviderError("Gagal memanggil Claude.", { cause: error });
  }
}

async function viaGemini(prompt: CopyPrompt): Promise<CopyOutput> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiProviderError("GEMINI_API_KEY belum di-set.");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [{ role: "user", parts: [{ text: prompt.user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(copyOutputSchema),
          temperature: 0.9,
        },
      }),
    },
  ).catch((error) => {
    throw new AiProviderError("Gagal menghubungi Gemini.", { cause: error });
  });
  if (!res.ok) throw new AiProviderError(`Gemini error ${res.status}.`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  try {
    return finalize(JSON.parse(text));
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    throw new AiProviderError("Output Gemini bukan JSON yang valid.", { cause: error });
  }
}

function viaMock(prompt: CopyPrompt): CopyOutput {
  assertMockAllowed();
  if (prompt.user.includes("__FAIL__")) throw new AiProviderError("Mock provider gagal (simulasi).");
  const angles = ["Manfaat", "Cerita", "Promo"];
  return {
    variations: angles.map((angle, i) => ({
      headline: `[Contoh ${i + 1}] Sudut ${angle}`,
      subheadline: "Ini output contoh karena AI_TEXT_PROVIDER=mock.",
      body: "Set ANTHROPIC_API_KEY atau GEMINI_API_KEY untuk hasil copy sungguhan dari AI.",
      cta: "Pesan sekarang",
      hashtags: ["#kreatim", "#umkm"],
    })),
  };
}

export async function generateCopy(prompt: CopyPrompt): Promise<CopyOutput> {
  switch (textProvider()) {
    case "anthropic":
      return viaAnthropic(prompt);
    case "gemini":
      return viaGemini(prompt);
    default:
      return viaMock(prompt);
  }
}

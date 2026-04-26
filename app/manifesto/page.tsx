import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import ManifestoView from "./ManifestoView";

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "Caelinus is not a brand, it is a frequency. Read the manifesto of the cosmic consciousness — wear your frequency, dance with the universe.",
  openGraph: {
    title: "Caelinus Manifesto",
    description: "A calling for those who belong to the sky.",
    type: "article",
  },
};

async function readManifesto(file: string): Promise<string> {
  const fullPath = path.join(process.cwd(), "app", "manifesto", file);
  try {
    return await fs.readFile(fullPath, "utf8");
  } catch {
    return "";
  }
}

export default async function ManifestoPage() {
  const [tr, en] = await Promise.all([
    readManifesto("manifesto_tr.txt"),
    readManifesto("manifesto_en.txt"),
  ]);

  return <ManifestoView tr={tr} en={en} />;
}

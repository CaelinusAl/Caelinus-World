import type { Metadata } from "next";

import TestFlow from "./TestFlow";
import "./test.css";

export const metadata: Metadata = {
  title: "Caelinus · Bilinç Testi",
  description: "Bu evrende nerede yaşıyorsun? 12 soru, bir bilinç kartı.",
};

export default function TestPage() {
  return (
    <main className="ct-root">
      <TestFlow />
    </main>
  );
}

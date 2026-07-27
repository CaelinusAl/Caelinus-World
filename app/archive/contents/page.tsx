import CodexContents from "@/components/archive/book/CodexContents";
import { loadLivingBookPublicModel } from "@/lib/codex/archive-data";

export const dynamic = "force-static";

export default async function CodexContentsPage() {
  const book = await loadLivingBookPublicModel();
  return <CodexContents book={book} />;
}

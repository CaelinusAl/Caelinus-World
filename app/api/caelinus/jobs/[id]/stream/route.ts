/**
 * GET /api/caelinus/jobs/[id]/stream
 *
 * Server-Sent Events stream — job'un yaşam döngüsü boyunca progress /
 * matches / finalized / error / cancelled event'lerini canlı yayınlar.
 *
 * Event tipleri (SSE event name → data shape):
 *   • "progress"   → JobProgressEvent
 *   • "matches"    → JobMatchesEvent
 *   • "finalized"  → JobFinalizedEvent
 *   • "error"      → JobErrorEvent
 *   • "cancelled"  → JobCancelledEvent
 *
 * Stream terminal event (finalized / cancelled / error) geldiğinde
 * kapanır. Client `EventSource` objesini kapatabilir, kapatmasa da
 * server tarafı kapanır.
 *
 * Late subscriber pattern: subscribe() async iterator ilk olarak job'un
 * mevcut state'ini "as-progress" event'i olarak yayar — yani client geç
 * bağlansa bile "ne kaçırdın" özetini alır.
 */

import { NextRequest } from "next/server";

import { getJobStore, type JobEvent } from "@/lib/caelinus-ai/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * SSE-formatted message — `event:` ve `data:` satırları, `\n\n` ile
 * sonlandırılmış. Multi-line data güvenli — JSON.stringify single-line.
 */
function formatSSE(event: JobEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

/** Heartbeat — 15sn'de bir comment frame ile bağlantıyı canlı tut. */
function heartbeat(): string {
  return `: caelinus heartbeat ${Date.now()}\n\n`;
}

export async function GET(req: NextRequest, { params }: Ctx): Promise<Response> {
  const { id } = await params;
  const store = getJobStore();

  // Job yoksa 404 yerine SSE error event ile başla — client'ın
  // EventSource'unu boş yere açık tutmamak için terminal event yolla.
  const job = await store.get(id);
  if (!job) {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(
            formatSSE({
              type: "error",
              jobId: id,
              code: "JOB_NOT_FOUND",
              message: "Job bulunamadı veya süresi doldu.",
            }),
          ),
        );
        controller.close();
      },
    });
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // nginx buffering kapat
      },
    });
  }

  const abort = new AbortController();
  // Client connection kapanırsa subscribe'ı çöz
  req.signal.addEventListener("abort", () => abort.abort(), { once: true });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* stream zaten kapalı */
        }
      };

      // Heartbeat tickeri — keep-alive
      const heartbeatTimer = setInterval(() => enqueue(heartbeat()), 15000);

      try {
        for await (const event of store.subscribe(id, abort.signal)) {
          enqueue(formatSSE(event));
          if (
            event.type === "finalized" ||
            event.type === "cancelled" ||
            event.type === "error"
          ) {
            // Terminal — stream'i temiz kapat
            break;
          }
        }
      } catch (err) {
        console.error(
          `[caelinus-ai/sse] subscribe error for job ${id}:`,
          err,
        );
        enqueue(
          formatSSE({
            type: "error",
            jobId: id,
            code: "STREAM_ERROR",
            message: "Akış kesildi. Tekrar bağlan.",
          }),
        );
      } finally {
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

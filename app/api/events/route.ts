import { subscribe, unsubscribe } from "@/lib/pubsub";

export const dynamic = "force-dynamic";

export function GET() {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Client already disconnected
        }
      };
      subscribe(send);
      cleanup = () => unsubscribe(send);
      // Establish the connection
      controller.enqueue(encoder.encode(": connected\n\n"));
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

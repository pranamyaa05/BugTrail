import { bugTrailEvents } from "@/lib/events";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const onEvent = (eventData: any) => {
        const data = `data: ${JSON.stringify(eventData)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      bugTrailEvents.on("event", onEvent);

      request.signal.addEventListener("abort", () => {
        bugTrailEvents.off("event", onEvent);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

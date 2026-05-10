/**
 * Tiny NDJSON streaming helpers — one JSON object per line.
 *
 * Server: pass an async generator of objects, get a streaming Response.
 * Client: pass a fetch Response, get an async iterable of objects.
 */

export function ndjsonResponse<T>(
  source: AsyncIterable<T>,
  init?: ResponseInit,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const obj of source) {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              error: String((err as Error)?.message ?? err),
            }) + "\n",
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    ...init,
    headers: {
      "content-type": "application/x-ndjson",
      "cache-control": "no-store",
      ...init?.headers,
    },
  });
}

/**
 * Async channel — multiple producers push events; one consumer iterates.
 * Used to multiplex concurrent tasks into a single NDJSON stream.
 */
export function asyncChannel<T>() {
  const queue: T[] = [];
  let resolve: (() => void) | null = null;
  let closed = false;

  function wake() {
    if (resolve) {
      const r = resolve;
      resolve = null;
      r();
    }
  }

  return {
    push(value: T) {
      if (closed) return;
      queue.push(value);
      wake();
    },
    close() {
      closed = true;
      wake();
    },
    async *[Symbol.asyncIterator](): AsyncGenerator<T> {
      while (true) {
        if (queue.length) {
          yield queue.shift()!;
        } else if (closed) {
          return;
        } else {
          await new Promise<void>((r) => {
            resolve = r;
          });
        }
      }
    },
  };
}

export async function* readNdjson<T>(res: Response): AsyncGenerator<T> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (line) yield JSON.parse(line) as T;
    }
  }
  const tail = buf.trim();
  if (tail) yield JSON.parse(tail) as T;
}

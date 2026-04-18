/**
 * Build a JSON Response for App Router route handlers.
 * Using Web standard `Response` keeps `POST(): Promise<Response>` compatible
 * with Next.js 16.1+ route type checks (avoids `Promise<unknown>` inference).
 */
export function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function GET() {
  return Response.json(
    { service: "darb-rest", status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}

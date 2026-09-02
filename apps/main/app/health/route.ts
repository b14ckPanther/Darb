export function GET() {
  return Response.json(
    { service: "darb-main", status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}

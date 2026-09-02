export function GET() {
  return Response.json(
    { service: "darb-admin", status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}

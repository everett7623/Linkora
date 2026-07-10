export function redirectResponse(location: string, status: number): Response {
  return new Response(null, { status, headers: { Location: location } });
}

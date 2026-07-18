const JSON_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
};

function errorResponse(status, code, message) {
  return Response.json(
    {
      success: false,
      error: { code, message },
    },
    { status, headers: JSON_HEADERS }
  );
}

export function isDemoApiPath(pathname) {
  return pathname === '/health' || pathname === '/api' || pathname.startsWith('/api/');
}

export async function onRequest(context) {
  const { request } = context;
  const pathname = new URL(request.url).pathname;
  if (!isDemoApiPath(pathname)) {
    return errorResponse(404, 'NOT_FOUND', 'The requested Demo API route does not exist.');
  }

  const service = context.env?.DEMO_API;
  if (!service || typeof service.fetch !== 'function') {
    return errorResponse(503, 'DEMO_API_UNAVAILABLE', 'The Demo API service is unavailable.');
  }

  try {
    return await service.fetch(request);
  } catch {
    return errorResponse(502, 'DEMO_API_UPSTREAM_ERROR', 'The Demo API service did not respond.');
  }
}

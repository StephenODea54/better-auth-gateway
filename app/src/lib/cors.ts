export function corsHeaders(origin: string, methods: string) {
  return {
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": methods,
    "access-control-allow-origin": origin,
    "vary": "Origin",
  };
}

export function withCorsHeaders(response: Response, origin: string, methods: string) {
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(corsHeaders(origin, methods))) {
    headers.set(name, value);
  }

  return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
}

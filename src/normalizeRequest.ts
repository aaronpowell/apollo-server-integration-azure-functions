import type { HttpRequest } from '@azure/functions';
import type { Headers } from 'undici';
import { HeaderMap, HTTPGraphQLRequest } from '@apollo/server';

export async function normalizeRequest(
  req: HttpRequest,
): Promise<HTTPGraphQLRequest> {
  if (!req.method) {
    throw new Error('No method');
  }

  return {
    method: req.method,
    headers: normalizeHeaders(req.headers),
    search: new URL(req.url).search,
    body: await parseBody(req, req.headers.get('content-type')),
  };
}
async function parseBody(
  req: HttpRequest,
  contentType: string | null,
): Promise<unknown | string> {
  if (contentType === 'application/json') {
    return await req.json();
  }
  if (contentType === 'text/plain') {
    return await req.text();
  }
  return '';
}
function normalizeHeaders(headers: Headers): HeaderMap {
  const headerMap = new HeaderMap();
  for (const [key, value] of headers.entries()) {
    headerMap.set(key, value ?? '');
  }
  return headerMap;
}

import { handler as netlifyHandler, Event } from '../netlify/functions/api';

type VercelRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
  send: (body: string) => void;
};

export default async function api(request: VercelRequest, response: VercelResponse) {
  const authorization = request.headers.authorization;
  const event: Event = {
    httpMethod: request.method || 'GET',
    path: request.url || '/api',
    rawPath: request.url || '/api',
    headers: {
      authorization: Array.isArray(authorization) ? authorization[0] : authorization,
    },
    body: request.body === undefined ? null : typeof request.body === 'string' ? request.body : JSON.stringify(request.body),
  };

  const result = await netlifyHandler(event);
  response.status(result.statusCode);
  for (const [name, value] of Object.entries(result.headers)) response.setHeader(name, value);
  response.send(result.body);
}

export const config = {
  runtime: 'nodejs20.x',
};

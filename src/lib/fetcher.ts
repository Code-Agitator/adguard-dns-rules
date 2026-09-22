import https from 'https';
import http from 'http';
import tls from 'tls';
import { readFileSync } from 'fs';
import { URL } from 'url';
import { Socket } from 'net';

export async function fetch(url: string, retries: number = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await doFetch(url);
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`Retry ${attempt}/${retries} for ${url}`);
      await sleep(1000 * attempt);
    }
  }
  throw new Error('Fetch failed');
}

function getProxy(): string | null {
  return process.env.HTTP_PROXY || process.env.HTTPS_PROXY ||
    process.env.http_proxy || process.env.https_proxy || null;
}

function doFetch(url: string): Promise<string> {
  const proxy = getProxy();
  if (proxy) {
    console.log(`Using proxy: ${proxy}`);
    return fetchViaProxy(url, proxy);
  }
  return fetchDirect(url);
}

function fetchDirect(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function fetchViaProxy(targetUrl: string, proxyUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proxy = new URL(proxyUrl);
    const target = new URL(targetUrl);

    const req = http.request({
      host: proxy.hostname,
      port: parseInt(proxy.port) || 80,
      method: 'CONNECT',
      path: `${target.hostname}:${target.port || (target.protocol === 'https:' ? 443 : 80)}`,
      timeout: 60000
    });

    req.on('connect', (_res, socket: Socket | null) => {
      if (!socket) {
        reject(new Error('Proxy did not return a socket'));
        return;
      }

      // Read and discard CONNECT response
      socket.once('data', () => {
        // Now establish TLS over the tunnel
        const tlsSocket = tls.connect({
          socket,
          servername: target.hostname,
          rejectUnauthorized: true
        }, () => {
          const path = target.pathname + target.search || '/';
          const httpReq = [
            `GET ${path} HTTP/1.1`,
            `Host: ${target.hostname}`,
            'Connection: close',
            '', ''
          ].join('\r\n');

          tlsSocket.write(httpReq);
        });

        const chunks: Buffer[] = [];
        tlsSocket.on('data', (chunk: Buffer) => chunks.push(chunk));
        tlsSocket.on('end', () => resolve(Buffer.concat(chunks).toString()));
        tlsSocket.on('error', reject);
        tlsSocket.on('timeout', () => { tlsSocket.destroy(); reject(new Error('Timeout')); });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Proxy timeout')); });
    req.end();
  });
}

export function readLocal(path: string): string {
  return readFileSync(path, 'utf-8');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Server-only Firebase Cloud Messaging (HTTP v1) sender.
// Signs a service-account JWT with WebCrypto (Worker-compatible) — no Node SDK.

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
};

function b64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function readServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON não configurado");
  const sa = JSON.parse(raw) as ServiceAccount;
  if (!sa.client_email || !sa.private_key || !sa.project_id) {
    throw new Error("Service account do Firebase incompleto");
  }
  sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  return sa;
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claim}`),
  );
  const jwt = `${header}.${claim}.${b64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`Falha ao autenticar no Firebase (${res.status})`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Firebase não retornou token de acesso");
  return json.access_token;
}

export type PushResult = { sent: number; failed: number; invalidTokens: string[] };

export async function sendFcmToTokens(
  tokens: string[],
  title: string,
  body: string,
  link: string,
): Promise<PushResult> {
  if (tokens.length === 0) return { sent: 0, failed: 0, invalidTokens: [] };
  const sa = readServiceAccount();
  const accessToken = await getAccessToken(sa);
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  let sent = 0;
  let failed = 0;
  const invalidTokens: string[] = [];

  // Batches of 20 concurrent sends keep the Worker well under its subrequest budget.
  for (let i = 0; i < tokens.length; i += 20) {
    const slice = tokens.slice(i, i + 20);
    await Promise.all(
      slice.map(async (token) => {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              authorization: `Bearer ${accessToken}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token,
                notification: { title, body },
                data: { link },
                webpush: {
                  fcm_options: { link },
                  notification: { icon: "/favicon.ico" },
                },
                android: { priority: "HIGH", notification: { sound: "default" } },
              },
            }),
          });
          if (res.ok) {
            sent++;
          } else {
            failed++;
            if (res.status === 404 || res.status === 400) invalidTokens.push(token);
          }
        } catch {
          failed++;
        }
      }),
    );
  }

  return { sent, failed, invalidTokens };
}

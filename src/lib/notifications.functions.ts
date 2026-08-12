import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SignJWT, importPKCS8 } from "jose";

/**
 * Gera um token de acesso para a API do Firebase Cloud Messaging v1
 * utilizando as credenciais da conta de serviço.
 */
async function getFcmAccessToken(clientEmail: string, privateKey: string) {
  // A chave privada geralmente vem com \n literais no JSON, jose precisa da string formatada
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  const ecKey = await importPKCS8(formattedKey, "RS256");

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600; // 1 hora de validade

  const jwt = await new SignJWT({
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256" })
    .sign(ecKey);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get FCM access token: ${errorText}`);
  }

  const data = await res.json();
  return data.access_token;
}

export const sendPushNotification = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    title: z.string(),
    body: z.string(),
    tokens: z.array(z.string()).optional(),
    data: z.record(z.string()).optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const FIREBASE_PROJECT_ID = process.env['FIREBASE_PROJECT_ID'];
    const FIREBASE_CLIENT_EMAIL = process.env['FIREBASE_CLIENT_EMAIL'];
    const FIREBASE_PRIVATE_KEY = process.env['FIREBASE_PRIVATE_KEY'];

    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
      console.error("Firebase config missing in environment variables");
      return { success: false, error: "Firebase config missing" };
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      
      // Se não houver tokens específicos, busca todos os tokens ativos
      let targetTokens = data.tokens;
      if (!targetTokens || targetTokens.length === 0) {
        const { data: dbTokens, error } = await supabaseAdmin
          .from("device_tokens")
          .select("token");
        
        if (error) throw error;
        targetTokens = dbTokens?.map(t => t.token) || [];
      }

      if (targetTokens.length === 0) {
        return { success: true, message: "No device tokens found to send to." };
      }

      const accessToken = await getFcmAccessToken(FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY);
      const url = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

      const sendPromises = targetTokens.map(async (token) => {
        const message = {
          message: {
            token,
            notification: {
              title: data.title,
              body: data.body,
            },
            data: data.data,
          }
        };

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });

        return res.json();
      });

      const results = await Promise.all(sendPromises);
      
      // Registrar no histórico de notificações
      await supabaseAdmin.from("push_notifications").insert({
        title: data.title,
        body: data.body,
        status: "sent",
        payload: (data.data || {}) as any
      });

      return { success: true, results };
    } catch (error: any) {
      console.error("Error sending push notification:", error);
      return { success: false, error: error.message };
    }
  });
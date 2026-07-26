import { createFileRoute } from "@tanstack/react-router";

// Public Firebase Web config (client-safe values) served from server env,
// so the same values feed the app and the messaging service worker.
export const Route = createFileRoute("/api/public/firebase-config")({
  server: {
    handlers: {
      GET: async () => {
        const apiKey = process.env.FIREBASE_API_KEY ?? "";
        const projectId = process.env.FIREBASE_PROJECT_ID ?? "";
        const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID ?? "";
        const appId = process.env.FIREBASE_APP_ID ?? "";
        const vapidKey = process.env.FIREBASE_VAPID_KEY ?? "";

        return Response.json(
          {
            configured: Boolean(apiKey && projectId && messagingSenderId && appId && vapidKey),
            apiKey,
            projectId,
            messagingSenderId,
            appId,
            authDomain: projectId ? `${projectId}.firebaseapp.com` : "",
            storageBucket: projectId ? `${projectId}.appspot.com` : "",
            vapidKey,
          },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});

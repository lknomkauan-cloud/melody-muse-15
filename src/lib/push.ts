// Browser/native push helper for Solando (Firebase Cloud Messaging).
// Web: firebase-messaging-sw.js + getToken. Native (Capacitor/APK): FCM via plugin.

export type FirebaseWebConfig = {
  configured: boolean;
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
};

let cachedConfig: FirebaseWebConfig | null = null;

export async function fetchFirebaseConfig(): Promise<FirebaseWebConfig> {
  if (cachedConfig) return cachedConfig;
  const res = await fetch("/api/public/firebase-config");
  cachedConfig = (await res.json()) as FirebaseWebConfig;
  return cachedConfig;
}

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function pushSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (isNativeApp()) return true;
  return "serviceWorker" in navigator && "Notification" in window && "PushManager" in window;
}

async function getNativeToken(): Promise<string> {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") throw new Error("Permissão de notificação negada");
  return await new Promise<string>((resolve, reject) => {
    PushNotifications.addListener("registration", (t) => resolve(t.value));
    PushNotifications.addListener("registrationError", (e) =>
      reject(new Error(String(e.error ?? "Falha ao registrar no FCM"))),
    );
    PushNotifications.register();
    setTimeout(() => reject(new Error("Tempo esgotado ao registrar o aparelho")), 15000);
  });
}

async function getWebToken(config: FirebaseWebConfig): Promise<string> {
  if (!config.configured) throw new Error("Firebase ainda não está configurado no servidor");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permissão de notificação negada");

  const swUrl =
    "/firebase-messaging-sw.js?" +
    new URLSearchParams({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    }).toString();

  const registration = await navigator.serviceWorker.register(swUrl, { scope: "/" });
  await navigator.serviceWorker.ready;

  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });

  const messaging = getMessaging(app);
  onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "Solando";
    const body = payload.notification?.body ?? "";
    registration.showNotification(title, { body, icon: "/favicon.ico" });
  });

  const token = await getToken(messaging, {
    vapidKey: config.vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("Não foi possível obter o token do aparelho");
  return token;
}

export type PushRegistration = { token: string; platform: "web" | "android" | "ios" };

export async function enablePush(): Promise<PushRegistration> {
  if (isNativeApp()) {
    const token = await getNativeToken();
    const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
    const platform = cap?.getPlatform?.() === "ios" ? "ios" : "android";
    return { token, platform };
  }
  const config = await fetchFirebaseConfig();
  const token = await getWebToken(config);
  return { token, platform: "web" };
}

export async function disablePushLocally(): Promise<void> {
  if (isNativeApp() || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => (r.active?.scriptURL ?? "").includes("firebase-messaging-sw.js"))
      .map((r) => r.unregister()),
  );
}

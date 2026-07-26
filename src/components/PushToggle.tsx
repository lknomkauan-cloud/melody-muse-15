import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { enablePush, disablePushLocally, pushSupported } from "@/lib/push";
import { registerPushToken, unregisterPushToken } from "@/lib/push.functions";

const STORAGE_KEY = "solando:push-token";

export function PushToggle() {
  const register = useServerFn(registerPushToken);
  const unregister = useServerFn(unregisterPushToken);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(pushSupported());
    setToken(localStorage.getItem(STORAGE_KEY));
  }, []);

  async function turnOn() {
    setBusy(true);
    try {
      const { token: t, platform } = await enablePush();
      await register({ data: { token: t, platform } });
      localStorage.setItem(STORAGE_KEY, t);
      setToken(t);
      toast.success("Notificações ativadas neste aparelho");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível ativar");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    if (!token) return;
    setBusy(true);
    try {
      await unregister({ data: { token } });
      await disablePushLocally();
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      toast.success("Notificações desativadas neste aparelho");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível desativar");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        Este aparelho/navegador não suporta notificações push.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant={token ? "outline" : "default"}
        onClick={token ? turnOff : turnOn}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : token ? (
          <BellOff className="mr-2 h-4 w-4" />
        ) : (
          <Bell className="mr-2 h-4 w-4" />
        )}
        {token ? "Desativar notificações" : "Ativar notificações"}
      </Button>
      <span className="text-sm text-muted-foreground">
        {token
          ? "Você receberá avisos do seu professor e da equipe Solando."
          : "Receba avisos de aulas, conteúdos liberados e novidades."}
      </span>
    </div>
  );
}

export default PushToggle;

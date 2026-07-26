import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { sendPushNotification } from "@/lib/push.functions";

type Props = {
  /** Admins can pick the audience; teachers always reach only their own students. */
  allowAllAudience?: boolean;
};

export function PushSender({ allowAllAudience = false }: Props) {
  const send = useServerFn(sendPushNotification);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("/");
  const [audience, setAudience] = useState<"all" | "my_students">(
    allowAllAudience ? "all" : "my_students",
  );
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (title.trim().length < 2 || body.trim().length < 2) {
      toast.error("Preencha título e mensagem");
      return;
    }
    setBusy(true);
    try {
      const res = await send({ data: { title, body, link, audience } });
      toast.success(
        res.recipients === 0
          ? "Nenhum aparelho com notificações ativas encontrado"
          : `Enviado para ${res.sent} de ${res.recipients} aparelhos`,
      );
      setTitle("");
      setBody("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="push-title">Título</Label>
          <Input
            id="push-title"
            value={title}
            maxLength={80}
            placeholder="Aula liberada!"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="push-link">Abrir em</Label>
          <Input
            id="push-link"
            value={link}
            placeholder="/estudar"
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="push-body">Mensagem</Label>
        <Textarea
          id="push-body"
          value={body}
          maxLength={300}
          rows={3}
          placeholder="Seu novo módulo de pentatônicas já está disponível."
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      {allowAllAudience && (
        <div className="space-y-2">
          <Label>Destinatários</Label>
          <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
            <SelectTrigger className="sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários do app</SelectItem>
              <SelectItem value="my_students">Apenas meus alunos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button onClick={submit} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Enviar notificação
      </Button>
    </div>
  );
}

export default PushSender;

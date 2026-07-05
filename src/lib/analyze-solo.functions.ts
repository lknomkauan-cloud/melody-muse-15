import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  audioBase64: z.string().min(100),
  format: z.enum(["webm", "mp4", "wav", "mp3", "m4a", "ogg"]).default("webm"),
  tonic: z.string(),
  modeName: z.string(),
  pentatonicNotes: z.array(z.string()),
  instrument: z.string(),
});

export const analyzeSolo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = `Você é um professor de música experiente. Analisa curtos trechos de áudio de um aluno tocando uma pentatônica modal. Seja direto, gentil e prático. Responda em português do Brasil.`;

    const user = `O aluno está praticando a **pentatônica ${data.modeName}** com tônica **${data.tonic}** no **${data.instrument}**.
Notas alvo (em ordem): ${data.pentatonicNotes.join(" - ")}.

Ouça o áudio anexado e responda em no máximo 6 linhas, em markdown:
1. **Notas identificadas** (na ordem que ouviu, com # ou b quando aplicável)
2. **Dentro da escala?** — quais notas saíram da pentatônica (se houver)
3. **Afinação** — flat/sharp/ok
4. **Tempo/ritmo** — regular ou irregular
5. **Dica prática** — 1 correção específica para a próxima tentativa

Se o áudio estiver muito baixo, com ruído ou sem notas claras, diga isso em 1 linha e peça pra regravar.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: user },
              {
                type: "input_audio",
                input_audio: { data: data.audioBase64, format: data.format },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Limite de requisições atingido, tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      throw new Error(`Falha na análise (${res.status}): ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content ?? "Sem resposta do modelo.";
    return { feedback: text };
  });

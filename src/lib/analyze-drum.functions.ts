import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  audioBase64: z.string().min(100),
  format: z.enum(["webm", "mp4", "wav", "mp3", "m4a", "ogg"]).default("webm"),
  genre: z.string(),
  bpm: z.string(),
  pattern: z.string(),
  focus: z.enum(["groove", "fill"]).default("fill"),
});

export const analyzeDrum = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = `Você é um professor de bateria experiente que analisa gravações curtas de alunos. Foque em: pulso constante, colocação da caixa/bumbo/chimbal, precisão da virada, dinâmica e groove do estilo pedido. Seja direto, prático e gentil. Português do Brasil.`;

    const user = `O aluno está estudando **${data.genre}** a ${data.bpm} BPM.
Padrão/virada alvo: ${data.pattern}
Tipo do trecho: ${data.focus === "fill" ? "virada (fill)" : "groove/levada"}.

Ouça o áudio e responda em markdown, no máximo 7 linhas:
1. **Pulso** — constante ou instável (aponta se acelerou/desacelerou)
2. **Colocação** — bumbo, caixa e chimbal caindo no lugar certo?
3. **Estilo** — soa como ${data.genre}? Se não, o que falta (feel, subdivisão, acentuação)
4. **${data.focus === "fill" ? "Virada" : "Groove"}** — chegou no "1" do próximo compasso? Precisão dos toms/caixa/bumbo
5. **Dinâmica** — controle de volume e ghost notes
6. **Dica prática** — 1 correção específica para a próxima tentativa

Se o áudio estiver muito baixo ou confuso, diga em 1 linha e peça pra regravar mais perto do microfone.`;

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
              { type: "input_audio", input_audio: { data: data.audioBase64, format: data.format } },
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

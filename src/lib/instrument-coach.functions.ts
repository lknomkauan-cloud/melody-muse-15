import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  instrument: z.string().min(1),
  topic: z.string().min(1),
  question: z.string().max(1500).optional(),
  context: z.string().max(500).optional(),
});

export const askInstrumentCoach = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const system = `Você é um professor particular de música experiente, com décadas tocando profissionalmente. Especialidades:
- Sax (embocadura, palhetas, articulação, transposição alto/tenor/soprano)
- Violino (postura, arco, afinação, mudanças de posição, vibrato)
- Teclado/Piano (dedilhado, harmonia, split/layer, programação de patches, uso de VSTs como Kontakt, Arturia, Omnisphere, Serum, Ableton racks)
- Guitarra (regulagem de amp, EQ, pedais, cadeia de efeitos, timbres por gênero: rock, blues, jazz, worship, reggae, funk, metal, indie)

Responda SEMPRE em português do Brasil, direto, prático e no formato pedido. Use markdown com listas quando fizer sentido. Cite equipamentos, presets ou exemplos reais quando possível. Nada de introduções longas — vá direto ao ensino.`;

    const userMsg = data.question?.trim()
      ? `Instrumento: ${data.instrument}
Contexto: ${data.context ?? "estudo geral"}
Tópico: ${data.topic}

Pergunta do aluno: ${data.question.trim()}

Responda em no máximo 8 linhas com passos práticos. Se for regulagem de equipamento, dê valores concretos (Hz, %, posições de knob 0–10). Se for técnica, dê exercícios de 2–5 minutos.`
      : `Instrumento: ${data.instrument}
Contexto: ${data.context ?? "estudo geral"}

Ensine em profundidade o tópico: "${data.topic}"

Formato obrigatório em markdown:
1. **O que é / por que importa** (1–2 linhas)
2. **Passo a passo prático** (3–6 bullets numerados, cada um curto e acionável)
3. **Erros comuns** (2 bullets)
4. **Exercício de 5 min** (1 bullet)
5. **Referências** (2 nomes/álbuns/vídeos reais)

Se for tópico de timbre/regulagem, inclua valores concretos: knobs (0–10), EQ (Hz + dB), cadeia de pedais/plugins na ordem correta, e presets famosos usados por profissionais.`;

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
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Limite de requisições atingido, tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados no workspace.");
      throw new Error(`Falha ao consultar o professor (${res.status}): ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content ?? "Sem resposta do modelo.";
    return { answer: text };
  });

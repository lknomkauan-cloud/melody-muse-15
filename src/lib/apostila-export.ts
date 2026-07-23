export type ApostilaLike = {
  id: string;
  title: string;
  description: string | null;
  instrument: string | null;
  content: { html?: string; blocks?: ApostilaBlock[] };
  source: "editor" | "blocos" | "upload";
};

export type ApostilaBlock =
  | { kind: "texto"; text: string }
  | { kind: "acorde"; name: string; note: string }
  | { kind: "escala"; tonalidade: string; nome: string }
  | { kind: "ritmo"; bpm: number; descricao: string };

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export function renderApostilaAsHtml(a: ApostilaLike): string {
  const header = `
    <h1 style="font-family:'Space Grotesk',sans-serif;font-size:28px;margin:0 0 8px;color:#111">${escapeHtml(a.title)}</h1>
    ${a.description ? `<p style="color:#555;margin:0 0 20px">${escapeHtml(a.description)}</p>` : ""}
    <hr style="border:none;border-top:1px solid #ddd;margin:16px 0" />
  `;
  if (a.source === "editor") {
    return header + `<div style="line-height:1.6">${a.content.html ?? ""}</div>`;
  }
  if (a.source === "blocos") {
    const blocks = (a.content.blocks ?? []).map((b) => {
      if (b.kind === "texto") return `<p style="margin:12px 0;line-height:1.6">${escapeHtml(b.text)}</p>`;
      if (b.kind === "acorde") return `<div style="margin:12px 0;padding:10px 14px;border-left:3px solid #4f46e5;background:#f5f4ff"><strong>Acorde:</strong> ${escapeHtml(b.name)}<br/><span style="color:#555">${escapeHtml(b.note)}</span></div>`;
      if (b.kind === "escala") return `<div style="margin:12px 0;padding:10px 14px;border-left:3px solid #0ea5e9;background:#f0f9ff"><strong>Escala:</strong> ${escapeHtml(b.nome)} em ${escapeHtml(b.tonalidade)}</div>`;
      return `<div style="margin:12px 0;padding:10px 14px;border-left:3px solid #f59e0b;background:#fffbeb"><strong>Ritmo:</strong> ${b.bpm} BPM — ${escapeHtml(b.descricao)}</div>`;
    }).join("");
    return header + blocks;
  }
  return header + "<p><em>Este material é um PDF anexo.</em></p>";
}

export async function exportContentAsPdf(apostila: ApostilaLike) {
  const { default: jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  const holder = document.createElement("div");
  holder.style.position = "fixed";
  holder.style.left = "-99999px";
  holder.style.top = "0";
  holder.style.width = "780px";
  holder.style.background = "#ffffff";
  holder.style.color = "#111111";
  holder.style.padding = "40px";
  holder.style.fontFamily = "'DM Sans', system-ui, sans-serif";
  holder.innerHTML = renderApostilaAsHtml(apostila);
  document.body.appendChild(holder);
  try {
    const canvas = await html2canvas(holder, { scale: 2, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let y = 0;
    while (y < imgH) {
      pdf.addImage(canvas, "PNG", 0, -y, imgW, imgH);
      y += pageH;
      if (y < imgH) pdf.addPage();
    }
    pdf.save(`${apostila.title || "apostila"}.pdf`);
  } finally {
    document.body.removeChild(holder);
  }
}

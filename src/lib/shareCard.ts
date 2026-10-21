export type CardData = { title: string; big: string; lines: string[]; footer: string };

/** Draws a 1080x1080 result card. Returns null where canvas isn't available. */
export function renderCard(d: CardData): Promise<Blob | null> {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1080;
    const x = c.getContext("2d");
    if (!x) return Promise.resolve(null);
    const g = x.createRadialGradient(540, 200, 80, 540, 540, 800);
    g.addColorStop(0, "#2b2417");
    g.addColorStop(1, "#1c1915");
    x.fillStyle = g;
    x.fillRect(0, 0, 1080, 1080);
    x.strokeStyle = "#b08d3e";
    x.lineWidth = 6;
    x.strokeRect(40, 40, 1000, 1000);
    x.textAlign = "center";
    x.fillStyle = "#d9b45b";
    x.font = "600 44px Georgia, serif";
    x.fillText("THE WORD", 540, 150);
    x.fillStyle = "#f4efe4";
    x.font = "600 64px Georgia, serif";
    x.fillText(d.title, 540, 300);
    x.fillStyle = "#d9b45b";
    x.font = "700 240px Georgia, serif";
    x.fillText(d.big, 540, 580);
    x.fillStyle = "#f4efe4";
    x.font = "400 52px Georgia, serif";
    d.lines.filter(Boolean).forEach((line, i) => x.fillText(line, 540, 700 + i * 70));
    x.fillStyle = "#b8b0a0";
    x.font = "400 40px Georgia, serif";
    x.fillText(d.footer, 540, 980);
    return new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
  } catch {
    return Promise.resolve(null);
  }
}

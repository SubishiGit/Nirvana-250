import fs from 'fs';
import path from 'path';

// --- Configuration ---
const INPUT_SVG_PATH = path.join(process.cwd(), 'public', 'Nirvana250_Baselayer.svg');
const OUTPUT_JSON_PATH = path.join(process.cwd(), 'public', 'plots.json');

// --- Helper Functions ---
function getAttr(tag, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m1 = tag.match(new RegExp(`(?:\\s|<)${esc}\\s*=\\s*"([^"]*)"`));
  if (m1) return m1[1];
  const m2 = tag.match(new RegExp(`(?:\\s|<)${esc}\\s*=\\s*'([^']*)'`));
  return m2 ? m2[1] : null;
}

function rectToPoints(x, y, w, h) {
  return `${x},${y} ${x + w},${y} ${x + w},${y + h} ${x},${y + h}`;
}

function pathToPoints(d) {
    const tokens = (d || "").replace(/,/g, " ").trim().match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][+-]?\d+)?/g);
    if (!tokens) return "";
    let i = 0, cmd = null, x = 0, y = 0, x0 = 0, y0 = 0;
    const out = [];
    const isCmd = (t) => /^[MmLlHhVvCcSsQqTtAaZz]$/.test(t);
    const num = () => +tokens[i++];
    const push = (nx, ny) => { x = nx; y = ny; out.push([x, y]); };
    // Curve/arc commands are approximated by their end anchor point only,
    // which is sufficient for these near-rectangular plot outlines.
    while (i < tokens.length) {
        if (isCmd(tokens[i])) {
            cmd = tokens[i++];
        } else if (cmd === "Z" || cmd === "z" || cmd === null) {
            break; // nothing valid to continue after a close (or before a move)
        }
        switch (cmd) {
            case "M": { const nx = num(), ny = num(); push(nx, ny); x0 = x; y0 = y; cmd = "L"; break; }
            case "m": { const dx = num(), dy = num(); push(x + dx, y + dy); x0 = x; y0 = y; cmd = "l"; break; }
            case "L": { const nx = num(), ny = num(); push(nx, ny); break; }
            case "l": { const dx = num(), dy = num(); push(x + dx, y + dy); break; }
            case "H": { push(num(), y); break; }
            case "h": { push(x + num(), y); break; }
            case "V": { push(x, num()); break; }
            case "v": { push(x, y + num()); break; }
            case "C": { num(); num(); num(); num(); const nx = num(), ny = num(); push(nx, ny); break; }
            case "c": { num(); num(); num(); num(); const dx = num(), dy = num(); push(x + dx, y + dy); break; }
            case "S": case "Q": { num(); num(); const nx = num(), ny = num(); push(nx, ny); break; }
            case "s": case "q": { num(); num(); const dx = num(), dy = num(); push(x + dx, y + dy); break; }
            case "T": { const nx = num(), ny = num(); push(nx, ny); break; }
            case "t": { const dx = num(), dy = num(); push(x + dx, y + dy); break; }
            case "A": { num(); num(); num(); num(); num(); const nx = num(), ny = num(); push(nx, ny); break; }
            case "a": { num(); num(); num(); num(); num(); const dx = num(), dy = num(); push(x + dx, y + dy); break; }
            case "Z": case "z": { push(x0, y0); break; }
            default: { i++; break; }
        }
    }
    if (out.length < 3) return "";
    return out.map(([px, py]) => `${(+px).toFixed(2)},${(+py).toFixed(2)}`).join(" ");
}

function normalizePlotId(id) {
  const s = String(id || "").trim();
  // Common export pattern: ids like "_90" or "_90_" should become "90"
  // so they can match sheet column values exactly.
  // Illustrator also appends a "-N" suffix to keep duplicate ids unique
  // (e.g. two shapes named 338 become "_338" and "_338-2"); strip that so
  // both map back to the intended plot number.
  return s
    .replace(/^_+/, "")
    .replace(/_+$/, "")
    .replace(/-\d+$/, "");
}

function main() {
  console.log(`Reading SVG from: ${INPUT_SVG_PATH}`);
  const svg = fs.readFileSync(INPUT_SVG_PATH, "utf8");

  const viewBox = getAttr(svg, "viewBox") || "0 0 1000 1000";
  const plots = [];
  let autoId = 1;

  const shapeTags = svg.match(/<\s*(rect|path|polygon)\b[^>]*>/gi) || [];

  for (const tag of shapeTags) {
    let id = getAttr(tag, "id");
    let points = "";

    if (tag.startsWith("<rect")) {
      if (!id) id = `Rect-${autoId++}`;
      const x = parseFloat(getAttr(tag, "x") || "0");
      const y = parseFloat(getAttr(tag, "y") || "0");
      const w = parseFloat(getAttr(tag, "width") || "NaN");
      const h = parseFloat(getAttr(tag, "height") || "NaN");
      if (isFinite(w) && isFinite(h) && w > 0 && h > 0) {
        points = rectToPoints(x, y, w, h);
      }
    } else if (tag.startsWith("<path")) {
        if (!id) id = `Path-${autoId++}`;
        const d = getAttr(tag, "d") || "";
        points = pathToPoints(d);
    } else if (tag.startsWith("<polygon")) {
        if (!id) id = `Poly-${autoId++}`;
        points = (getAttr(tag, "points") || "").trim().replace(/\s+/g, " ");
    }
    
    if (id && points) {
      plots.push({ id: normalizePlotId(id), points });
    }
  }

  const output = { viewBox, plots };
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2));
  
  console.log(`Success! Wrote ${OUTPUT_JSON_PATH}`);
  console.log(`  - ViewBox: ${viewBox}`);
  console.log(`  - Plots converted: ${plots.length} / ${shapeTags.length} shapes found`);
}

main();

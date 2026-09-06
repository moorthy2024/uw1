#!/usr/bin/env node
/**
 * Generates synthetic but fully text-searchable demo documents for the
 * Heartland Industrial Holdings UW Hub citation highlighting feature.
 *
 * Run once: node generate-docs.js
 * Output:  public/docs/heartland-re-report.pdf
 *          public/docs/heartland-sov.xlsx
 *          public/docs/heartland-application.docx
 *          public/docs/heartland-site-photo-1.jpg
 */

const fs   = require("fs");
const path = require("path");
const zlib = require("zlib");

const outDir = path.join(__dirname, "public", "docs");
fs.mkdirSync(outDir, { recursive: true });

// ─── PDF generator ────────────────────────────────────────────────────────────
// Produces a minimal text-searchable PDF (Type1 Helvetica, no external deps).
function buildPdf(pages) {
  // pages: Array<string[]>  — each inner array = lines on that page

  function enc(s) { return Buffer.from(s, "latin1"); }

  const bufs = [];
  const objOffsets = {};
  let pos = 0;

  function w(s) {
    const b = enc(s);
    bufs.push(b);
    pos += b.length;
  }

  function startObj(id) {
    objOffsets[id] = pos;
    w(`${id} 0 obj\n`);
  }
  function endObj() { w("endobj\n"); }

  // Object IDs:
  //   1        = Catalog
  //   2        = Pages
  //   3..N     = Page dict for page i  (id = 3 + i)
  //   N+1..2N  = Content stream for page i  (id = 3 + pages.length + i)
  //   2N+1     = Font

  const n       = pages.length;
  const pageIds    = pages.map((_, i) => 3 + i);
  const contentIds = pages.map((_, i) => 3 + n + i);
  const fontId  = 3 + 2 * n;
  const objCount = fontId;

  w("%PDF-1.4\n");

  // Catalog
  startObj(1);
  w("<</Type /Catalog /Pages 2 0 R>>\n");
  endObj();

  // Pages dict
  startObj(2);
  w(`<</Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${n}>>\n`);
  endObj();

  // Page dicts + content streams
  for (let i = 0; i < n; i++) {
    // Page dict
    startObj(pageIds[i]);
    w(`<</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]\n`);
    w(`/Contents ${contentIds[i]} 0 R /Resources <</Font <</F1 ${fontId} 0 R>>>>>>\n`);
    endObj();

    // Build content stream using Tm (absolute text matrix) for each line.
    // IMPORTANT: Td is relative to the CURRENT position, so using it in a loop
    // causes each line to accumulate offsets and land off-page. Tm sets an
    // absolute transform [a b c d tx ty], so 1 0 0 1 tx ty = identity + translate.
    const cmds = [];
    let y = 790;
    for (const line of pages[i]) {
      const esc = line
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
      cmds.push("BT");
      cmds.push("/F1 11 Tf");
      cmds.push(`1 0 0 1 72 ${y} Tm`);   // absolute position
      cmds.push(`(${esc}) Tj`);
      cmds.push("ET");
      y -= 16;
    }
    const stream = cmds.join("\n") + "\n";
    const streamLen = enc(stream).length;

    startObj(contentIds[i]);
    w(`<</Length ${streamLen}>>\n`);
    w("stream\n");
    w(stream);
    w("endstream\n");
    endObj();
  }

  // Font
  startObj(fontId);
  w("<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>\n");
  endObj();

  // xref
  const xrefStart = pos;
  w("xref\n");
  w(`0 ${objCount + 1}\n`);
  w("0000000000 65535 f \n");
  for (let id = 1; id <= objCount; id++) {
    w(`${String(objOffsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  w("trailer\n");
  w(`<</Size ${objCount + 1} /Root 1 0 R>>\n`);
  w("startxref\n");
  w(`${xrefStart}\n`);
  w("%%EOF\n");

  return Buffer.concat(bufs);
}

// ─── ZIP builder (for DOCX / XLSX structures) ─────────────────────────────────
function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  return (c ^ 0xffffffff) >>> 0;
}

function u16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n, 0); return b; }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0, 0); return b; }

function buildZip(files) {
  // files: Array<{ name: string, data: Buffer | string }>
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const f of files) {
    const data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, "utf8");
    const name = Buffer.from(f.name, "utf8");
    const crc  = crc32(data);
    const sz   = data.length;

    const lhdr = Buffer.concat([
      Buffer.from([0x50,0x4b,0x03,0x04]),
      u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(sz), u32(sz),
      u16(name.length), u16(0),
      name,
    ]);

    centrals.push({ name, crc, sz, localOffset: offset });
    locals.push(lhdr, data);
    offset += lhdr.length + sz;
  }

  const cdStart = offset;
  const cdParts = centrals.map(({ name, crc, sz, localOffset }) =>
    Buffer.concat([
      Buffer.from([0x50,0x4b,0x01,0x02]),
      u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(sz), u32(sz),
      u16(name.length), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(localOffset),
      name,
    ])
  );
  const cd = Buffer.concat(cdParts);

  const eocd = Buffer.concat([
    Buffer.from([0x50,0x4b,0x05,0x06]),
    u16(0), u16(0),
    u16(files.length), u16(files.length),
    u32(cd.length), u32(cdStart),
    u16(0),
  ]);

  return Buffer.concat([...locals, cd, eocd]);
}

// ─── DOCX builder ─────────────────────────────────────────────────────────────
function escXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildDocx(paragraphs) {
  // paragraphs: string[]  — each string becomes one <w:p>

  const wordDoc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${paragraphs.map(p => `    <w:p><w:r><w:t xml:space="preserve">${escXml(p)}</w:t></w:r></w:p>`).join("\n")}
    <w:sectPr/>
  </w:body>
</w:document>`;

  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  return buildZip([
    { name: "[Content_Types].xml",       data: ct },
    { name: "_rels/.rels",               data: rels },
    { name: "word/document.xml",         data: wordDoc },
    { name: "word/_rels/document.xml.rels", data: wordRels },
  ]);
}

// ─── XLSX builder ─────────────────────────────────────────────────────────────
// Produces a minimal OOXML spreadsheet with one sheet.
function buildXlsx(sheetName, rows) {
  // rows: string[][]  — 2D array of cell values

  function escXml(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  // Shared strings
  const strings = [];
  const stringIdx = new Map();
  function si(v) {
    const k = String(v);
    if (!stringIdx.has(k)) { stringIdx.set(k, strings.length); strings.push(k); }
    return stringIdx.get(k);
  }

  // Pre-register all strings
  rows.forEach(row => row.forEach(v => si(v)));

  const colLetter = (c) => {
    let s = "";
    c++;
    while (c > 0) { s = String.fromCharCode(64 + (c % 26 || 26)) + s; c = Math.floor((c - 1) / 26); }
    return s;
  };

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
${rows.map((row, r) =>
  `    <row r="${r+1}">\n` +
  row.map((v, c) =>
    `      <c r="${colLetter(c)}${r+1}" t="s"><v>${si(v)}</v></c>`
  ).join("\n") +
  `\n    </row>`
).join("\n")}
  </sheetData>
</worksheet>`;

  const sst = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">
${strings.map(s => `  <si><t xml:space="preserve">${escXml(s)}</t></si>`).join("\n")}
</sst>`;

  const wb = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escXml(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;

  const appRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`;

  return buildZip([
    { name: "[Content_Types].xml",             data: ct },
    { name: "_rels/.rels",                     data: appRels },
    { name: "xl/workbook.xml",                 data: wb },
    { name: "xl/_rels/workbook.xml.rels",      data: wbRels },
    { name: "xl/worksheets/sheet1.xml",        data: sheetXml },
    { name: "xl/sharedStrings.xml",            data: sst },
  ]);
}

// ─── Tiny placeholder JPEG (1×1 amber pixel) ─────────────────────────────────
// Pre-computed bytes for a valid 1x1 JPEG so no external dep is needed.
const AMBER_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
  "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAAR" +
  "CAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/" +
  "xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=",
  "base64"
);

// ─── Write files ──────────────────────────────────────────────────────────────

// 1. heartland-re-report.pdf  (2 pages)
//    Page 1: Named Insured field — value "Heartland Industrial Holdings LLC"
//    Page 2: ATC Occupancy Code — value "48"
const rePdf = buildPdf([
  [
    "HEARTLAND INDUSTRIAL HOLDINGS LLC",
    "RISK ENGINEERING REPORT",
    "Site Survey: Indianapolis Campus",
    "",
    "Named Insured: Heartland Industrial Holdings LLC",
    "Mailing Address: 4800 W 116th Street, Indianapolis, IN 46235",
    "NAICS Code: 332999",
    "Industry: Metal Fabrication",
    "",
    "Total Insured Value: $47,000,000",
    "Effective Date: 07/01/2026",
    "Survey Completed: 04/12/2026",
    "",
    "PROPERTY DESCRIPTION",
    "Large industrial manufacturing campus comprising three production",
    "buildings and an adjacent distribution warehouse situated on 42 acres.",
  ],
  [
    "RISK ENGINEERING REPORT - PAGE 2",
    "BUILDING CLASSIFICATION DETAILS",
    "",
    "ATC Occupancy Class: 48",
    "ATC Occupancy Description: Industrial Manufacturing",
    "Construction Type: III - Steel Frame / Masonry",
    "Stories Above Grade: 2",
    "Year Built: 1998",
    "Total Floor Area: 285,000 sq ft",
    "Sprinkler System: Yes - Wet Pipe (100%)",
    "",
    "HAZARD ASSESSMENT",
    "Overall Hazard Score: 3.2 / 5.0",
    "Fire Protection Grade: A",
    "Natural Hazard Exposure: Moderate",
  ],
]);
fs.writeFileSync(path.join(outDir, "heartland-re-report.pdf"), rePdf);
console.log("✓ heartland-re-report.pdf");

// 2. heartland-sov.xlsx  (Locations sheet)
//    Field 2 search: "Corporation"   → Business Type column (meta.industry not used here)
//    Field 6 search: "Manufacturing" → Occupancy Type column (meta.industry = "Manufacturing")
const sovXlsx = buildXlsx("Locations", [
  // Header row
  ["Location", "Address", "State", "Building Value", "Contents Value",
   "Business Type", "Occupancy Type", "TIV", "Hazard Class", "Year Built"],
  // Data rows — Occupancy Type must match meta.industry = "Manufacturing"
  ["HQ Campus - Bldg A", "4800 W 116th St", "IN", "$22,000,000", "$8,500,000",
   "Corporation", "Manufacturing", "$30,500,000", "III", "1998"],
  ["HQ Campus - Bldg B", "4800 W 116th St", "IN", "$7,200,000", "$2,100,000",
   "Corporation", "Manufacturing", "$9,300,000", "III", "2005"],
  ["Distribution Center", "5100 Industrial Blvd", "IN", "$4,800,000", "$1,500,000",
   "Corporation", "Warehouse / Manufacturing", "$6,300,000", "II", "2011"],
  ["Tool & Die Annex", "4820 W 116th St", "IN", "$800,000", "$100,000",
   "Corporation", "Manufacturing", "$900,000", "IV", "1975"],
]);
fs.writeFileSync(path.join(outDir, "heartland-sov.xlsx"), sovXlsx);
console.log("✓ heartland-sov.xlsx");

// 3. heartland-application.docx  (3 pages worth of paragraphs)
//    Field 3 search: "332999 — Diversified Fabricated Metal Mfg"  (meta.naics — em-dash + Mfg)
//    Field 7 search: "Manufacturing"                                    (meta.industry)
//    Field 8 search: "Commercial"                                       (hardcoded value)
// The em-dash — must appear verbatim in the XML so mammoth preserves it in HTML.
const appDocx = buildDocx([
  "COMMERCIAL PROPERTY APPLICATION",
  "",
  "Named Insured: Heartland Industrial Holdings LLC",
  "Business Type: Corporation",
  // em-dash (—) and "Mfg" abbreviation must exactly match meta.naics
  "NAICS Code: 332999 — Diversified Fabricated Metal Mfg",
  "Effective Date: 07/01/2026",
  "",
  "Policy Type: Commercial Property",
  "Coverage Requested: Building + Contents + Business Interruption",
  "",
  "-- PAGE BREAK --",
  "",
  "BUILDING INFORMATION",
  "",
  // "Commercial" must appear verbatim — matches Field 8 value
  "Building Classification: Commercial",
  "Construction Class: III - Masonry Non-Combustible",
  "Year Built: 1998",
  "Total Area: 285,000 sq ft",
  "Stories: 2",
  "Sprinklers: Yes",
  "",
  "-- PAGE BREAK --",
  "",
  "BUSINESS OPERATIONS DESCRIPTION",
  "",
  // Field 7 searchText = meta.industry + " operations across " + meta.locations + " scheduled locations"
  // This exact computed string must appear verbatim here for direct match.
  // highlightLabel = meta.industry = "Manufacturing" is also present as a shorter fallback.
  "Manufacturing operations across 20,485 — TX:2321, IN:1758, OH:1528 scheduled locations",
  "Heartland Industrial Holdings LLC is a diversified Manufacturing company",
  "operating production and distribution facilities across the Midwest.",
  "Primary industry: Manufacturing (fabricated metal components and assemblies)",
  "for automotive and industrial OEM clients. Approximately 420 full-time",
  "workers across three production shifts at the Indianapolis campus.",
  "",
  "NAICS: 332999 — Diversified Fabricated Metal Mfg",
  "Annual Revenue: ~$85M",
  "Employees: 420",
  "Locations: 20,485 (38 states)",
]);
fs.writeFileSync(path.join(outDir, "heartland-application.docx"), appDocx);
console.log("✓ heartland-application.docx");

// 4. heartland-site-photo-1.jpg  (minimal valid JPEG placeholder)
fs.writeFileSync(path.join(outDir, "heartland-site-photo-1.jpg"), AMBER_JPEG);
console.log("✓ heartland-site-photo-1.jpg");

console.log("\nAll documents written to public/docs/. Start the dev server and test citation highlighting.");

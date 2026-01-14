export const PRINT_LABEL_TEMPLATE_NAME = "print-label-perusahaan"

// Full HTML for jsreport chrome-pdf (Handlebars)
export const printLabelPerusahaanHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      margin: 0; /* semua margin di-handle oleh .page */
    }

    * {
      font-family: "Arial Narrow", "Arial", sans-serif !important;
    }

    body {
      margin: 0;
      font-size: 9pt;
      line-height: 1.1;
      color: #111;
    }

    /* wrapper = margin Word */
    .page {
      box-sizing: border-box;
      padding: 0.3cm 0.15cm 3cm 0cm; /* top, right, bottom, left */
      width: 100%;
      height: 100%;
      page-break-after: always;
      break-after: page;
    }

    /* wrapper label: lebar total tabel di Word (2 x 7.5 cm + 0.2 cm gap) */
    .labels-wrapper {
      box-sizing: border-box;
      width: 15.2cm;     /* 7.5 + 7.5 + 0.2 */
      margin: 0 auto;    /* center di dalam area antara margin */
    }

    /* Grid: 2 kolom, ukuran label fisik 75x38 mm */
    .labels-grid {
      display: grid;
      grid-template-columns: repeat(2, 7.5cm); /* sama seperti Word */
      grid-template-rows: repeat(5, 3.8cm);
      grid-auto-rows: 3.8cm;                   /* 38 mm */
      column-gap: 0.2cm;                       /* 2 mm */
      row-gap: 0.2cm;
    }

    .label {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      padding: 8mm;
      gap: 1mm;
      min-height: 3.8cm;
      break-inside: avoid;
      position: relative;
    }

    .label p {
      margin: 0;
      padding: 0;
    }

    .greeting   { font-size: 9pt; font-weight: 700; }
    .name-line  { font-size: 9pt; font-weight: 700; }
    .position   { font-size: 9pt; font-weight: 700; font-style: italic; }
    .company    { font-size: 8pt; font-weight: 700; }
    .address1,
    .address2   { font-size: 9pt; }
    .city-line  { font-size: 9pt; }

    .label-meta {
      font-size: 8pt;
      position: absolute;
      right: 1.5mm;
      bottom: 0.5mm;
      text-align: right;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  {{#each (chunk rows 10)}}
  <div class="page">
    <div class="labels-wrapper">
      <div class="labels-grid">
        {{#each this}}
        <div class="label">
          {{#if ../../showGreeting}}
            <p class="greeting">Kepada Yth.</p>
          {{/if}}
          <p class="name-line">{{#if sex}}{{sex}} {{/if}}{{contactName}}</p>
          <p class="position">{{position}}</p>
          <p class="company">{{companyName}}</p>
          <p class="address1">{{addressLine1}}</p>
          {{#if addressLine2}}
            <p class="address2">{{addressLine2}}</p>
          {{/if}}
          <p class="city-line">{{city}}{{#if postcode}} {{postcode}}{{/if}}</p>
          <div class="label-meta">
            {{#if ../../title}}{{../../title}}.{{/if}}{{#if nourut}}{{nourut}}{{else}}{{add @index 1}}{{/if}}
          </div>
        </div>
        {{/each}}
      </div>
    </div>
  </div>
  {{/each}}
</body>
</html>

`
export const printLabelPerusahaanHelpers = `
function chunk(list, size) {
  if (!Array.isArray(list) || !size || size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
}

function add(a, b) { 
  return Number(a) + Number(b); 
}
`

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
      padding: 0.4cm 0.15cm 3cm 1.12cm; /* top, right, bottom, left */
      width: 100%;
      height: 100%;
    }

    /* wrapper label: lebar total tabel di Word (2 × 7.5 cm + 0.2 cm gap) */
    .labels-wrapper {
      box-sizing: border-box;
      width: 15.2cm;     /* 7.5 + 7.5 + 0.2 */
      margin: 0 auto;    /* center di dalam area antara margin */
    }

    /* Grid: 2 kolom, ukuran label fisik 75×38 mm */
    .labels-grid {
      display: grid;
      grid-template-columns: repeat(2, 7.5cm); /* sama seperti Word */
      grid-auto-rows: 3.8cm;                   /* 38 mm */
      column-gap: 0.2cm;                       /* 2 mm */
      row-gap: 0.2cm;
    }

    .label {
      position: relative;
      box-sizing: border-box;
      margin-top: 5mm;
      padding: 2mm;
      break-inside: avoid;
      min-height: 3.8cm;
    }

    .label p {
      margin: 1mm;
      padding: 0;
    }

    .greeting   { font-size: 9pt; margin-bottom: 0.6mm; font-weight: 700; }
    .name-line  { font-size: 9pt; margin-bottom: 0.6mm; font-weight: 700; }
    .position   { font-size: 9pt; margin-bottom: 0.6mm; font-weight: 700; font-style: italic; }
    .company    { font-size: 8pt; font-weight: 700; margin-bottom: 0.6mm; }
    .address1,
    .address2   { font-size: 9pt; margin-bottom: 2mm; }
    .city-line  { display: block; font-size: 9pt; margin-top: 0.6mm; margin-bottom: 3mm; }

    .label-meta {
      position: absolute;
      right: 1mm;
      bottom: 1mm;
      top: 70%;
      left: 60%;
      font-size: 8pt;
      white-space: nowrap;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="labels-wrapper">
      <div class="labels-grid">
        {{#each rows}}
        <div class="label">
          <p class="greeting">Kepada Yth.</p>
          <p class="name-line">{{#if sex}}{{sex}} {{/if}}{{contactName}}</p>
          <p class="position">{{position}}</p>
          <p class="company">{{companyName}}</p>
          <p class="address1">{{addressLine1}}</p>
          {{#if addressLine2}}
            <p class="address2">{{addressLine2}}</p>
          {{/if}}
          <p class="city-line">{{city}}{{#if postcode}} {{postcode}}{{/if}}</p>
          <div class="label-meta">
            {{#if ../title}}{{../title}}.{{/if}}{{#if nourut}}{{nourut}}{{else}}{{add @index 1}}{{/if}}
          </div>
        </div>
        {{/each}}
      </div>
    </div>
  </div>
</body>
</html>

`
export const printLabelPerusahaanHelpers = `
function add(a, b) { 
  return Number(a) + Number(b); 
}
`

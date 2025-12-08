export const PRINT_LABEL_TEMPLATE_NAME = "print-label-perusahaan"

// Full HTML for jsreport chrome-pdf (Handlebars)
export const printLabelPerusahaanHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      /* Margin: Top 0.4 cm, Right 0.15 cm, Bottom 3 cm, Left 1.32 cm */
      margin: 0.4cm 0.15cm 3cm 1.32cm;
    }

    * {
      font-family: "Arial Narrow", "Arial", sans-serif !important;
    }

    body {
      margin: 0;
      font-size: 8.5pt;
      line-height: 1.05;
      color: #111;
    }

    /* Grid: 2 kolom, ukuran label 75mm x 38mm, gap 2mm */
    .labels-grid {
      display: grid;
      grid-template-columns: repeat(2, 75mm);
      grid-auto-rows: 38mm;
      column-gap: 2mm;
      row-gap: 2mm;
      padding: 0;
    }

    .label {
      position: relative;
      box-sizing: border-box;
      padding: 1.5mm 2mm 1.5mm 1mm;
      break-inside: avoid;
      min-height: 38mm;
    }

    .label p {
      margin: 0;
      padding: 0;
    }

    .greeting {
      font-size: 8.5pt;
      margin-bottom: 0.4mm;
      font-weight: 700;
    }

    .name-line {
      font-size: 8.5pt;
      margin-bottom: 0.35mm;
      font-weight: 700;
    }

    .position {
      font-size: 8.5pt;
      margin-bottom: 0.3mm;
      font-weight: 700;
      font-style: italic;
    }

    .company {
      font-size: 7.5pt; /* company 7.5pt */
      margin-bottom: 0.25mm;
    }

    .address1,
    .address2 {
      font-size: 8.5pt;
      margin-bottom: 0.25mm;
    }

    .city-line {
      display: block;
      font-size: 8.5pt;
      margin-top: 0.25mm;
      margin-bottom: 4mm; /* space for badge at bottom */
    }

    .label-meta {
      position: absolute;
      right: 1mm;
      bottom: 1mm;
      font-size: 7.5pt; /* judul label 7.5pt */
      white-space: nowrap;
      text-align: right;
    }
  </style>
</head>
<body>
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
      <span class="label-meta">{{title}}{{add @index 1}}</span>
    </div>
    {{/each}}
  </div>
</body>
</html>
`

// Simple helpers for the template
export const printLabelPerusahaanHelpers = `function add(a, b) { return Number(a) + Number(b); }`

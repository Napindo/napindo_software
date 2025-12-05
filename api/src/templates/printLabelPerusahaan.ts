export const PRINT_LABEL_TEMPLATE_NAME = "print-label-perusahaan"

// Full HTML for jsreport chrome-pdf (Handlebars)
export const printLabelPerusahaanHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      /* Mendekati posisi di ruler pada contoh Word; tweak jika masih geser di cetak */
      margin: 10mm 12mm 12mm 12mm; /* top right bottom left */
    }

    body {
      margin: 0;
      font-family: "Arial Narrow", Arial, sans-serif;
      font-size: 8.5pt; /* default 8.5pt */
      color: #111;
    }

    /* Header: Judul_Label + total */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin: 0 2mm 6mm 2mm;
      font-size: 7.5pt; /* judul lebih kecil */
    }

    /* Tom & Jerry No.121: 75 x 38 mm label size */
    .labels-grid {
      display: grid;
      grid-template-columns: repeat(2, 75mm); /* label width */
      grid-auto-rows: 38mm;                   /* label height */
      column-gap: 18mm;                       /* gutter between columns */
      row-gap: 10mm;                          /* gutter antar baris */
      justify-content: center;                /* center the two labels on A4 */
      padding: 0;
    }

    /* Label box */
    .label {
      box-sizing: border-box;
      position: relative;
      padding: 2.5mm 3mm;
      border: none;
      break-inside: avoid;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 6mm;
      height: 100%;
    }

    .label-text {
      flex: 1;
      min-width: 0;
    }

    .name {
      font-size: 8.5pt;
      font-weight: 700;
      margin-bottom: 0.35mm;
      line-height: 1.02;
    }

    .position {
      font-size: 8.5pt;
      font-weight: 700;
      margin-bottom: 0.35mm;
      line-height: 1.02;
    }

    .company {
      font-size: 7.5pt; /* hanya company 7.5pt */
      margin-bottom: 0.25mm;
      line-height: 1.02;
    }

    .address-line {
      font-size: 8.5pt;
      line-height: 1.02;
      margin-bottom: 0.15mm;
    }

    .city-zip {
      font-size: 8.5pt;
      line-height: 1.02;
      margin-top: 0.15mm;
    }

    /* Right-side badge: Judul Print Label + NoUrut */
    .badge {
      position: absolute;
      right: 2mm;
      bottom: 2mm;
      padding: 0.6mm 1.8mm;
      border: none;
      display: inline-block;
      font-size: 7.5pt; /* judul label 7.5pt */
      min-width: 24mm;
      text-align: right;
      line-height: 1.02;
      align-self: flex-end;
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div>{{title}}</div>
    <div>Total data: {{totalCount}}</div>
  </div>

  <div class="labels-grid">
    {{#each rows}}
      <div class="label">
        <div class="label-text">
          <div class="name">
            {{#if sex}}{{sex}} {{/if}}{{contactName}}
          </div>
          <div class="position">{{position}}</div>
          <div class="company">{{companyName}}</div>

          <div class="address-line">{{addressLine1}}</div>
          {{#if addressLine2}}<div class="address-line">{{addressLine2}}</div>{{/if}}
          <div class="city-zip">
            {{#if city}}{{city}}{{/if}}{{#if postcode}} {{postcode}}{{/if}}
          </div>
          {{#if province}}<div class="address-line">{{province}}</div>{{/if}}
          {{#if country}}<div class="address-line">{{country}}</div>{{/if}}
        </div>

        <div class="badge">
          {{title}} {{add @index 1}}
        </div>
      </div>
    {{/each}}
  </div>
</body>
</html>
`

// Simple helpers for the template
export const printLabelPerusahaanHelpers = `function add(a, b) { return Number(a) + Number(b); }`

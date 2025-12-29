export const REPORT_TEMPLATE_NAME = "report-perusahaan"

export const reportPerusahaanHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      margin: 1.2cm 1.2cm 1.2cm 1.2cm;
    }

    * {
      font-family: "Arial Narrow", "Arial", sans-serif !important;
    }

    body {
      margin: 0;
      font-size: 9pt;
      line-height: 1.25;
      color: #111;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.4cm;
    }

    .title {
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    .date {
      font-size: 9pt;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead th {
      text-align: left;
      font-weight: 700;
      font-size: 9pt;
      padding: 2px 4px 6px 4px;
      border-bottom: 1px solid #333;
    }

    tbody td {
      vertical-align: top;
      padding: 6px 4px 10px 4px;
      font-size: 9pt;
    }

    .col-no {
      width: 5%;
      text-align: center;
    }

    .col-company {
      width: 35%;
    }

    .col-contact {
      width: 30%;
    }

    .col-business {
      width: 30%;
    }

    .line-strong {
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">{{title}}</div>
    <div class="date">{{reportDate}}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="col-no">No</th>
        <th class="col-company">Company</th>
        <th class="col-contact">Contact Person</th>
        <th class="col-business">Business / Product</th>
      </tr>
    </thead>
    <tbody>
      {{#each rows}}
      <tr>
        <td class="col-no">{{add @index 1}}</td>
        <td class="col-company">
          <div class="line-strong">{{company}}</div>
          {{#if address1}}<div>{{address1}}</div>{{/if}}
          {{#if address2}}<div>{{address2}}</div>{{/if}}
          <div>{{city}}{{#if zip}} {{zip}}{{/if}}</div>
        </td>
        <td class="col-contact">
          <div class="line-strong">{{#if sex}}{{sex}} {{/if}}{{name}}</div>
          {{#if position}}<div>{{position}}</div>{{/if}}
          {{#if phone}}<div>Telp. {{phone}}</div>{{/if}}
          {{#if facsimile}}<div>Fax. {{facsimile}}</div>{{/if}}
        </td>
        <td class="col-business">
          {{#if business}}<div class="line-strong">{{business}}</div>{{/if}}
          {{#if email}}<div>{{email}}</div>{{/if}}
          {{#if handphone}}<div>{{handphone}}</div>{{/if}}
          {{#if lastupdate}}<div>{{lastupdate}}</div>{{/if}}
        </td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</body>
</html>
`

export const reportPerusahaanHelpers = `
function add(a, b) { 
  return Number(a) + Number(b); 
}
`

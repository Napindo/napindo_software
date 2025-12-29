export const REPORT_JUMLAH_TEMPLATE_NAME = "report-jumlah"

export const reportJumlahHtml = `<!DOCTYPE html>
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
      padding: 6px 4px 6px 4px;
      font-size: 9pt;
    }

    .col-business {
      width: 75%;
    }

    .col-count {
      width: 25%;
      text-align: right;
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
        <th class="col-business">Business</th>
        <th class="col-count">Jumlah</th>
      </tr>
    </thead>
    <tbody>
      {{#each rows}}
      <tr>
        <td class="col-business">{{business}}</td>
        <td class="col-count">{{count}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</body>
</html>
`

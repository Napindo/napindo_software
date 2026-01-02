export const PERSONAL_DATABASE_TEMPLATE_NAME = "personal-database"

export const personalDatabaseHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      font-family: "Segoe UI", "Arial", sans-serif !important;
    }

    body {
      margin: 0;
      color: #f4f4f4;
      background: #2b2b2b;
      font-size: 12pt;
      line-height: 1.4;
    }

    .page {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-height: 100vh;
      padding: 28mm 24mm;
      background: #2b2b2b;
      border: 1px solid #3a3a3a;
    }

    .title {
      text-align: center;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin-bottom: 18mm;
    }

    table {
      border-collapse: collapse;
      font-size: 11pt;
    }

    td {
      padding: 4mm 0;
      vertical-align: top;
    }

    .label {
      padding-right: 12mm;
      white-space: nowrap;
      font-weight: 600;
      color: #f6f6f6;
    }

    .value {
      color: #f1f1f1;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="title">{{title}}</div>
    <table>
      {{#each rows}}
        <tr>
          <td class="label">{{label}}</td>
          <td class="value">: {{value}}</td>
        </tr>
      {{/each}}
    </table>
  </div>
</body>
</html>
`

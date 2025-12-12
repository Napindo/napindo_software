// Use the "beforeRender" or "afterRender" hook
// to manipulate and control the report generation
// scripts: beforeRender
// scripts: beforeRender
async function beforeRender(req) {
  req.template.chrome = req.template.chrome || {};

  // biar CSS @page + .page yang ngatur margin
  req.template.chrome.format = 'A4';
  req.template.chrome.marginTop = '0cm';
  req.template.chrome.marginRight = '0cm';
  req.template.chrome.marginBottom = '0cm';
  req.template.chrome.marginLeft = '0cm';

  const helper = 'function add(a, b) { return Number(a) + Number(b); }';
  req.template.helpers = req.template.helpers
    ? req.template.helpers + '\n' + helper
    : helper;
}
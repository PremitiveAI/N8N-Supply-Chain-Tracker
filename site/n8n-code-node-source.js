
const tag = (rows, role) => rows.map(i => i.json).filter(o => Object.keys(o).length).map(o => Object.assign({ __role: role }, o));
const all = []
  .concat(tag($('Get Manufacturer Responses').all(), 'Manufacturer'))
  .concat(tag($('Get Distributor Responses').all(), 'Distributor'))
  .concat(tag($('Get Retailer Responses').all(), 'Retailer'))
  .concat(tag($('Get Garage Responses').all(), 'Garage'));

const esc = (v) => String(v == null ? '' : v).replace(/</g, '&lt;').replace(/>/g, '&gt;');
const perRole = { Manufacturer: 0, Distributor: 0, Retailer: 0, Garage: 0 };
for (const r of all) perRole[r.__role] = (perRole[r.__role] || 0) + 1;

const cols = [];
for (const r of all) for (const k of Object.keys(r)) if (k !== '__role' && !cols.includes(k)) cols.push(k);

const kpi = (label, value, sub) => '<div style="background:#fff;border-radius:14px;padding:20px 22px;box-shadow:0 6px 18px rgba(43,58,95,0.08);border-top:4px solid #2b6cb0;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#718096;font-weight:700;">' + label + '</div><div style="font-size:28px;font-weight:800;color:#1e3a5f;margin-top:6px;">' + value + '</div><div style="font-size:12px;color:#a0aec0;margin-top:4px;">' + sub + '</div></div>';

const recent = all.slice(-15).reverse();
let head = '<th style="padding:10px 12px;text-align:left;color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Role</th>';
for (const c of cols) head += '<th style="padding:10px 12px;text-align:left;color:#718096;font-size:11px;text-transform:uppercase;letter-spacing:1px;">' + esc(c) + '</th>';
let rows = '';
for (const o of recent) {
  rows += '<tr style="border-bottom:1px solid #edf2f7;"><td style="padding:10px 12px;font-weight:700;color:#2b6cb0;">' + esc(o.__role) + '</td>';
  for (const c of cols) rows += '<td style="padding:10px 12px;color:#2d3748;">' + esc(o[c]) + '</td>';
  rows += '</tr>';
}
if (!rows) rows = '<tr><td colspan="' + (cols.length + 1) + '" style="padding:24px;text-align:center;color:#a0aec0;">No form responses yet.</td></tr>';

const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Supply Chain Dashboard</title></head>' +
'<body style="margin:0;font-family:Inter,Arial,Helvetica,sans-serif;background:linear-gradient(135deg,#eef6fc,#ddeaf6);min-height:100vh;">' +
'<div style="max-width:1100px;margin:0 auto;padding:40px 20px 60px;">' +
'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px;">' +
'<div><h1 style="margin:0;font-size:26px;color:#1e3a5f;">Live Supply Chain Dashboard</h1>' +
'<p style="margin:4px 0 0;color:#718096;font-size:14px;">Google Form responses &bull; updated ' + new Date().toUTCString() + '</p></div>' +
'<a href="#" onclick="location.reload();return false;" style="background:#2b6cb0;color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 18px;border-radius:10px;">Refresh</a></div>' +
'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:22px;">' +
kpi('Total Responses', all.length, 'across all four roles') +
kpi('Manufacturer', perRole.Manufacturer, 'form responses') +
kpi('Distributor', perRole.Distributor, 'form responses') +
kpi('Retailer', perRole.Retailer, 'form responses') +
kpi('Garage', perRole.Garage, 'form responses') +
'</div>' +
'<div style="background:#fff;border-radius:14px;box-shadow:0 6px 18px rgba(43,58,95,0.08);overflow:hidden;">' +
'<div style="padding:18px 22px;border-bottom:1px solid #edf2f7;font-weight:800;color:#1e3a5f;font-size:16px;">Recent Responses</div>' +
'<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">' +
'<thead><tr style="background:#f7fafc;">' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
'<p style="text-align:center;color:#a0aec0;font-size:12px;margin-top:24px;">Live data from your Google Form response sheets - reload anytime for the latest.</p>' +
'</div></body></html>';

return [{ json: { html } }];


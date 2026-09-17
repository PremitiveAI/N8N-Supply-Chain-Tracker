const WEBHOOK_URL = "https://trex4u.app.n8n.cloud/webhook/supply-chain-dashboard";

const ROLES = ["manufacturer", "distributor", "retailer", "garage"];

const statusEl = document.getElementById("status");
const refreshBtn = document.getElementById("refreshBtn");
const kpisEl = document.getElementById("kpis");
const generatedAtEl = document.getElementById("generatedAt");

function setStatus(message, isError = false) {
  if (!message) { statusEl.classList.add("hidden"); return; }
  statusEl.textContent = message;
  statusEl.classList.remove("hidden");
  statusEl.classList.toggle("error", isError);
}

function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Build a table for one role's array of row objects.
function renderTable(rows) {
  if (!rows || !rows.length) {
    return '<div class="empty">No responses yet.</div>';
  }
  // Collect column names across rows, ignoring internal fields.
  const cols = [];
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (k !== "row_number" && !cols.includes(k)) cols.push(k);
    }
  }
  let head = "<tr>" + cols.map((c) => `<th>${esc(c)}</th>`).join("") + "</tr>";
  let body = "";
  for (const r of rows) {
    body += "<tr>" + cols.map((c) => `<td>${esc(r[c])}</td>`).join("") + "</tr>";
  }
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function renderKpis(counts) {
  const cards = [
    ["Total", counts.total],
    ["Manufacturer", counts.manufacturer],
    ["Distributor", counts.distributor],
    ["Retailer", counts.retailer],
    ["Garage", counts.garage],
  ];
  kpisEl.innerHTML = cards
    .map(
      ([label, value]) =>
        `<div class="kpi"><div class="label">${label}</div><div class="value">${value ?? 0}</div></div>`
    )
    .join("");
}

async function loadDashboard() {
  refreshBtn.disabled = true;
  setStatus("Loading dashboard…");

  try {
    // Public webhook + Access-Control-Allow-Origin: * -> plain GET, no credentials.
    const response = await fetch(WEBHOOK_URL, { method: "GET" });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const counts = data.counts || {};
    const roles = data.roles || {};

    generatedAtEl.textContent = data.generatedAt
      ? `Updated ${data.generatedAt}`
      : "";

    renderKpis(counts);

    for (const role of ROLES) {
      document.getElementById(`count-${role}`).textContent =
        (counts[role] ?? (roles[role] ? roles[role].length : 0)) || 0;
      document.getElementById(`table-${role}`).innerHTML = renderTable(roles[role]);
    }

    setStatus(null);
  } catch (err) {
    console.error(err);
    setStatus(`Could not load dashboard: ${err.message}`, true);
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener("click", loadDashboard);
loadDashboard();
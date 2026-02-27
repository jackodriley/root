const state = {
  detailedRows: [],
  subscriberRows: [],
  files: [],
  summary: null,
};

const palette = {
  newsOrange: "#F99A0A",
  culturePurple: "#B5B0D0",
  styleRed: "#FF505A",
  ideasBlue: "#AAD9FF",
  sportGreen: "#A0D0C0",
  foodYellow: "#E0E00A",
};

const elements = {
  dropZone: document.getElementById("drop-zone"),
  fileInput: document.getElementById("file-input"),
  downloadCsv: document.getElementById("download-csv"),
  status: document.getElementById("status"),
  error: document.getElementById("error"),
  kpiNew: document.getElementById("kpi-new"),
  kpiRenewal: document.getElementById("kpi-renewal"),
  kpiChurn: document.getElementById("kpi-churn"),
  kpiCash: document.getElementById("kpi-cash"),
  orderTable: document.getElementById("order-table"),
  termTable: document.getElementById("term-table"),
  periodTable: document.getElementById("period-table"),
};

const charts = {
  order: null,
  term: null,
  period: null,
};

function resetState() {
  state.detailedRows = [];
  state.subscriberRows = [];
  state.files = [];
  state.summary = null;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[$,]/g, "").trim();
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeHeader(header) {
  return String(header || "").trim().toLowerCase();
}

function detectFileType(fields) {
  const normalized = new Set((fields || []).map(normalizeHeader));
  const isSubscriber =
    normalized.has("subscriber id") &&
    normalized.has("standard subscription duration") &&
    normalized.has("customer price");
  const isDetailedSales =
    normalized.has("order type") &&
    normalized.has("period") &&
    normalized.has("units") &&
    normalized.has("customer price");

  if (isSubscriber) return "subscriber";
  if (isDetailedSales) return "detailedSales";
  return "unknown";
}

function normalizeTerm(raw) {
  const term = String(raw || "").trim();
  const lower = term.toLowerCase();
  if (lower.includes("year")) return "Annual";
  if (lower.includes("month")) return "Monthly";
  if (lower.includes("week")) return "Weekly";
  return term || "Unknown";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatInt(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function setError(message) {
  if (!message) {
    elements.error.classList.add("hidden");
    elements.error.textContent = "";
    return;
  }
  elements.error.textContent = message;
  elements.error.classList.remove("hidden");
}

function updateStatus() {
  if (!state.files.length) {
    elements.status.textContent = "No files loaded yet.";
    return;
  }
  const detailedCount = state.files.filter((f) => f.type === "detailedSales").length;
  const subscriberCount = state.files.filter((f) => f.type === "subscriber").length;
  const unknownCount = state.files.filter((f) => f.type === "unknown").length;
  elements.status.textContent =
    `Loaded ${state.files.length} file(s): ${detailedCount} Detailed Sales, ` +
    `${subscriberCount} Subscriber, ${unknownCount} Unrecognized.`;
}

function aggregateDetailedSales(rows) {
  let newSubs = 0;
  let renewals = 0;
  let churn = 0;
  let grossCash = 0;
  const periodMap = new Map();

  for (const row of rows) {
    const orderType = String(row["Order Type"] || "").trim().toLowerCase();
    const period = String(row["Period"] || "Unknown").trim() || "Unknown";
    const units = parseNumber(row["Units"]);
    const customerPrice = parseNumber(row["Customer Price"]);
    const isChurnType = /cancel|refund|revoke|churn/.test(orderType);

    if (orderType === "new") newSubs += units;
    if (orderType === "renewal") renewals += units;
    if (units < 0) churn += Math.abs(units);
    if (isChurnType && units > 0) churn += units;

    grossCash += customerPrice * units;
    periodMap.set(period, (periodMap.get(period) || 0) + units);
  }

  return {
    newSubs,
    renewals,
    churn,
    grossCash,
    periodMap,
  };
}

function aggregateSubscriberTerms(rows) {
  const subscriberToTerm = new Map();

  for (const row of rows) {
    const subscriberId = String(row["Subscriber ID"] || "").trim();
    if (!subscriberId) continue;
    const term = normalizeTerm(row["Standard Subscription Duration"]);
    if (!subscriberToTerm.has(subscriberId)) subscriberToTerm.set(subscriberId, term);
  }

  const termMap = new Map();
  for (const term of subscriberToTerm.values()) {
    termMap.set(term, (termMap.get(term) || 0) + 1);
  }
  return termMap;
}

function renderTable(target, rows) {
  target.innerHTML = rows
    .map(
      (row) =>
        `<tr class="border-t border-slate-200"><td class="px-3 py-2">${row[0]}</td><td class="px-3 py-2">${row[1]}</td></tr>`,
    )
    .join("");
}

function renderCharts(orderSummary, termMap, periodMap) {
  const orderCtx = document.getElementById("order-chart");
  const termCtx = document.getElementById("term-chart");
  const periodCtx = document.getElementById("period-chart");

  if (charts.order) charts.order.destroy();
  if (charts.term) charts.term.destroy();
  if (charts.period) charts.period.destroy();

  charts.order = new Chart(orderCtx, {
    type: "bar",
    data: {
      labels: ["New", "Renewal", "Churn"],
      datasets: [
        {
          label: "Units",
          data: [orderSummary.newSubs, orderSummary.renewals, orderSummary.churn],
          backgroundColor: [palette.newsOrange, palette.sportGreen, palette.styleRed],
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });

  charts.term = new Chart(termCtx, {
    type: "pie",
    data: {
      labels: Array.from(termMap.keys()),
      datasets: [
        {
          data: Array.from(termMap.values()),
          backgroundColor: [
            palette.ideasBlue,
            palette.culturePurple,
            palette.foodYellow,
            palette.sportGreen,
            palette.newsOrange,
            palette.styleRed,
          ],
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });

  const periodEntries = Array.from(periodMap.entries()).sort((a, b) => b[1] - a[1]);
  charts.period = new Chart(periodCtx, {
    type: "bar",
    data: {
      labels: periodEntries.map(([period]) => period),
      datasets: [
        {
          label: "Units",
          data: periodEntries.map(([, units]) => units),
          backgroundColor: palette.culturePurple,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });
}

function setDownloadEnabled(enabled) {
  elements.downloadCsv.disabled = !enabled;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadSummaryCsv() {
  if (!state.summary) return;

  const lines = [
    "Section,Metric,Value",
    `KPIs,Total New Subscribers,${escapeCsv(state.summary.kpis.newSubs)}`,
    `KPIs,Total Renewals,${escapeCsv(state.summary.kpis.renewals)}`,
    `KPIs,Estimated Churn,${escapeCsv(state.summary.kpis.churn)}`,
    `KPIs,Gross Cash Collected (USD display),${escapeCsv(state.summary.kpis.grossCash)}`,
    "",
    "Term Breakdown,Term,Unique Subscribers",
    ...state.summary.terms.map((row) => `${escapeCsv("Term Breakdown")},${escapeCsv(row.term)},${escapeCsv(row.count)}`),
    "",
    "Period Summary,Period,Units",
    ...state.summary.periods.map((row) => `${escapeCsv("Period Summary")},${escapeCsv(row.period)},${escapeCsv(row.units)}`),
  ];

  const blob = new Blob([`${lines.join("\n")}\n`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `app-store-finance-summary-${dateStamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function refreshDashboard() {
  const orderSummary = aggregateDetailedSales(state.detailedRows);
  const termMap = aggregateSubscriberTerms(state.subscriberRows);

  elements.kpiNew.textContent = formatInt(orderSummary.newSubs);
  elements.kpiRenewal.textContent = formatInt(orderSummary.renewals);
  elements.kpiChurn.textContent = formatInt(orderSummary.churn);
  elements.kpiCash.textContent = formatCurrency(orderSummary.grossCash);

  renderTable(elements.orderTable, [
    ["Total New Subscribers", formatInt(orderSummary.newSubs)],
    ["Total Renewals", formatInt(orderSummary.renewals)],
    ["Estimated Churn", formatInt(orderSummary.churn)],
    ["Gross Cash Collected", formatCurrency(orderSummary.grossCash)],
  ]);

  const termEntries = Array.from(termMap.entries()).sort((a, b) => b[1] - a[1]);
  renderTable(
    elements.termTable,
    termEntries.length ? termEntries.map(([term, count]) => [term, formatInt(count)]) : [["No subscriber data yet", "0"]],
  );

  const periodEntries = Array.from(orderSummary.periodMap.entries()).sort((a, b) => b[1] - a[1]);
  renderTable(
    elements.periodTable,
    periodEntries.length ? periodEntries.map(([period, units]) => [period, formatInt(units)]) : [["No sales data yet", "0"]],
  );

  state.summary = {
    kpis: {
      newSubs: formatInt(orderSummary.newSubs),
      renewals: formatInt(orderSummary.renewals),
      churn: formatInt(orderSummary.churn),
      grossCash: formatCurrency(orderSummary.grossCash),
    },
    terms: termEntries.map(([term, count]) => ({ term, count: formatInt(count) })),
    periods: periodEntries.map(([period, units]) => ({ period, units: formatInt(units) })),
  };
  setDownloadEnabled(Boolean(state.files.length));

  renderCharts(orderSummary, termMap, orderSummary.periodMap);
}

async function handleFiles(files) {
  setError("");
  const list = Array.from(files || []);
  if (!list.length) return;

  const nextState = {
    detailedRows: [],
    subscriberRows: [],
    files: [],
  };

  for (const file of list) {
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, {
        header: true,
        delimiter: "\t",
        skipEmptyLines: true,
      });

      if (parsed.errors && parsed.errors.length) {
        throw new Error(`Could not parse "${file.name}" as a tab-separated report.`);
      }

      const fields = parsed.meta.fields || [];
      const type = detectFileType(fields);
      nextState.files.push({ name: file.name, type });

      if (type === "detailedSales") nextState.detailedRows.push(...parsed.data);
      if (type === "subscriber") nextState.subscriberRows.push(...parsed.data);
    } catch (error) {
      setError(error.message);
      return;
    }
  }

  resetState();
  state.files = nextState.files;
  state.detailedRows = nextState.detailedRows;
  state.subscriberRows = nextState.subscriberRows;

  const unknownUploaded = nextState.files.some((f) => f.type === "unknown");
  if (unknownUploaded) {
    setError(
      "One or more files were not recognized. Upload App Store Detailed Sales (S_D_) and Subscriber reports as tab-separated .txt files.",
    );
  }

  updateStatus();
  refreshDashboard();
}

function onDragOver(event) {
  event.preventDefault();
  elements.dropZone.classList.add("border-[#F99A0A]", "bg-[#FFF7EA]");
}

function onDragLeave() {
  elements.dropZone.classList.remove("border-[#F99A0A]", "bg-[#FFF7EA]");
}

function onDrop(event) {
  event.preventDefault();
  onDragLeave();
  handleFiles(event.dataTransfer.files);
}

elements.dropZone.addEventListener("dragover", onDragOver);
elements.dropZone.addEventListener("dragleave", onDragLeave);
elements.dropZone.addEventListener("drop", onDrop);
elements.fileInput.addEventListener("change", (event) => handleFiles(event.target.files));
elements.downloadCsv.addEventListener("click", downloadSummaryCsv);

updateStatus();
refreshDashboard();

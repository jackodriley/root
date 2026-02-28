const state = {
  rawDetailedRows: [],
  rawSubscriberRows: [],
  detailedRows: [],
  subscriberRows: [],
  earningsSummaryRows: [],
  files: [],
  summary: null,
  lookbackDays: null,
  maxDataDate: null,
  job: {
    id: null,
    apiBase: "",
    pollTimer: null,
    status: null,
  },
};

const palette = {
  newsOrange: "#F99A0A",
  culturePurple: "#B5B0D0",
  styleRed: "#FF505A",
  ideasBlue: "#AAD9FF",
  sportGreen: "#A0D0C0",
  foodYellow: "#E0E00A",
  fxBlue: "#6C8EAD",
};

// Fixed for now; can be made live/adjustable later.
const USD_TO_GBP = {
  rate: 0.74231,
  date: "2026-02-27",
  source: "Frankfurter / ECB reference data",
};

const BUILD_INFO = {
  version: "v0.5.0",
  deployedDate: "2026-02-27",
  deployedTime: "16:20 PT",
};

const API_PULL_DEFAULTS = {
  pollIntervalMs: 5000,
  defaultLookbackDays: 30,
};

const elements = {
  dropZone: document.getElementById("drop-zone"),
  fileInput: document.getElementById("file-input"),
  downloadCsv: document.getElementById("download-csv"),
  lookback: document.getElementById("lookback"),
  status: document.getElementById("status"),
  dataWindow: document.getElementById("data-window"),
  error: document.getElementById("error"),
  requestJob: document.getElementById("request-job"),
  refreshJob: document.getElementById("refresh-job"),
  jobStartDate: document.getElementById("job-start-date"),
  jobEndDate: document.getElementById("job-end-date"),
  jobAppId: document.getElementById("job-app-id"),
  jobApiBase: document.getElementById("job-api-base"),
  jobStatus: document.getElementById("job-status"),
  jobMeta: document.getElementById("job-meta"),
  jobError: document.getElementById("job-error"),
  jobSummaryLink: document.getElementById("job-summary-link"),
  jobCsvLink: document.getElementById("job-csv-link"),
  buildVersion: document.getElementById("build-version"),
  buildDate: document.getElementById("build-date"),
  buildTime: document.getElementById("build-time"),
  kpiNew: document.getElementById("kpi-new"),
  kpiRenewal: document.getElementById("kpi-renewal"),
  kpiChurn: document.getElementById("kpi-churn"),
  kpiCash: document.getElementById("kpi-cash"),
  kpiCashGbp: document.getElementById("kpi-cash-gbp"),
  kpiFxNote: document.getElementById("kpi-fx-note"),
  orderTable: document.getElementById("order-table"),
  termTable: document.getElementById("term-table"),
  periodTable: document.getElementById("period-table"),
};

const charts = {
  order: null,
  term: null,
  period: null,
  trend: null,
};

function resetState() {
  state.rawDetailedRows = [];
  state.rawSubscriberRows = [];
  state.detailedRows = [];
  state.subscriberRows = [];
  state.earningsSummaryRows = [];
  state.files = [];
  state.summary = null;
  state.maxDataDate = null;
}

function renderBuildInfo() {
  if (elements.buildVersion) elements.buildVersion.textContent = BUILD_INFO.version;
  if (elements.buildDate) elements.buildDate.textContent = BUILD_INFO.deployedDate;
  if (elements.buildTime) elements.buildTime.textContent = BUILD_INFO.deployedTime;
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

function detectFileType(fields, fileName = "") {
  const normalized = new Set((fields || []).map(normalizeHeader));
  const lowerName = String(fileName || "").toLowerCase();
  const isSubscriber =
    normalized.has("subscriber id") &&
    normalized.has("standard subscription duration") &&
    normalized.has("customer price");
  const isEarningsSummary =
    normalized.has("date") &&
    normalized.has("event") &&
    normalized.has("metric") &&
    normalized.has("time frame");
  const isDetailedSales =
    normalized.has("order type") &&
    normalized.has("period") &&
    normalized.has("units") &&
    normalized.has("customer price");

  if (!isSubscriber && lowerName.startsWith("subscriber_")) return "subscriber";
  if (!isDetailedSales && lowerName.startsWith("s_d_")) return "detailedSales";
  if (!isEarningsSummary && lowerName.startsWith("s_e_d_")) return "earningsSummary";
  if (isSubscriber) return "subscriber";
  if (isDetailedSales) return "detailedSales";
  if (isEarningsSummary) return "earningsSummary";
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

function formatCurrencyGbp(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatInt(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function parseDateValue(raw, formats = []) {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;

  if (formats.includes("mm/dd/yyyy")) {
    const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const [, mm, dd, yyyy] = match;
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    }
  }

  if (formats.includes("yyyy-mm-dd")) {
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return new Date(`${text}T00:00:00Z`);
    }
  }

  const fallback = new Date(text);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function extractDetailedRowDate(row) {
  return parseDateValue(row["End Date"] || row["Begin Date"], ["mm/dd/yyyy", "yyyy-mm-dd"]);
}

function extractSubscriberRowDate(row) {
  return parseDateValue(row["Event Date"] || row["Purchase Date"], ["yyyy-mm-dd", "mm/dd/yyyy"]);
}

function extractEarningsSummaryDate(row) {
  return parseDateValue(row["Date"], ["mm/dd/yyyy", "yyyy-mm-dd"]);
}

function formatDateIso(date) {
  if (!date) return null;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function applyLookback() {
  const allDates = [
    ...state.rawDetailedRows.map(extractDetailedRowDate).filter(Boolean),
    ...state.rawSubscriberRows.map(extractSubscriberRowDate).filter(Boolean),
    ...state.earningsSummaryRows.map(extractEarningsSummaryDate).filter(Boolean),
  ];
  state.maxDataDate = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : null;

  if (!state.lookbackDays || !state.maxDataDate) {
    state.detailedRows = [...state.rawDetailedRows];
    state.subscriberRows = [...state.rawSubscriberRows];
    return;
  }

  const threshold = new Date(state.maxDataDate);
  threshold.setUTCDate(threshold.getUTCDate() - (state.lookbackDays - 1));

  state.detailedRows = state.rawDetailedRows.filter((row) => {
    const date = extractDetailedRowDate(row);
    return date ? date >= threshold : true;
  });
  state.subscriberRows = state.rawSubscriberRows.filter((row) => {
    const date = extractSubscriberRowDate(row);
    return date ? date >= threshold : true;
  });
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

function setJobError(message) {
  if (!elements.jobError) return;
  if (!message) {
    elements.jobError.classList.add("hidden");
    elements.jobError.textContent = "";
    return;
  }
  elements.jobError.textContent = message;
  elements.jobError.classList.remove("hidden");
}

function setJobLink(anchor, href) {
  if (!anchor) return;
  if (!href) {
    anchor.classList.add("hidden");
    anchor.removeAttribute("href");
    return;
  }
  anchor.href = href;
  anchor.classList.remove("hidden");
}

function stopJobPolling() {
  if (state.job.pollTimer) {
    window.clearInterval(state.job.pollTimer);
    state.job.pollTimer = null;
  }
}

function startJobPolling() {
  stopJobPolling();
  state.job.pollTimer = window.setInterval(() => {
    refreshPullJobStatus();
  }, API_PULL_DEFAULTS.pollIntervalMs);
}

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function initJobFormDefaults() {
  if (!elements.jobStartDate || !elements.jobEndDate) return;
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (API_PULL_DEFAULTS.defaultLookbackDays - 1));
  elements.jobEndDate.value = formatDateInput(end);
  elements.jobStartDate.value = formatDateInput(start);
}

function getSelectedReportTypes() {
  return Array.from(document.querySelectorAll(".job-report-type:checked")).map((input) => input.value);
}

function parseJobResponse(payload) {
  if (!payload || typeof payload !== "object") return null;
  const id = payload.job_id || payload.id;
  if (!id) return null;
  const outputs = payload.outputs || {};
  return {
    id,
    status: payload.status || "queued",
    createdAt: payload.created_at || null,
    updatedAt: payload.updated_at || null,
    error: payload.error || null,
    workflowRunId: payload.workflow_run_id || null,
    workflowRunUrl: payload.workflow_run_url || null,
    summaryUrl: outputs.summary_url || payload.summary_url || null,
    csvUrl: outputs.csv_url || payload.csv_url || null,
    dateMin: outputs.date_min || payload.date_min || null,
    dateMax: outputs.date_max || payload.date_max || null,
    rowCount: outputs.row_count ?? payload.row_count ?? null,
  };
}

function renderJobState(job) {
  if (!elements.jobStatus || !elements.jobMeta) return;
  if (!job) {
    elements.jobStatus.textContent = "No job requested yet.";
    elements.jobMeta.textContent = "";
    setJobLink(elements.jobSummaryLink, null);
    setJobLink(elements.jobCsvLink, null);
    return;
  }

  const status = String(job.status || "queued");
  elements.jobStatus.textContent = `Job ${job.id}: ${status}`;
  const details = [];
  if (job.createdAt) details.push(`Created: ${job.createdAt}`);
  if (job.updatedAt) details.push(`Updated: ${job.updatedAt}`);
  if (job.workflowRunId) details.push(`Workflow run: ${job.workflowRunId}`);
  if (job.dateMin && job.dateMax) details.push(`Coverage: ${job.dateMin} to ${job.dateMax}`);
  if (Number.isFinite(job.rowCount)) details.push(`Rows: ${formatInt(job.rowCount)}`);
  elements.jobMeta.textContent = details.join(" | ");
  setJobLink(elements.jobSummaryLink, job.summaryUrl);
  setJobLink(elements.jobCsvLink, job.csvUrl);
  setJobError(job.error || "");
}

function getApiBase() {
  const typed = String(elements.jobApiBase?.value || "").trim();
  if (!typed) return "";
  return typed.replace(/\/+$/, "");
}

function buildJobPayload() {
  const startDate = String(elements.jobStartDate?.value || "").trim();
  const endDate = String(elements.jobEndDate?.value || "").trim();
  const reportTypes = getSelectedReportTypes();
  const appAppleId = String(elements.jobAppId?.value || "").trim();
  return {
    start_date: startDate,
    end_date: endDate,
    report_types: reportTypes,
    app_apple_id: appAppleId || null,
  };
}

function validateJobPayload(payload) {
  if (!payload.start_date || !payload.end_date) {
    return "Start date and end date are required.";
  }
  if (payload.start_date > payload.end_date) {
    return "Start date must be on or before end date.";
  }
  if (!payload.report_types.length) {
    return "Select at least one report type.";
  }
  return "";
}

async function requestPullJob() {
  setJobError("");
  const apiBase = getApiBase();
  if (!apiBase) {
    setJobError("Enter Backend API Base URL first (for example, https://your-broker.example.com).");
    return;
  }
  const payload = buildJobPayload();
  const validationError = validateJobPayload(payload);
  if (validationError) {
    setJobError(validationError);
    return;
  }

  elements.requestJob.disabled = true;
  elements.jobStatus.textContent = "Submitting job request...";

  try {
    const response = await fetch(`${apiBase}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`);
    }
    const body = await response.json();
    const parsed = parseJobResponse(body);
    if (!parsed) {
      throw new Error("Backend response is missing job_id.");
    }
    state.job.id = parsed.id;
    state.job.apiBase = apiBase;
    state.job.status = parsed.status;
    renderJobState(parsed);
    startJobPolling();
    if (parsed.status === "succeeded" || parsed.status === "failed" || parsed.status === "cancelled") {
      stopJobPolling();
    }
  } catch (error) {
    setJobError(error.message || "Could not submit job request.");
    elements.jobStatus.textContent = "Job request failed.";
  } finally {
    elements.requestJob.disabled = false;
  }
}

async function refreshPullJobStatus() {
  setJobError("");
  const apiBase = state.job.apiBase || getApiBase();
  const jobId = state.job.id;
  if (!apiBase || !jobId) return;

  try {
    const response = await fetch(`${apiBase}/api/jobs/${encodeURIComponent(jobId)}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Status check failed with status ${response.status}.`);
    }
    const body = await response.json();
    const parsed = parseJobResponse(body);
    if (!parsed) {
      throw new Error("Backend status response is missing job_id.");
    }
    state.job.status = parsed.status;
    renderJobState(parsed);
    if (parsed.status === "succeeded" || parsed.status === "failed" || parsed.status === "cancelled") {
      stopJobPolling();
    }
  } catch (error) {
    setJobError(error.message || "Could not refresh job status.");
    stopJobPolling();
  }
}

function updateStatus() {
  if (!state.files.length) {
    elements.status.textContent = "No files loaded yet.";
    elements.dataWindow.textContent = "";
    return;
  }
  const detailedCount = state.files.filter((f) => f.type === "detailedSales").length;
  const subscriberCount = state.files.filter((f) => f.type === "subscriber").length;
  const earningsSummaryCount = state.files.filter((f) => f.type === "earningsSummary").length;
  const unknownCount = state.files.filter((f) => f.type === "unknown").length;
  elements.status.textContent =
    `Loaded ${state.files.length} file(s): ${detailedCount} Detailed Sales, ` +
    `${subscriberCount} Subscriber, ${earningsSummaryCount} Earnings Summary, ${unknownCount} Unrecognized.`;

  const latestIso = formatDateIso(state.maxDataDate);
  if (!latestIso) {
    elements.dataWindow.textContent = "No date columns detected in loaded files.";
    return;
  }
  if (!state.lookbackDays) {
    elements.dataWindow.textContent = `Data window: all loaded rows (latest date ${latestIso}).`;
    return;
  }

  const start = new Date(state.maxDataDate);
  start.setUTCDate(start.getUTCDate() - (state.lookbackDays - 1));
  elements.dataWindow.textContent = `Data window: ${formatDateIso(start)} to ${latestIso} (${state.lookbackDays} days).`;
}

function inferSalesBucket(row) {
  const subscription = String(row["Subscription"] || "").trim().toLowerCase();
  const orderType = String(row["Order Type"] || "").trim().toLowerCase();
  const proceedsReason = String(row["Proceeds Reason"] || "").trim().toLowerCase();
  const signal = `${subscription} ${orderType} ${proceedsReason}`;

  const isGraceOrRetry = /grace|retry/.test(signal);
  const isCancellationLike = /cancel|refund|revoke|expired|expire|churn/.test(signal);

  if (subscription === "new" || /\bnew\b/.test(orderType)) return "new";
  if (subscription === "renewal" || /renew/.test(orderType)) return "renewal";
  if (isCancellationLike && !isGraceOrRetry) return "churn";
  return "other";
}

function inferTermFromText(text) {
  const value = String(text || "").trim().toLowerCase();
  if (!value) return null;
  if (value.includes("year") || value.includes("annual") || value.includes("12 month")) return "Annual";
  if (value.includes("month")) return "Monthly";
  if (value.includes("week")) return "Weekly";
  if (value.includes("day")) return "Daily";
  return null;
}

function getSubscriptionTermLabel(row) {
  const fromPeriod = inferTermFromText(row["Period"]);
  if (fromPeriod) return fromPeriod;

  const fromSubscriptionName = inferTermFromText(row["Subscription Name"]);
  if (fromSubscriptionName) return fromSubscriptionName;

  const fromTitle = inferTermFromText(row["Title"]);
  if (fromTitle) return fromTitle;

  const fromSku = inferTermFromText(row["SKU"]);
  if (fromSku) return fromSku;

  return "Other/Unspecified";
}

function isSubscriptionLikeRow(row) {
  const subscription = String(row["Subscription"] || "").trim().toLowerCase();
  if (subscription === "new" || subscription === "renewal") return true;

  const termSignal = getSubscriptionTermLabel(row);
  if (termSignal !== "Other/Unspecified") return true;

  const productType = String(row["Product Type Identifier"] || "").trim().toLowerCase();
  if (/^iay|^iam|^iaw/.test(productType)) return true;

  const title = String(row["Title"] || "").toLowerCase();
  if (title.includes("subscription")) return true;
  return false;
}

function aggregateDetailedSales(rows) {
  let newSubs = 0;
  let renewals = 0;
  let churn = 0;
  let grossCash = 0;
  const typeMap = new Map();
  const dailyMap = new Map();

  for (const row of rows) {
    if (!isSubscriptionLikeRow(row)) continue;

    const units = parseNumber(row["Units"]);
    const customerPrice = parseNumber(row["Customer Price"]);
    const bucket = inferSalesBucket(row);
    const date = extractDetailedRowDate(row);
    const dateKey = formatDateIso(date) || "Unknown Date";
    const termLabel = getSubscriptionTermLabel(row);

    if (bucket === "new") newSubs += units;
    if (bucket === "renewal") renewals += units;
    // Apple billing grace period/retry still grants access; don't treat as churn until explicit cancellation/refund/expiry.
    if (units < 0) churn += Math.abs(units);
    if (bucket === "churn" && units > 0) churn += units;

    grossCash += customerPrice * units;
    typeMap.set(termLabel, (typeMap.get(termLabel) || 0) + units);

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { newUnits: 0, renewalUnits: 0, churnUnits: 0 });
    }
    const day = dailyMap.get(dateKey);
    if (bucket === "new") day.newUnits += units;
    if (bucket === "renewal") day.renewalUnits += units;
    if (units < 0) day.churnUnits += Math.abs(units);
    if (bucket === "churn" && units > 0) day.churnUnits += units;
  }

  return {
    newSubs,
    renewals,
    churn,
    grossCash,
    grossCashGbp: grossCash * USD_TO_GBP.rate,
    typeMap,
    dailyMap,
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

function renderCharts(orderSummary, termMap, typeMap, dailyMap) {
  const orderCtx = document.getElementById("order-chart");
  const termCtx = document.getElementById("term-chart");
  const periodCtx = document.getElementById("period-chart");
  const trendCtx = document.getElementById("trend-chart");

  if (charts.order) charts.order.destroy();
  if (charts.term) charts.term.destroy();
  if (charts.period) charts.period.destroy();
  if (charts.trend) charts.trend.destroy();

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

  const periodEntries = Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1]);
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

  const trendEntries = Array.from(dailyMap.entries())
    .filter(([day]) => day !== "Unknown Date")
    .sort((a, b) => a[0].localeCompare(b[0]));
  charts.trend = new Chart(trendCtx, {
    type: "line",
    data: {
      labels: trendEntries.map(([day]) => day),
      datasets: [
        {
          label: "New",
          data: trendEntries.map(([, metrics]) => metrics.newUnits),
          borderColor: palette.newsOrange,
          backgroundColor: palette.newsOrange,
          tension: 0.25,
        },
        {
          label: "Renewal",
          data: trendEntries.map(([, metrics]) => metrics.renewalUnits),
          borderColor: palette.sportGreen,
          backgroundColor: palette.sportGreen,
          tension: 0.25,
        },
        {
          label: "Churn",
          data: trendEntries.map(([, metrics]) => metrics.churnUnits),
          borderColor: palette.styleRed,
          backgroundColor: palette.styleRed,
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: true } },
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
    `KPIs,Gross Cash Collected (USD),${escapeCsv(state.summary.kpis.grossCashUsd)}`,
    `KPIs,Gross Cash Collected (GBP),${escapeCsv(state.summary.kpis.grossCashGbp)}`,
    `KPIs,USD to GBP Rate (${USD_TO_GBP.date}),${escapeCsv(USD_TO_GBP.rate)}`,
    "",
    "Term Breakdown,Term,Unique Subscribers",
    ...state.summary.terms.map((row) => `${escapeCsv("Term Breakdown")},${escapeCsv(row.term)},${escapeCsv(row.count)}`),
    "",
    "Subscription Term Summary,Term,Units",
    ...state.summary.periods.map(
      (row) => `${escapeCsv("Subscription Term Summary")},${escapeCsv(row.period)},${escapeCsv(row.units)}`,
    ),
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
  elements.kpiCashGbp.textContent = formatCurrencyGbp(orderSummary.grossCashGbp);
  elements.kpiFxNote.textContent = `FX ${USD_TO_GBP.rate} (USD->GBP, ${USD_TO_GBP.date})`;

  renderTable(elements.orderTable, [
    ["Total New Subscribers", formatInt(orderSummary.newSubs)],
    ["Total Renewals", formatInt(orderSummary.renewals)],
    ["Estimated Churn", formatInt(orderSummary.churn)],
    ["Gross Cash Collected (USD)", formatCurrency(orderSummary.grossCash)],
    ["Gross Cash Collected (GBP)", formatCurrencyGbp(orderSummary.grossCashGbp)],
  ]);

  const termEntries = Array.from(termMap.entries()).sort((a, b) => b[1] - a[1]);
  renderTable(
    elements.termTable,
    termEntries.length ? termEntries.map(([term, count]) => [term, formatInt(count)]) : [["No subscriber data yet", "0"]],
  );

  const periodEntries = Array.from(orderSummary.typeMap.entries()).sort((a, b) => b[1] - a[1]);
  renderTable(
    elements.periodTable,
    periodEntries.length ? periodEntries.map(([period, units]) => [period, formatInt(units)]) : [["No sales data yet", "0"]],
  );

  state.summary = {
    kpis: {
      newSubs: formatInt(orderSummary.newSubs),
      renewals: formatInt(orderSummary.renewals),
      churn: formatInt(orderSummary.churn),
      grossCashUsd: formatCurrency(orderSummary.grossCash),
      grossCashGbp: formatCurrencyGbp(orderSummary.grossCashGbp),
    },
    terms: termEntries.map(([term, count]) => ({ term, count: formatInt(count) })),
    periods: periodEntries.map(([period, units]) => ({ period, units: formatInt(units) })),
  };
  setDownloadEnabled(Boolean(state.files.length));

  renderCharts(orderSummary, termMap, orderSummary.typeMap, orderSummary.dailyMap);
}

async function handleFiles(files) {
  setError("");
  const list = Array.from(files || []);
  if (!list.length) return;

  const nextState = {
    rawDetailedRows: [],
    rawSubscriberRows: [],
    earningsSummaryRows: [],
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
      const type = detectFileType(fields, file.name);
      nextState.files.push({ name: file.name, type });

      if (type === "detailedSales") nextState.rawDetailedRows.push(...parsed.data);
      if (type === "subscriber") nextState.rawSubscriberRows.push(...parsed.data);
      if (type === "earningsSummary") nextState.earningsSummaryRows.push(...parsed.data);
    } catch (error) {
      setError(error.message);
      return;
    }
  }

  resetState();
  state.files = nextState.files;
  state.rawDetailedRows = nextState.rawDetailedRows;
  state.rawSubscriberRows = nextState.rawSubscriberRows;
  state.earningsSummaryRows = nextState.earningsSummaryRows;
  applyLookback();

  const unknownUploaded = nextState.files.some((f) => f.type === "unknown");
  if (unknownUploaded) {
    setError(
      "One or more files were not recognized. Upload App Store Detailed Sales (S_D_), Earnings Summary (S_E_D_), and Subscriber reports as tab-separated .txt files.",
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
elements.lookback.addEventListener("change", (event) => {
  const value = event.target.value;
  state.lookbackDays = value === "all" ? null : Number.parseInt(value, 10);
  applyLookback();
  updateStatus();
  refreshDashboard();
});
elements.downloadCsv.addEventListener("click", downloadSummaryCsv);
if (elements.requestJob) {
  elements.requestJob.addEventListener("click", requestPullJob);
}
if (elements.refreshJob) {
  elements.refreshJob.addEventListener("click", refreshPullJobStatus);
}

renderBuildInfo();
initJobFormDefaults();
renderJobState(null);
updateStatus();
refreshDashboard();

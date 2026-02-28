# API Pull Broker Specification

## Purpose
Define the server-side contract for manual, on-demand App Store Connect report pulls initiated from the public dashboard UI.

The public UI:
- Submits a pull request for a date range and report types.
- Polls job status.
- Displays links to generated outputs (summary JSON + detailed CSV).

This spec covers the private repo implementation (broker service + GitHub Actions workflow).

## High-Level Flow
1. User fills request form in public UI and clicks `Request Pull Job`.
2. UI calls broker `POST /api/jobs`.
3. Broker validates payload, creates job record, triggers GitHub Actions workflow in private repo.
4. UI polls `GET /api/jobs/{job_id}`.
5. Workflow fetches daily reports for all dates in range, normalizes and aggregates, writes artifacts to durable storage.
6. Workflow (or broker runner) updates job with output URLs and final status.
7. UI shows links to open summary JSON and download CSV.

## Security Model
- Public UI must **not** contain GitHub credentials.
- Broker stores credentials server-side only:
  - GitHub App installation token or fine-grained PAT.
  - App Store Connect API private key (if used directly by workflow).
- Broker enforces authentication for UI callers (at minimum session auth; ideally role-based).
- Broker returns only pre-signed URLs or access-controlled URLs for outputs.

## API Endpoints

### POST `/api/jobs`
Creates a new pull job.

Request body:
```json
{
  "start_date": "2026-01-01",
  "end_date": "2026-01-31",
  "report_types": [
    "subscription",
    "subscription_event",
    "subscriber",
    "subscription_offer_code_redemption"
  ],
  "app_apple_id": "1441428990"
}
```

Validation rules:
- `start_date` and `end_date` required, format `YYYY-MM-DD`.
- `start_date <= end_date`.
- Max span recommended: 366 days (enforce server-side).
- `report_types` must contain at least 1 allowed value.
- `app_apple_id` optional; if omitted, pull for all configured apps/team scope.

Response (202 Accepted):
```json
{
  "job_id": "job_20260227_8f9b8e5a",
  "status": "queued",
  "created_at": "2026-02-27T16:30:12Z",
  "updated_at": "2026-02-27T16:30:12Z",
  "workflow_run_id": 1357913579,
  "workflow_run_url": "https://github.com/org/private-repo/actions/runs/1357913579",
  "outputs": {}
}
```

### GET `/api/jobs/{job_id}`
Returns the current status and outputs.

Response (200):
```json
{
  "job_id": "job_20260227_8f9b8e5a",
  "status": "running",
  "created_at": "2026-02-27T16:30:12Z",
  "updated_at": "2026-02-27T16:31:25Z",
  "workflow_run_id": 1357913579,
  "workflow_run_url": "https://github.com/org/private-repo/actions/runs/1357913579",
  "error": null,
  "outputs": {
    "summary_url": null,
    "csv_url": null,
    "date_min": null,
    "date_max": null,
    "row_count": null
  }
}
```

Succeeded example:
```json
{
  "job_id": "job_20260227_8f9b8e5a",
  "status": "succeeded",
  "created_at": "2026-02-27T16:30:12Z",
  "updated_at": "2026-02-27T16:34:02Z",
  "workflow_run_id": 1357913579,
  "workflow_run_url": "https://github.com/org/private-repo/actions/runs/1357913579",
  "error": null,
  "outputs": {
    "summary_url": "https://storage.example.com/jobs/job_20260227_8f9b8e5a/summary.json?sig=...",
    "csv_url": "https://storage.example.com/jobs/job_20260227_8f9b8e5a/details.csv?sig=...",
    "date_min": "2026-01-01",
    "date_max": "2026-01-31",
    "row_count": 18452
  }
}
```

Failed example:
```json
{
  "job_id": "job_20260227_8f9b8e5a",
  "status": "failed",
  "created_at": "2026-02-27T16:30:12Z",
  "updated_at": "2026-02-27T16:31:40Z",
  "workflow_run_id": 1357913579,
  "workflow_run_url": "https://github.com/org/private-repo/actions/runs/1357913579",
  "error": "Missing ASC issuer ID for team configuration.",
  "outputs": {}
}
```

## Job State Machine
- `queued`
- `running`
- `succeeded`
- `failed`
- `cancelled`

Terminal states:
- `succeeded`, `failed`, `cancelled`

## GitHub Actions Trigger Contract
Use `workflow_dispatch`.

Workflow inputs:
- `job_id` (string)
- `start_date` (string, `YYYY-MM-DD`)
- `end_date` (string, `YYYY-MM-DD`)
- `report_types_json` (JSON string array)
- `app_apple_id` (string, optional)
- `callback_base_url` (string, optional if broker polls GitHub instead)

Broker trigger request shape (GitHub API):
```json
{
  "ref": "main",
  "inputs": {
    "job_id": "job_20260227_8f9b8e5a",
    "start_date": "2026-01-01",
    "end_date": "2026-01-31",
    "report_types_json": "[\"subscription\",\"subscription_event\",\"subscriber\"]",
    "app_apple_id": "1441428990",
    "callback_base_url": "https://broker.example.com"
  }
}
```

## Workflow Responsibilities
1. Mark job as `running` (via broker callback or broker observing run state).
2. For each date in `[start_date, end_date]` and each selected report type:
   - pull daily report from App Store Connect source.
   - store raw artifact by partition (`raw/{report_type}/dt=YYYY-MM-DD/...`).
3. Parse and normalize into canonical schema.
4. Aggregate requested period metrics for frontend charting:
   - daily new/renewal/churn
   - term summary
   - revenue totals
5. Write outputs:
   - `summary.json` for chart/table rendering
   - `details.csv` for download
6. Upload outputs to durable storage.
7. Update job to `succeeded` with output URLs and metadata.
8. On error, update job `failed` with actionable message.

## Output Contract

### `summary.json`
```json
{
  "job_id": "job_20260227_8f9b8e5a",
  "generated_at": "2026-02-27T16:33:50Z",
  "coverage": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-31"
  },
  "kpis": {
    "new_subs": 1234,
    "renewals": 5678,
    "churn": 321,
    "gross_cash_usd": 123456.78
  },
  "series_daily": [
    { "date": "2026-01-01", "new": 32, "renewal": 205, "churn": 7 }
  ],
  "term_summary": [
    { "term": "Monthly", "units": 2200 },
    { "term": "Annual", "units": 410 }
  ]
}
```

### `details.csv`
- Flat file with report-type-specific detail and normalized columns.
- Must include `report_date` and `report_type` on every row.

## Storage Requirements
- Persist raw files and outputs in object storage.
- Generate signed URLs with expiry (recommended 24h).
- Keep permanent object key even if signed URL expires; broker can re-issue URLs.

## Operational Requirements
- Idempotency key: `job_id`.
- Retries for transient upstream failures (network/API limits).
- Structured logs keyed by `job_id`.
- Expose workflow run URL for debugging.

## UI Compatibility (Already Implemented in Public Repo)
Current frontend expects:
- `POST {API_BASE}/api/jobs`
- `GET {API_BASE}/api/jobs/{job_id}`
- response fields: `job_id` (or `id`), `status`, optional `outputs.summary_url`, `outputs.csv_url`, `outputs.date_min`, `outputs.date_max`, `outputs.row_count`, optional `error`, optional workflow metadata.

## Recommended Next Step in Private Repo
Implement broker first with mocked workflow trigger and mocked job completion, then wire real GitHub workflow and App Store pull logic.

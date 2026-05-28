# K6 Performance Test

Performance and end-to-end test suite for the QuickPizza API and UI using k6.

## Overview

This project contains:

- API performance tests (login, place order, retrieve order)
- Config-driven test profiles (smoke, load, stress, spike, soak)
- Browser + API mixed test scenario using k6 browser module
- Custom metrics and thresholds for authentication and order flow quality

## Project Structure

- `test/e2e/LoginPlaceOrderRetrieveOrder.js`
  - Basic end-to-end API flow.
- `test/e2e/LoginPlaceOrderRetrieveOrderRefactor.js`
  - Refactored e2e flow using profile config from `test-config.json`.
- `test/e2e/test-config.json`
  - Per-profile stages and thresholds.
- `test/e2e/PlaywrightK6.js`
  - Browser (UI) + backend scenario with Web Vitals thresholds.
- `.env`
  - Optional environment values such as BASE_URL.

## Prerequisites

Install the following tools:

- Node.js (for dependency management)
- k6

Install project dependencies:

npm install

## Environment Configuration

Create a root `.env` file (already supported in this project):

BASE_URL=https://quickpizza.grafana.com/api/

Notes:

- `BASE_URL` is optional for `LoginPlaceOrderRetrieveOrderRefactor.js` because it has a default fallback.
- `npm run k6:e2e` loads `.env` automatically.

## Running Tests

### 1. Basic e2e API flow

Run via npm (loads `.env`):

npm run k6:e2e

Or run directly with explicit env var:

k6 run ./test/e2e/LoginPlaceOrderRetrieveOrder.js -e BASE_URL=https://quickpizza.grafana.com/api/

### 2. Refactored config-driven e2e flow

Smoke profile:

k6 run ./test/e2e/LoginPlaceOrderRetrieveOrderRefactor.js -e TEST_TYPE=smoke

Other profiles:

k6 run ./test/e2e/LoginPlaceOrderRetrieveOrderRefactor.js -e TEST_TYPE=load
k6 run ./test/e2e/LoginPlaceOrderRetrieveOrderRefactor.js -e TEST_TYPE=stress
k6 run ./test/e2e/LoginPlaceOrderRetrieveOrderRefactor.js -e TEST_TYPE=spike
k6 run ./test/e2e/LoginPlaceOrderRetrieveOrderRefactor.js -e TEST_TYPE=soak

Optional explicit base URL:

k6 run ./test/e2e/LoginPlaceOrderRetrieveOrderRefactor.js -e TEST_TYPE=smoke -e BASE_URL=https://quickpizza.grafana.com/api/

### 3. Browser + API scenario

k6 run ./test/e2e/PlaywrightK6.js

This script includes:

- UI scenario (`k6/browser`) for login flow checks
- Backend scenario for API response checks
- Web Vitals thresholds such as FCP, LCP, CLS, and TTFB

## Test Profiles

Profiles are defined in `test/e2e/test-config.json`:

- smoke: quick confidence run
- load: gradual user growth to high traffic
- stress: aggressive ramp-up to find limits
- spike: sudden traffic jumps
- soak: sustained long-duration traffic

## Metrics and Thresholds

This project validates:

- Request success/failure (`http_req_failed`)
- Assertions (`checks`)
- Group durations (`group_duration{group:::...}`)
- Custom metrics:
  - `authentication_rate`
  - `order_id_counter`
- Browser vitals in browser test:
  - `browser_web_vital_fcp`
  - `browser_web_vital_lcp`
  - `browser_web_vital_cls`
  - `browser_web_vital_ttfb`

## Troubleshooting

### Error: unknown field "thresholds"

Cause:

- Thresholds defined in an unsupported nested object.

Fix:

- Keep `thresholds` at the top-level `options` object.

### Error: invalid character '/'

Cause:

- JSON comments inside `test-config.json`.

Fix:

- Remove comments from JSON files.

### Error: unsupported protocol scheme ""

Cause:

- `BASE_URL` is missing and URL becomes invalid.

Fix:

- Set `BASE_URL` in `.env` or pass with `-e BASE_URL=...`.

### Error: body is null so we can't transform it to JSON

Cause:

- Calling `.json()` on a failed response with empty/null body.

Fix:

- Add response/body guards before parsing JSON.

## CI/CD Suggestion

For GitHub Actions, run smoke profile on pull requests and load profile on scheduled runs:

- PR checks: `TEST_TYPE=smoke`
- Nightly checks: `TEST_TYPE=load`

## License

ISC

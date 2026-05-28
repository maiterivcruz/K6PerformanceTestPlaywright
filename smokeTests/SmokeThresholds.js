import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metric trends for threshold enforcement
const loginDuration = new Trend('login_duration', true);
const orderCreateDuration = new Trend('order_create_duration', true);
const orderRetrieveDuration = new Trend('order_retrieve_duration', true);
const errorRate = new Rate('error_rate');

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    // HTTP built-in thresholds
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(90)<1500', 'p(95)<2000', 'p(99)<3000'],

    // Custom metric thresholds
    login_duration: ['p(95)<2000'],
    order_create_duration: ['p(95)<3000'],
    order_retrieve_duration: ['p(95)<2000'],
    error_rate: ['rate<0.01'],

    // Check pass rate
    checks: ['rate>0.99'],
  },
};

const BASE_URL = 'https://test-api.k6.io';
const USERNAME = 'TestUser';
const PASSWORD = 'SuperCroc2019';

export default function () {
  // Step 1: Login with threshold tracking
  const loginRes = http.post(
    BASE_URL + '/user/login/',
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginOk = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 2000ms': (r) => r.timings.duration < 2000,
    'login returns access token': (r) => r.json('access') !== '',
  });

  loginDuration.add(loginRes.timings.duration);
  errorRate.add(!loginOk);

  const authToken = loginRes.json('access');
  const authHeaders = {
    headers: {
      Authorization: 'Bearer ' + authToken,
      'Content-Type': 'application/json',
    },
  };

  sleep(1);

  // Step 2: Place an order with threshold tracking
  const orderPayload = JSON.stringify({
    product_id: 'a-188-40g-drt',
    quantity: 1,
  });

  const orderRes = http.post(BASE_URL + '/my/orders/', orderPayload, authHeaders);

  const orderOk = check(orderRes, {
    'order status is 201': (r) => r.status === 201,
    'order response time < 3000ms': (r) => r.timings.duration < 3000,
    'order has an id': (r) => r.json('id') !== undefined,
  });

  orderCreateDuration.add(orderRes.timings.duration);
  errorRate.add(!orderOk);

  sleep(1);

  // Step 3: Retrieve orders with threshold tracking
  const retrieveRes = http.get(BASE_URL + '/my/orders/', authHeaders);

  const retrieveOk = check(retrieveRes, {
    'retrieve orders status is 200': (r) => r.status === 200,
    'retrieve orders response time < 2000ms': (r) => r.timings.duration < 2000,
    'retrieve orders returns results': (r) => r.json('results') !== undefined,
  });

  orderRetrieveDuration.add(retrieveRes.timings.duration);
  errorRate.add(!retrieveOk);

  sleep(1);
}

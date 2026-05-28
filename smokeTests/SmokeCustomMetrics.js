import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';

// Custom metrics
const loginSuccessCount = new Counter('login_success_count');
const orderSuccessCount = new Counter('order_success_count');
const loginFailureRate = new Rate('login_failure_rate');
const orderFailureRate = new Rate('order_failure_rate');
const loginDuration = new Trend('login_duration', true);
const orderDuration = new Trend('order_duration', true);
const activeUsers = new Gauge('active_users');

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    login_success_count: ['count>0'],
    login_failure_rate: ['rate<0.01'],
    order_failure_rate: ['rate<0.01'],
    login_duration: ['p(95)<2000'],
    order_duration: ['p(95)<2000'],
  },
};

const BASE_URL = 'https://test-api.k6.io';
const USERNAME = 'TestUser';
const PASSWORD = 'SuperCroc2019';

export default function () {
  activeUsers.add(1);

  // Login and track custom metrics
  const loginRes = http.post(
    BASE_URL + '/user/login/',
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns access token': (r) => r.json('access') !== '',
  });

  loginDuration.add(loginRes.timings.duration);

  if (loginSuccess) {
    loginSuccessCount.add(1);
    loginFailureRate.add(false);
  } else {
    loginFailureRate.add(true);
  }

  const authToken = loginRes.json('access');
  const authHeaders = {
    headers: {
      Authorization: 'Bearer ' + authToken,
      'Content-Type': 'application/json',
    },
  };

  sleep(1);

  // Place order and track custom metrics
  const orderPayload = JSON.stringify({
    product_id: 'a-188-40g-drt',
    quantity: 1,
  });

  const orderRes = http.post(BASE_URL + '/my/orders/', orderPayload, authHeaders);

  const orderSuccess = check(orderRes, {
    'order status is 201': (r) => r.status === 201,
    'order has an id': (r) => r.json('id') !== undefined,
  });

  orderDuration.add(orderRes.timings.duration);

  if (orderSuccess) {
    orderSuccessCount.add(1);
    orderFailureRate.add(false);
  } else {
    orderFailureRate.add(true);
  }

  sleep(1);

  activeUsers.add(-1);
}

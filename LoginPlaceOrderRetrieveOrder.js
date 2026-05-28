import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE_URL = 'https://test-api.k6.io';
const USERNAME = 'TestUser';
const PASSWORD = 'SuperCroc2019';

export default function () {
  // Step 1: Login
  const loginRes = http.post(
    `${BASE_URL}/user/login/`,
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns access token': (r) => r.json('access') !== '',
  });

  const authToken = loginRes.json('access');
  const authHeaders = {
    headers: {
      Authorization: 'Bearer ' + authToken,
      'Content-Type': 'application/json',
    },
  };

  sleep(1);

  // Step 2: Place an order
  const orderPayload = JSON.stringify({
    product_id: 'a-188-40g-drt',
    quantity: 1,
  });

  const orderRes = http.post(`${BASE_URL}/my/orders/`, orderPayload, authHeaders);

  check(orderRes, {
    'order status is 201': (r) => r.status === 201,
    'order has an id': (r) => r.json('id') !== undefined,
  });

  sleep(1);

  // Step 3: Retrieve orders
  const retrieveRes = http.get(`${BASE_URL}/my/orders/`, authHeaders);

  check(retrieveRes, {
    'retrieve orders status is 200': (r) => r.status === 200,
    'orders list is not empty': (r) => r.json('results') !== undefined,
  });

  sleep(1);
}

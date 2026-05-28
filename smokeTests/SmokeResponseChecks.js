import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    checks: ['rate>0.99'],
  },
};

const BASE_URL = 'https://test-api.k6.io';
const USERNAME = 'TestUser';
const PASSWORD = 'SuperCroc2019';

export default function () {
  // Login request and response checks
  const loginRes = http.post(
    BASE_URL + '/user/login/',
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login: status is 200': (r) => r.status === 200,
    'login: response time < 2000ms': (r) => r.timings.duration < 2000,
    'login: body is not empty': (r) => r.body !== null && r.body.length > 0,
    'login: returns access token': (r) => r.json('access') !== '',
    'login: returns refresh token': (r) => r.json('refresh') !== '',
  });

  const authToken = loginRes.json('access');
  const authHeaders = {
    headers: {
      Authorization: 'Bearer ' + authToken,
      'Content-Type': 'application/json',
    },
  };

  sleep(1);

  // Retrieve orders response checks
  const retrieveRes = http.get(BASE_URL + '/my/orders/', authHeaders);

  check(retrieveRes, {
    'retrieve orders: status is 200': (r) => r.status === 200,
    'retrieve orders: response time < 2000ms': (r) => r.timings.duration < 2000,
    'retrieve orders: body is not empty': (r) => r.body !== null && r.body.length > 0,
    'retrieve orders: results key exists': (r) => r.json('results') !== undefined,
  });

  sleep(1);
}

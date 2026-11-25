import http from 'k6/http';
import { check } from 'k6';

// Many dashboards open at once: each virtual user holds one connection to the
// live-update stream, and a second scenario measures whether ordinary
// dashboard reads still answer while those connections stay open.
//
// STREAMS sets how many connections to hold, HOLD how long each one stays
// open. k6 has no streaming reader for Server-Sent Events, so every stream
// request ends in a client timeout after HOLD; those are excluded from the
// failure rate, which only counts the probe requests.
const baseUrl = __ENV.BASE_URL || 'http://localhost:8082';
const streams = Number(__ENV.STREAMS || 200);
const hold = __ENV.HOLD || '60s';

export const options = {
  scenarios: {
    streams: {
      executor: 'ramping-vus',
      exec: 'stream',
      startVUs: 0,
      stages: [
        { duration: '30s', target: streams },
        { duration: '1m30s', target: streams },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '0s',
    },
    probe: {
      executor: 'constant-arrival-rate',
      exec: 'probe',
      rate: 5,
      timeUnit: '1s',
      duration: '2m10s',
      preAllocatedVUs: 10,
      maxVUs: 50,
    },
  },
  thresholds: {
    'http_req_failed{scenario:probe}': ['rate<0.01'],
    'http_req_duration{scenario:probe}': ['p(95)<500'],
  },
};

export function setup() {
  const email = __ENV.STAFF_EMAIL || 'ashton.blackwell@ichbinhier.online';
  const password = __ENV.STAFF_PASSWORD;
  if (!password) {
    throw new Error('Set STAFF_PASSWORD to the password of STAFF_EMAIL.');
  }
  const response = http.post(
    `${baseUrl}/api/v1/staff/session`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (response.status !== 200) {
    throw new Error(`Sign-in answered ${response.status}`);
  }
  return { cookie: `ibh_session=${response.cookies.ibh_session[0].value}` };
}

export function stream(data) {
  http.get(`${baseUrl}/api/v1/staff/events`, {
    headers: { Cookie: data.cookie, Accept: 'text/event-stream' },
    timeout: hold,
    tags: { name: 'GET /api/v1/staff/events' },
    responseCallback: http.expectedStatuses(0, 200),
  });
}

export function probe(data) {
  const response = http.get(`${baseUrl}/api/v1/staff/categories`, {
    headers: { Cookie: data.cookie },
    tags: { name: 'GET /api/v1/staff/categories' },
  });
  check(response, { 'categories 200 while streams are open': (r) => r.status === 200 });
}

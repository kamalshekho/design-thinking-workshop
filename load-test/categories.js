import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 10 },
    { duration: '20s', target: 10 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate==1'],
  },
};

export default function () {
  const response = http.get('http://localhost:8081/api/v1/categories', {
    tags: { name: 'GET /api/v1/categories' },
  });

  check(response, {
    'HTTP 200': (r) => r.status === 200,
    'Kategorienliste vorhanden': (r) => {
      try {
        return Array.isArray(r.json('categories'));
      } catch (_) {
        return false;
      }
    },
  });
  sleep(1);
}

import http from 'k6/http';
import { check, sleep } from 'k6';
import { pause, shape, thresholds } from './lib/profile.js';

// The staff path: the lists the dashboard loads on every visit.
//
// Signs in once in setup() and hands the cookie to every virtual user, because
// sign-in locks an address out after five failures in 15 minutes and every VU
// shares one address. The cookie is Secure, which k6's cookie jar will not
// send over plain HTTP, so the script sets the Cookie header itself.
const baseUrl = __ENV.BASE_URL || 'http://localhost:8082';


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

  const cookie = response.cookies.ibh_session;
  if (!cookie || cookie.length === 0) {
    throw new Error('Sign-in set no ibh_session cookie');
  }
  return { cookie: `ibh_session=${cookie[0].value}` };
}

const paths = [
  '/api/v1/staff/applications',
  '/api/v1/staff/categories',
  '/api/v1/staff/applications/changes',
];

// One threshold per path as well, so the summary shows which list is slow.
export const options = {
  ...shape(),
  thresholds: {
    ...thresholds,
    ...Object.fromEntries(
      paths.map((path) => [`http_req_duration{name:GET ${path}}`, ['p(95)<500']]),
    ),
  },
};

export default function (data) {
  for (const path of paths) {
    const response = http.get(`${baseUrl}${path}`, {
      headers: { Cookie: data.cookie },
      tags: { name: `GET ${path}` },
    });
    check(response, { [`${path} 200`]: (r) => r.status === 200 });
  }
  sleep(pause);
}

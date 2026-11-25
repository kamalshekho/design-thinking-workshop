// Load shapes shared by every scenario. TEST_TYPE picks one; RATE sets the
// peak in iterations per second where the shape has one. None of these numbers
// is an expected load: the association's real volume is unknown (A4, A31).
//
// smoke is one virtual user that pauses between iterations. stress and spike
// are open models: k6 starts iterations at the given rate whether or not the
// earlier ones have finished, so a slow server shows up as rising latency and
// dropped iterations instead of quietly lowering the load.

const rate = Number(__ENV.RATE || 400);

function arrival(stages) {
  return {
    scenarios: {
      [testType]: {
        executor: 'ramping-arrival-rate',
        startRate: 0,
        timeUnit: '1s',
        preAllocatedVUs: 50,
        maxVUs: Number(__ENV.MAX_VUS || 1000),
        stages,
      },
    },
  };
}

export const testType = __ENV.TEST_TYPE || 'smoke';

const profiles = {
  smoke: () => ({ vus: 1, duration: '30s' }),
  stress: () =>
    arrival([
      { duration: '30s', target: Math.round(rate / 8) },
      { duration: '1m', target: Math.round(rate / 8) },
      { duration: '30s', target: Math.round(rate / 4) },
      { duration: '1m', target: Math.round(rate / 4) },
      { duration: '30s', target: Math.round(rate / 2) },
      { duration: '1m', target: Math.round(rate / 2) },
      { duration: '30s', target: rate },
      { duration: '1m', target: rate },
      { duration: '30s', target: 0 },
    ]),
  spike: () =>
    arrival([
      { duration: '30s', target: Math.round(rate / 20) },
      { duration: '10s', target: rate },
      { duration: '1m', target: rate },
      { duration: '10s', target: Math.round(rate / 20) },
      { duration: '30s', target: Math.round(rate / 20) },
    ]),
};

export function shape() {
  const profile = profiles[testType];
  if (!profile) {
    throw new Error(`TEST_TYPE must be one of ${Object.keys(profiles).join(', ')}, got ${testType}`);
  }
  return profile();
}

// Pause only where a virtual user stands for a person; the open models set
// their own pace.
export const pause = testType === 'smoke' ? 1 : 0;

// Every request below 500 ms at p95 and fewer than 1 % failures. A run that
// misses either one fails, so k6 exits non-zero.
export const thresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<500'],
  checks: ['rate>0.99'],
};

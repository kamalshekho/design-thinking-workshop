---
status: accepted
---

# The dashboard reads live changes from one Server-Sent Events stream

Up to five staff members (`A1`) work the same list of Applications, and
ownership is the only signal that a human has taken one on (`A14`). A dashboard
that is only correct immediately after a reload therefore lets two people claim
the same Application without either seeing the other.

**Decision:** the backend exposes one `text/event-stream` endpoint,
`GET /api/v1/staff/events`, carrying `application.created`,
`application.updated` and `application.deleted`. Each event carries the full
Application, so a client applies it without a follow-up request. The stream is
authenticated by the same Sign-in cookie as every other dashboard endpoint. The
server does not honour `Last-Event-ID` and keeps no replay buffer: on every
`open`, the dashboard refetches the whole list, which is what actually
guarantees a correct state. There is no polling fallback — the dashboard shows
whether the stream is connected instead (`A18`).

**Why not polling:** it is the obvious alternative and it was rejected on
latency rather than cost. The demo's central moment is a form submission
appearing in the dashboard while the audience watches; a thirty-second interval
makes that moment arrive late, and a two-second interval is a request storm for
data that rarely changes. SSE also needs no new transport: it is plain HTTP,
one direction, which is all the dashboard needs — it sends changes by `PATCH`,
not through the socket. WebSockets would add a protocol upgrade, its own
authentication story and a heartbeat we would have to write, in exchange for an
upstream channel nothing uses.

**Consequences worth naming:** an `EventSource` cannot set request headers, so
the Sign-in must travel as a cookie — this is why ADR-level authentication is a
server-side cookie rather than a bearer token. Any reverse proxy in front of
the dashboard must disable response buffering and raise its read timeout for
this path, or events arrive in batches instead of immediately; the stream sends
a comment heartbeat every 20 seconds so that a dead connection is noticed in
seconds rather than at the proxy's timeout.

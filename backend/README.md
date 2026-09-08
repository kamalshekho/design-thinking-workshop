# Backend

Spring Boot service backing the applicant form and the staff dashboard. See
[`../AGENTS.md`](../AGENTS.md) for repo-wide conventions.

## Transactional email

The confirmation email an applicant gets on submit (`A8` in
[`../docs/ASSUMPTIONS.md`](../docs/ASSUMPTIONS.md)) goes through
[Resend](https://resend.com). `email/ResendEmailSender.java` calls their HTTP
API directly — no SDK dependency, the API is one POST request.

Without `RESEND_API_KEY` set, `email/NoopEmailSender.java` takes over
automatically and logs the email instead of sending it. Local development and
the test suite need nothing configured.

**To send real email:**

1. Sign up at [resend.com](https://resend.com), free tier is enough for this
   project's volume.
2. Create an API key in the dashboard and set it as `RESEND_API_KEY` in `.env`
   (see `.env.example`) — never commit the key itself.
3. That's it for a demo. Sending works immediately from
   `onboarding@resend.dev`, but **only to the email address on the Resend
   account itself** — good enough to show the flow with your own inbox.
4. To send to any address (what a real deployment needs), verify a domain in
   Resend: add the DNS records it shows you, wait for verification, then set
   `RESEND_FROM=noreply@your-domain` in `.env`. Until the branding question
   with the association is settled, use a neutral domain, not
   `ichbinhier.*` — see the reply to Paula's email for context.

Both `resend.api-key` and `resend.from` are read from environment variables in
`application.properties`; nothing provider-specific lives outside the `email`
package.

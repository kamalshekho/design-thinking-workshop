package de.ichbinhier.volunteerformservice.email;

import org.springframework.context.annotation.Conditional;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

// Stands in for ResendEmailSender whenever resend.api-key is unset — local
// development and tests, mainly. Logs instead of sending, so the confirmation
// flow stays exercisable without a real API key or without spending quota.
@Slf4j
@Component
@Conditional(HasResendApiKey.NotSet.class)
public class NoopEmailSender implements EmailSender {

    @Override
    public void send(String toAddress, String subject, String htmlBody) {
        log.info("Email not sent (no RESEND_API_KEY configured) — to={}, subject={}", toAddress, subject);
    }

}

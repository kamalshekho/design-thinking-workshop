package de.ichbinhier.volunteerformservice.email;

import org.springframework.context.annotation.Conditional;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

// Stands in for ResendEmailSender whenever resend.api-key is unset — local
// development and tests, mainly. Logs instead of sending, so the confirmation
// flow stays exercisable without a real API key or without spending quota.
//
// The recipient stays out of the log: it is an applicant's address, and a log
// is kept and copied with less care than the database. ConfirmationMailer logs
// the Application's id, which is enough to find the row.
@Slf4j
@Component
@Conditional(HasResendApiKey.NotSet.class)
public class NoopEmailSender implements EmailSender {

    @Override
    public void send(String toAddress, String subject, String htmlBody) {
        log.info("Email not sent (no RESEND_API_KEY configured), subject={}", subject);
    }

}

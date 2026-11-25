package de.ichbinhier.volunteerformservice.email;

import java.nio.charset.StandardCharsets;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.context.annotation.Conditional;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

// Sends transactional email via SMTP (Mailpit in local Compose) whenever
// spring.mail.host is configured and no RESEND_API_KEY is set.
@Component
@Conditional(HasResendApiKey.SmtpConfigured.class)
public class SmtpEmailSender implements EmailSender {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public SmtpEmailSender(JavaMailSender mailSender, ResendProperties properties) {
        this.mailSender = mailSender;
        this.fromAddress = properties.getFrom();
    }

    @Override
    public void send(String toAddress, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress);
            helper.setTo(toAddress);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException exception) {
            throw new MailSendException("Failed to build SMTP email", exception);
        }
    }

}

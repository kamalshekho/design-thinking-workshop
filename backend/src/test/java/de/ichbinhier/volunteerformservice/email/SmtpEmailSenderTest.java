package de.ichbinhier.volunteerformservice.email;

import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SmtpEmailSenderTest {

    @Test
    void sendsHtmlMessageWithConfiguredFromAddress() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        ResendProperties properties = new ResendProperties();
        properties.setFrom("ichbinhier <onboarding@ichbinhier.online>");

        SmtpEmailSender sender = new SmtpEmailSender(mailSender, properties);
        sender.send("applicant@example.org", "Willkommen", "<p>Hallo Welt</p>");

        verify(mailSender).send(mimeMessage);
        assertThat(mimeMessage.getFrom()[0].toString())
                .contains("onboarding@ichbinhier.online");
        assertThat(mimeMessage.getRecipients(Message.RecipientType.TO)[0].toString())
                .isEqualTo("applicant@example.org");
        assertThat(mimeMessage.getSubject()).isEqualTo("Willkommen");
        assertThat(mimeMessage.getContent()).isEqualTo("<p>Hallo Welt</p>");
    }

    @Test
    void wrapsMessagingExceptionInMailSendException() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MessagingException("broken header")).when(mimeMessage).setFrom(any(jakarta.mail.Address.class));

        ResendProperties properties = new ResendProperties();
        properties.setFrom("onboarding@ichbinhier.online");

        SmtpEmailSender sender = new SmtpEmailSender(mailSender, properties);

        assertThatThrownBy(() -> sender.send("applicant@example.org", "Willkommen", "<p>Hi</p>"))
                .isInstanceOf(MailSendException.class)
                .hasMessageContaining("Failed to build SMTP email");
    }

}

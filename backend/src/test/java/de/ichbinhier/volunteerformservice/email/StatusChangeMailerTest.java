package de.ichbinhier.volunteerformservice.email;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import de.ichbinhier.volunteerformservice.application.domain.ApplicationStatus;
import de.ichbinhier.volunteerformservice.onboarding.OnboardingProperties;

class StatusChangeMailerTest {

    @Test
    void sendsAcceptanceEmailWithEscapedNameAndOnboardingLinkOnAccepted() {
        EmailSender sender = mock(EmailSender.class);
        OnboardingProperties properties = new OnboardingProperties();
        properties.setBaseUrl("http://localhost:8081");
        StatusChangeMailer mailer = new StatusChangeMailer(sender, properties);

        mailer.sendStatusChange(new ApplicationStatusChanged(
                UUID.randomUUID(),
                "anna@example.org",
                "Anna <Test>",
                ApplicationStatus.ACCEPTED,
                "secret-token-123"));

        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(sender).send(
                eq("anna@example.org"),
                eq("Willkommen bei ichbinhier: deine nächsten Schritte"),
                bodyCaptor.capture());

        String body = bodyCaptor.getValue();
        assertThat(body).contains("Anna &lt;Test&gt;");
        assertThat(body).contains("http://localhost:8081/onboarding/secret-token-123");
        assertThat(body).contains("href=\"http://localhost:8081/onboarding/secret-token-123\"");
        assertThat(body).contains("persönlich");
    }

    @Test
    void sendsGeneralStatusEmailForOtherStatuses() {
        EmailSender sender = mock(EmailSender.class);
        OnboardingProperties properties = new OnboardingProperties();
        StatusChangeMailer mailer = new StatusChangeMailer(sender, properties);

        mailer.sendStatusChange(new ApplicationStatusChanged(
                UUID.randomUUID(),
                "anna@example.org",
                "Anna",
                ApplicationStatus.IN_REVIEW,
                null));

        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(sender).send(
                eq("anna@example.org"),
                eq("Neuigkeiten zu deiner Bewerbung bei ichbinhier"),
                bodyCaptor.capture());

        assertThat(bodyCaptor.getValue()).contains("In Prüfung");
    }
}

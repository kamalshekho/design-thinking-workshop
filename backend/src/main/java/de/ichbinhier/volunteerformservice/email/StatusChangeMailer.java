package de.ichbinhier.volunteerformservice.email;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.HtmlUtils;

import de.ichbinhier.volunteerformservice.application.domain.ApplicationStatus;
import de.ichbinhier.volunteerformservice.onboarding.OnboardingProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
class StatusChangeMailer {

    private final EmailSender sender;
    private final OnboardingProperties onboardingProperties;

    @TransactionalEventListener
    void sendStatusChange(ApplicationStatusChanged change) {
        if (change.status() == ApplicationStatus.ACCEPTED) {
            sendAcceptanceEmail(change);
            return;
        }
        String body = """
                <p>Hallo %s,</p>
                <p>der Status deiner Bewerbung hat sich geändert.</p>
                <p>Aktueller Status: <strong>%s</strong></p>
                <p>Viele Grüße<br>Dein #ichbinhier-Team</p>
                """.formatted(HtmlUtils.htmlEscape(change.name()), labelFor(change.status()));
        deliver(change.applicationId(), change.email(),
                "Neuigkeiten zu deiner Bewerbung bei ichbinhier", body, "Status");
    }

    private void sendAcceptanceEmail(ApplicationStatusChanged change) {
        if (change.onboardingToken() == null || change.onboardingToken().isBlank()) {
            log.warn("Acceptance email skipped: missing onboarding token for application {}",
                    change.applicationId());
            return;
        }
        String link = onboardingProperties.linkFor(change.onboardingToken());
        String escapedLink = HtmlUtils.htmlEscape(link);
        String body = """
                <p>Hallo %s,</p>
                <p>wir freuen uns sehr, dich im Team von #ichbinhier willkommen zu heißen! \
                Auf deiner persönlichen Onboarding-Seite findest du unsere Regeln und deine nächsten Schritte.</p>
                <p><a href="%s" style="display:inline-block;padding:12px 20px;background-color:#d8232a;color:#ffffff;text-decoration:none;border-radius:4px;">Zum Online-Onboarding</a></p>
                <p>Falls der Button nicht funktioniert, öffne diesen Link direkt im Browser:<br>%s</p>
                <p>Hinweis: Dieser Link ist persönlich für dich bestimmt. Bitte gib ihn nicht an andere weiter.</p>
                <p>Viele Grüße<br>Dein #ichbinhier-Team</p>
                """.formatted(HtmlUtils.htmlEscape(change.name()), escapedLink, escapedLink);
        deliver(change.applicationId(), change.email(),
                "Willkommen bei ichbinhier: deine nächsten Schritte", body, "Acceptance");
    }

    private void deliver(UUID applicationId, String toAddress, String subject, String body, String kind) {
        try {
            sender.send(toAddress, subject, body);
            log.info("{} email handed to the sender for application {}", kind, applicationId);
        } catch (RuntimeException exception) {
            log.warn("{} email failed for application {}", kind, applicationId, exception);
        }
    }

    private static String labelFor(ApplicationStatus status) {
        return switch (status) {
            case NEW -> "Neu";
            case IN_REVIEW -> "In Prüfung";
            case INTRO_BOOKED -> "Info-Runde gebucht";
            case ACCEPTED -> "Angenommen";
            case ACTIVE -> "Aktiv";
            case WAITLISTED -> "Warteliste";
            case DECLINED -> "Abgelehnt";
        };
    }

}

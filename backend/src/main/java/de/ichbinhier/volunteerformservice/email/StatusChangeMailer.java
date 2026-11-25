package de.ichbinhier.volunteerformservice.email;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.HtmlUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
class StatusChangeMailer {

    private final EmailSender sender;

    @TransactionalEventListener
    void sendStatusChange(ApplicationStatusChanged change) {
        String status = switch (change.status()) {
            case NEW -> "Neu";
            case IN_REVIEW -> "In Prüfung";
            case INTRO_BOOKED -> "Info-Runde gebucht";
            case ACTIVE -> "Aktiv";
            case WAITLISTED -> "Warteliste";
            case DECLINED -> "Abgelehnt";
        };
        String body = """
                <p>Hallo %s,</p>
                <p>der Status deiner Bewerbung hat sich geändert.</p>
                <p>Aktueller Status: <strong>%s</strong></p>
                <p>Viele Grüße<br>Dein #ichbinhier-Team</p>
                """.formatted(HtmlUtils.htmlEscape(change.name()), status);
        try {
            sender.send(change.email(), "Neuigkeiten zu deiner Bewerbung bei ichbinhier", body);
            log.info("Status email handed to the sender for application {}", change.applicationId());
        } catch (RuntimeException exception) {
            log.warn("Status email failed for application {}", change.applicationId(), exception);
        }
    }
}

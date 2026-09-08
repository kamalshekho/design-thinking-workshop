package de.ichbinhier.volunteerformservice.email;

import org.springframework.stereotype.Component;

import de.ichbinhier.volunteerformservice.application.Application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/*
 * Sends the instant confirmation an Application receives on submit (A8: an
 * applicant left waiting for weeks stops being an applicant, so no one hears
 * silence). Applicant-facing text is German (AGENTS.md, "Language split").
 *
 * The category-specific next step this text still owes the applicant — an
 * intro session date, or the individual appointment Rechtliche Unterstützung
 * gets instead — has no backend data model yet. Naming a step we cannot
 * back with real data would be worse than a plain acknowledgement, so this
 * stays generic until that model exists.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ConfirmationMailer {

    private final EmailSender sender;


    // The Application is already committed by the time this runs (see
    // ApplicationService.submit). A mail provider hiccup — a timeout, a bad
    // key, Resend itself being down — must never turn into a 500 for an
    // applicant whose data is safely stored; it would look like the
    // submission failed and invite a duplicate attempt. So failures here are
    // logged, not thrown.
    public void sendConfirmation(Application application) {
        String subject = "Deine Bewerbung bei ichbinhier ist da";
        String body = """
                <p>Hallo %s,</p>
                <p>wir haben deine Bewerbung im Bereich &bdquo;%s&ldquo; erhalten. \
                Wir melden uns bei dir, sobald es weitergeht.</p>
                <p>Vielen Dank f&uuml;r dein Interesse!<br>Dein #ichbinhier-Team</p>
                """.formatted(application.getName(), application.getCategory().getName());

        try {
            sender.send(application.getEmail(), subject, body);
        } catch (RuntimeException exception) {
            log.warn("Confirmation email failed for application {}", application.getId(), exception);
        }
    }

}

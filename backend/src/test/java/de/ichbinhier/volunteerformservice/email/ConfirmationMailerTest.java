package de.ichbinhier.volunteerformservice.email;

import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;

import de.ichbinhier.volunteerformservice.application.domain.Application;
import de.ichbinhier.volunteerformservice.category.domain.Category;

class ConfirmationMailerTest {

    @Test
    void escapesApplicantAndCategoryNamesInHtml() {
        EmailSender sender = mock(EmailSender.class);
        Application application = Application.builder()
                .name("Anna <Test>")
                .email("anna@example.org")
                .category(Category.builder().name("Medien & Technik").build())
                .build();

        new ConfirmationMailer(sender).sendConfirmation(application);

        verify(sender).send(eq("anna@example.org"), eq("Deine Bewerbung bei ichbinhier ist da"),
                contains("Anna &lt;Test&gt;"));
        verify(sender).send(eq("anna@example.org"), eq("Deine Bewerbung bei ichbinhier ist da"),
                contains("Medien &amp; Technik"));
    }
}

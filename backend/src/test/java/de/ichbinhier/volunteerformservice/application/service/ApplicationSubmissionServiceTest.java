package de.ichbinhier.volunteerformservice.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import de.ichbinhier.volunteerformservice.application.ApplicationRequest;
import de.ichbinhier.volunteerformservice.application.ApplicationSubmissionService;
import de.ichbinhier.volunteerformservice.application.config.ApplicationLimitProperties;
import de.ichbinhier.volunteerformservice.application.domain.Application;
import de.ichbinhier.volunteerformservice.application.repository.ApplicationRepository;
import de.ichbinhier.volunteerformservice.category.repository.CategoryRepository;
import de.ichbinhier.volunteerformservice.email.ConfirmationMailer;

class ApplicationSubmissionServiceTest {

    private final ApplicationRepository applications = mock(ApplicationRepository.class);
    private final CategoryRepository categories = mock(CategoryRepository.class);
    private final ConfirmationMailer mailer = mock(ConfirmationMailer.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final ApplicationLimitProperties limits = new ApplicationLimitProperties();
    private final ApplicationSubmissionService service = new ApplicationSubmissionServiceImpl(applications, categories, mailer, events, limits);

    @Test
    void retryReturnsExistingApplicationWithoutSendingAnotherConfirmation() {
        UUID submissionId = UUID.randomUUID();
        UUID applicationId = UUID.randomUUID();
        ApplicationRequest request = new ApplicationRequest();
        request.setSubmissionId(submissionId);
        Application existing = Application.builder().id(applicationId).build();
        when(applications.findBySubmissionId(submissionId)).thenReturn(Optional.of(existing));

        assertThat(service.submit(request)).isEqualTo(applicationId);
        verifyNoInteractions(categories, mailer, events);
    }

    @Test
    void botSubmissionDoesNotStoreOrSendAnything() {
        ApplicationRequest request = new ApplicationRequest();
        request.setWebsite("spam.example");

        assertThat(service.submit(request)).isNotNull();
        verifyNoInteractions(applications, categories, mailer, events);
    }
}

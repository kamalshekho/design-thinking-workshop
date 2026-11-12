package de.ichbinhier.volunteerformservice.application;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.email.ConfirmationMailer;
import de.ichbinhier.volunteerformservice.web.ApiException;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applications;
    private final CategoryRepository categories;
    private final ConfirmationMailer confirmationMailer;
    private final ApplicationEventPublisher events;
    private final ApplicationLimitProperties limits;


    public UUID submit(ApplicationRequest request) {
        if (request.looksLikeABot()) {
            return UUID.randomUUID();
        }

        var existing = applications.findBySubmissionId(request.getSubmissionId());
        if (existing.isPresent()) {
            return existing.get().getId();
        }

        throwIfEmailOverLimit(request.getEmail().trim());

        Category category = categories.findById(request.getCategoryId())
                .orElseThrow(() -> new FieldValidationException("categoryId", "CATEGORY_UNKNOWN"));
        if (!category.isActive()) {
            throw new FieldValidationException("categoryId", "CATEGORY_UNAVAILABLE");
        }

        Application saved;
        try {
            saved = applications.saveAndFlush(build(request, category));
        } catch (DataIntegrityViolationException exception) {
            return applications.findBySubmissionId(request.getSubmissionId())
                    .orElseThrow(() -> exception)
                    .getId();
        }

        events.publishEvent(new ApplicationSubmitted(saved));
        confirmationMailer.sendConfirmation(saved);
        return saved.getId();
    }

    /**
     * Every Application sends a confirmation email to the address it names, so
     * one address gets a limited number of them per window (`A26`). Read after
     * the {@code submissionId} check, so a retry of an Application that already
     * went through still answers {@code 201}.
     */
    private void throwIfEmailOverLimit(String email) {
        int limit = limits.getPerEmail();
        Duration window = limits.getWindow();
        Instant now = StoredInstant.now();

        List<Application> recent = applications
                .findByEmailIgnoreCaseAndSubmittedAtAfterOrderBySubmittedAtAsc(email, now.minus(window));
        if (recent.size() < limit) {
            return;
        }

        Instant freedAt = recent.get(recent.size() - limit).getSubmittedAt().plus(window);
        throw ApiException.rateLimited(Duration.between(now, freedAt));
    }

    private static Application build(ApplicationRequest request, Category category) {
        String about = request.getAbout() == null ? null : request.getAbout().trim();

        return Application.builder()
                .submissionId(request.getSubmissionId())
                .category(category)
                .name(request.getName().trim())
                .email(request.getEmail().trim())
                .weeklyTime(request.getWeeklyTime())
                .about(about == null || about.isEmpty() ? null : about)
                .consentAt(StoredInstant.now())
                .consentTextVersion(request.getConsentTextVersion())
                .build();
    }

}

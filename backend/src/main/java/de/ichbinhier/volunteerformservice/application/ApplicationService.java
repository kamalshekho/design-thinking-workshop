package de.ichbinhier.volunteerformservice.application;

import java.time.Instant;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.email.ConfirmationMailer;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applications;
    private final CategoryRepository categories;
    private final ConfirmationMailer confirmationMailer;


    public UUID submit(ApplicationRequest request) {
        if (request.looksLikeABot()) {
            return UUID.randomUUID();
        }

        var existing = applications.findBySubmissionId(request.getSubmissionId());
        if (existing.isPresent()) {
            return existing.get().getId();
        }

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

        confirmationMailer.sendConfirmation(saved);
        return saved.getId();
    }


    // todo: move to mapper?
    private static Application build(ApplicationRequest request, Category category) {
        String about = request.getAbout() == null ? null : request.getAbout().trim();

        return Application.builder()
                .submissionId(request.getSubmissionId())
                .category(category)
                .name(request.getName().trim())
                .email(request.getEmail().trim())
                .weeklyTime(request.getWeeklyTime())
                .about(about == null || about.isEmpty() ? null : about)
                .consentAt(Instant.now())
                .consentTextVersion(request.getConsentTextVersion())
                .build();
    }

}

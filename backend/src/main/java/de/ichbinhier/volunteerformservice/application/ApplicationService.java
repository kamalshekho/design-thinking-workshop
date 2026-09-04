package de.ichbinhier.volunteerformservice.application;

import java.time.Instant;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applications;
    private final CategoryRepository categories;


    public UUID submit(ApplicationRequest request) {
        if (request.looksLikeABot()) {
            return UUID.randomUUID();
        }

        var existing = applications.findBySubmissionId(request.submissionId());
        if (existing.isPresent()) {
            return existing.get().getId();
        }

        Category category = categories.findById(request.categoryId())
                .orElseThrow(() -> new FieldValidationException("categoryId", "CATEGORY_UNKNOWN"));
        if (!category.isActive()) {
            throw new FieldValidationException("categoryId", "CATEGORY_UNAVAILABLE");
        }

        try {
            return applications.saveAndFlush(build(request, category)).getId();
        } catch (DataIntegrityViolationException exception) {
            return applications.findBySubmissionId(request.submissionId())
                    .orElseThrow(() -> exception)
                    .getId();
        }
    }


    // todo: move to mapper?
    private static Application build(ApplicationRequest request, Category category) {
        String about = request.about() == null ? null : request.about().trim();

        return Application.builder()
                .submissionId(request.submissionId())
                .category(category)
                .name(request.name().trim())
                .email(request.email().trim())
                .weeklyTime(request.weeklyTime())
                .about(about == null || about.isEmpty() ? null : about)
                .consentAt(Instant.now())
                .consentTextVersion(request.consentTextVersion())
                .build();
    }

}

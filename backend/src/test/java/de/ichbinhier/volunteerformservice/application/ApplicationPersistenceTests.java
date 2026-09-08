package de.ichbinhier.volunteerformservice.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class ApplicationPersistenceTests {

    @Autowired private ApplicationRepository applications;

    @Autowired private CategoryRepository categories;

    @Test
    void storesAnApplicationAndFindsItBySubmissionId() {
        Category socialMedia = categories.save(category("Social Media", 1, true));

        UUID submissionId = UUID.randomUUID();
        applications.save(application(submissionId, socialMedia));

        assertThat(applications.findBySubmissionId(submissionId))
                .get()
                .satisfies(
                        stored -> {
                            assertThat(stored.getId()).isNotNull();
                            assertThat(stored.getSubmittedAt()).isNotNull();
                            assertThat(stored.getCategory().getName()).isEqualTo("Social Media");
                            assertThat(stored.getWeeklyTime()).isEqualTo(WeeklyTime.HOURS_1_2);
                        });
    }

    @Test
    void rejectsASecondApplicationWithTheSameSubmissionId() {
        Category socialMedia = categories.save(category("Social Media", 1, true));
        UUID submissionId = UUID.randomUUID();
        applications.saveAndFlush(application(submissionId, socialMedia));

        assertThatThrownBy(() -> applications.saveAndFlush(application(submissionId, socialMedia)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void readsOnlyActiveCategoriesInDisplayOrder() {
        categories.save(category("Rechtliche Unterstützung", 3, true));
        categories.save(category("Social Media", 1, true));
        categories.save(category("Etwas anderes", 2, false));

        assertThat(categories.findByActiveTrueOrderByDisplayOrderAscLabelAsc())
                .extracting(Category::getLabel)
                .containsExactly("Social Media", "Rechtliche Unterstützung");
    }

    private static Category category(String label, int displayOrder, boolean active) {
        return Category.builder().label(label).displayOrder(displayOrder).active(active).build();
    }

    private static Application application(UUID submissionId, Category category) {
        return Application.builder()
                .submissionId(submissionId)
                .category(category)
                .name("Anna Müller")
                .email("anna@example.de")
                .weeklyTime(WeeklyTime.HOURS_1_2)
                .about("Ich arbeite seit drei Jahren in der Moderation.")
                .consentTextVersion("2026-09")
                .consentAt(Instant.now())
                .build();
    }
}

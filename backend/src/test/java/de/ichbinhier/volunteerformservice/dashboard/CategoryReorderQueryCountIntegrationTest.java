package de.ichbinhier.volunteerformservice.dashboard;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.EntityManagerFactory;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import de.ichbinhier.volunteerformservice.category.domain.Category;
import de.ichbinhier.volunteerformservice.category.repository.CategoryRepository;
import de.ichbinhier.volunteerformservice.dashboard.dto.CategoryDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.DashboardCategoriesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.ReorderRequest;

@SpringBootTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@ActiveProfiles("test")
class CategoryReorderQueryCountIntegrationTest {

    @Autowired private DashboardCategoryService service;

    @Autowired private CategoryRepository categories;

    @Autowired private EntityManagerFactory entityManagerFactory;

    private List<UUID> seed(int count) {
        categories.deleteAll();
        List<UUID> ids = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Category saved = categories.save(Category.builder()
                    .name("Category " + i)
                    .description("")
                    .displayOrder(i + 1)
                    .active(true)
                    .build());
            ids.add(saved.getId());
        }
        return ids;
    }

    @AfterEach
    void clear() {
        categories.deleteAll();
    }

    @ParameterizedTest
    @ValueSource(ints = {5, 20})
    void reordersWithAConstantNumberOfStatements(int count) {
        List<UUID> reversed = new ArrayList<>(seed(count));
        Collections.reverse(reversed);

        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();

        DashboardCategoriesResponse response =
                service.reorder(new ReorderRequest(reversed));

        long statements = statistics.getPrepareStatementCount();

        assertThat(response).isNotNull();
        assertThat(response.getCategories()).extracting(CategoryDto::getId)
                .containsExactlyElementsOf(reversed);
        assertThat(categories.findByOrderByDisplayOrderAsc()).extracting(Category::getId)
                .containsExactlyElementsOf(reversed);
        assertThat(statements)
                .as("prepared statements for n=%d", count)
                .isLessThanOrEqualTo(2);
    }

}

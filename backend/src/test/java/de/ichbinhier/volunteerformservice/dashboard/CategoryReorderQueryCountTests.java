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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;

/**
 * How many SQL statements one reorder costs. The dashboard sends the whole
 * display order on every swap, so the cost of `reorder()` must not grow with
 * one query and one save per Category. The controller is called directly so
 * that the sign-in lookup of a real request does not blur the count.
 */
@SpringBootTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@ActiveProfiles("test")
class CategoryReorderQueryCountTests {

    private static final int CATEGORIES = 5;

    @Autowired private DashboardCategoryController controller;

    @Autowired private CategoryRepository categories;

    @Autowired private EntityManagerFactory entityManagerFactory;

    private List<UUID> ids;

    @BeforeEach
    void seed() {
        categories.deleteAll();
        ids = new ArrayList<>();
        for (int i = 0; i < CATEGORIES; i++) {
            Category saved = categories.save(Category.builder()
                    .name("Category " + i)
                    .description("")
                    .displayOrder(i + 1)
                    .active(true)
                    .build());
            ids.add(saved.getId());
        }
    }

    @AfterEach
    void clear() {
        categories.deleteAll();
    }

    @Test
    void reordersWithAConstantNumberOfStatements() {
        List<UUID> reversed = new ArrayList<>(ids);
        Collections.reverse(reversed);

        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();

        DashboardCategoriesResponse response =
                controller.reorder(new ReorderRequest(reversed)).getBody();

        long statements = statistics.getPrepareStatementCount();
        System.out.printf(
                "reorder() with n=%d: %d prepared statements, %d queries, %d entity loads, %d entity updates%n",
                CATEGORIES, statements, statistics.getQueryExecutionCount(),
                statistics.getEntityLoadCount(), statistics.getEntityUpdateCount());

        assertThat(response).isNotNull();
        assertThat(response.getCategories()).extracting(CategoryDto::getId)
                .containsExactlyElementsOf(reversed);
        assertThat(categories.findByOrderByDisplayOrderAsc()).extracting(Category::getId)
                .containsExactlyElementsOf(reversed);
        assertThat(statements).isLessThanOrEqualTo(2);
    }

}

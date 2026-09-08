package de.ichbinhier.volunteerformservice.category;

import java.util.List;
import java.util.stream.IntStream;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;


/** First of the seeders: an Application cannot exist without a Category. */
@Component
@Profile("!test")
@Order(1)
@RequiredArgsConstructor
class CategorySeeder implements ApplicationRunner {

    private static final List<String> INITIAL_NAMES =
            List.of(
                    "Social Media",
                    "Redaktion / Öffentlichkeitsarbeit",
                    "Rechtliche Unterstützung",
                    "Etwas anderes");

    private final CategoryRepository categories;


    @Override
    public void run(ApplicationArguments args) {
        if (categories.count() > 0) {
            return;
        }

        categories.saveAll(
                IntStream.range(0, INITIAL_NAMES.size())
                        .mapToObj(
                                index ->
                                        Category.builder()
                                                .name(INITIAL_NAMES.get(index))
                                                .description("")
                                                .displayOrder(index + 1)
                                                .active(true)
                                                .build())
                        .toList());
    }

}

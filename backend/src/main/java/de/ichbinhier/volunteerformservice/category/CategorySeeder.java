package de.ichbinhier.volunteerformservice.category;

import java.util.List;
import java.util.stream.IntStream;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;


// Basic seeder for categories, runs if table is empty
@Component
@Profile("!test")
@RequiredArgsConstructor
class CategorySeeder implements ApplicationRunner {

    private static final List<String> INITIAL_LABELS =
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
                IntStream.range(0, INITIAL_LABELS.size())
                        .mapToObj(
                                index ->
                                        Category.builder()
                                                .label(INITIAL_LABELS.get(index))
                                                .displayOrder(index + 1)
                                                .active(true)
                                                .build())
                        .toList());
    }

}

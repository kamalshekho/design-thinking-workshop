package de.ichbinhier.volunteerformservice.dashboard;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;


/**
 * Seeds the two fixed route counters that the dashboard always displays, even
 * before the first application has been submitted.
 */
@Component
@Profile("!test")
@Order(3)
@RequiredArgsConstructor
class RouteSelectionCounterSeeder implements ApplicationRunner {

    private final RouteSelectionCounterRepository repository;

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            return;
        }

        repository.saveAll(List.of(
                RouteSelectionCounter.builder().route("COMMUNITY").count(0).build(),
                RouteSelectionCounter.builder().route("SUPPORTING_MEMBER").count(0).build()
        ));
    }

}

package de.ichbinhier.volunteerformservice.dashboard;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class RouteSelectionCounterService {

    private final RouteSelectionCounterRepository repository;

    /**
     * Increments the counter for the given route, creating it if it does not
     * exist. Fire-and-forget safe: the caller must not wait for the result.
     */
    public void increment(String route, Optional<String> categoryId) {
        repository.findByRoute(route)
                .ifPresent(counter -> {
                    counter.setCount(counter.getCount() + 1);
                    repository.save(counter);
                })
                .orElseGet(() -> {
                    RouteSelectionCounter counter = RouteSelectionCounter.builder()
                            .route(route)
                            .count(1)
                            .build();
                    if (categoryId.isPresent()) {
                        counter.setId(UUID.randomUUID());
                    }
                    return repository.save(counter);
                });

        // Also create a counter for category selections so the dashboard can
        // show per-category counts alongside the fixed routes.
        if (categoryId.isPresent()) {
            String catRoute = "CATEGORY:" + categoryId.get();
            repository.findByRoute(catRoute)
                    .ifPresent(counter -> {
                        counter.setCount(counter.getCount() + 1);
                        repository.save(counter);
                    })
                    .orElseGet(() -> {
                        RouteSelectionCounter counter = RouteSelectionCounter.builder()
                                .route(catRoute)
                                .count(1)
                                .build();
                        return repository.save(counter);
                    });
        }
    }

    /**
     * Returns the full list of counters for the dashboard.
     */
    public List<RouteSelection> getAll() {
        return repository.findAllByOrderByRouteAsc().stream()
                .map(counter -> new RouteSelection(counter.getRoute(), counter.getCount()))
                .toList();
    }

}

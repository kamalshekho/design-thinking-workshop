package de.ichbinhier.volunteerformservice.routeselection;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.ichbinhier.volunteerformservice.category.domain.Category;
import de.ichbinhier.volunteerformservice.category.repository.CategoryRepository;
import de.ichbinhier.volunteerformservice.routeselection.domain.FixedRoute;
import de.ichbinhier.volunteerformservice.routeselection.domain.FixedRouteCount;
import de.ichbinhier.volunteerformservice.routeselection.repository.FixedRouteCountRepository;

import lombok.RequiredArgsConstructor;

/**
 * Counts which way into the form applicants pick, the only measurement of `A5`
 * the platform takes. A selection it cannot read is dropped without an error:
 * the form sends it fire-and-forget, and a broken counter must never reach an
 * applicant (see frontend/API.md).
 */
@Service
@RequiredArgsConstructor
public class RouteSelections {

    static final String CATEGORY_ROUTE = "CATEGORY";

    private final FixedRouteCountRepository fixedRoutes;

    private final CategoryRepository categories;

    /** Counts one selection; an unknown route or Category id counts nothing. */
    @Transactional
    public void record(String route, String categoryId) {
        if (CATEGORY_ROUTE.equals(route)) {
            uuidOf(categoryId).ifPresent(categories::incrementSelectionCount);
            return;
        }
        fixedRouteOf(route).ifPresent(fixed -> fixedRoutes.increment(fixed.name()));
    }

    /**
     * Every fixed route and every Category with its count, zeros and inactive
     * Categories included, so that "nobody chose this" shows as a number.
     */
    @Transactional(readOnly = true)
    public Tally tally() {
        List<FixedRouteCount> fixed = fixedRoutes.findAll().stream()
                .sorted(Comparator.comparing(FixedRouteCount::getRoute))
                .toList();
        return new Tally(fixed, categories.findByOrderByDisplayOrderAsc());
    }

    public record Tally(List<FixedRouteCount> fixedRoutes, List<Category> categories) {
    }

    private static Optional<FixedRoute> fixedRouteOf(String route) {
        for (FixedRoute fixed : FixedRoute.values()) {
            if (fixed.name().equals(route)) {
                return Optional.of(fixed);
            }
        }
        return Optional.empty();
    }

    private static Optional<UUID> uuidOf(String value) {
        if (value == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(value));
        } catch (IllegalArgumentException notAUuid) {
            return Optional.empty();
        }
    }

}

package de.ichbinhier.volunteerformservice.dashboard;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class RouteSelectionsController {

    private final RouteSelectionCounterService counterService;

    @GetMapping("/route-selections")
    ResponseEntity<RouteSelectionsResponse> list() {
        List<RouteSelection> allCounters = counterService.getAll();

        // Split into fixed routes and category counters.
        List<RouteSelection> fixedRoutes = allCounters.stream()
                .filter(r -> "COMMUNITY".equals(r.getRoute())
                        || "SUPPORTING_MEMBER".equals(r.getRoute()))
                .toList();

        List<CategoryRouteSelection> categories = allCounters.stream()
                .filter(r -> r.getRoute().startsWith("CATEGORY:"))
                .map(r -> {
                    String catId = r.getRoute().substring("CATEGORY:".length());
                    return new CategoryRouteSelection(
                            new CategoryDto(catId, "Category"), r.getCount());
                })
                .toList();

        RouteSelectionsResponse response = new RouteSelectionsResponse();
        response.setFixedRoutes(fixedRoutes.isEmpty()
                ? List.of(
                    new RouteSelection("COMMUNITY", 0),
                    new RouteSelection("SUPPORTING_MEMBER", 0))
                : fixedRoutes);
        response.setCategories(categories);
        return ResponseEntity.ok(response);
    }

}

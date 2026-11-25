package de.ichbinhier.volunteerformservice.dashboard.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.dashboard.dto.route.CategoryRouteSelection;
import de.ichbinhier.volunteerformservice.dashboard.dto.route.RouteSelection;
import de.ichbinhier.volunteerformservice.dashboard.dto.route.RouteSelectionsResponse;
import de.ichbinhier.volunteerformservice.routeselection.RouteSelections;

import lombok.RequiredArgsConstructor;

@Tag(name = "Dashboard: Auswahlwege")
@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class RouteSelectionsController {

    private final RouteSelections routeSelections;

    @Operation(summary = "Auswahlwege abrufen", security = @SecurityRequirement(name = "staffSession"))
    @GetMapping("/route-selections")
    ResponseEntity<RouteSelectionsResponse> list() {
        RouteSelections.Tally tally = routeSelections.tally();

        List<RouteSelection> fixedRoutes = tally.fixedRoutes().stream()
            .map(count -> new RouteSelection(count.getRoute().name(), count.getSelectionCount()))
            .toList();
        List<CategoryRouteSelection> categories = tally.categories().stream()
            .map(category -> new CategoryRouteSelection(
                category.getId().toString(), category.getName(), category.getSelectionCount()))
            .toList();

        RouteSelectionsResponse response = new RouteSelectionsResponse();
        response.setFixedRoutes(fixedRoutes);
        response.setCategories(categories);
        return ResponseEntity.ok(response);
    }

}

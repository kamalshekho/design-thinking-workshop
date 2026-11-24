package de.ichbinhier.volunteerformservice.dashboard.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.dashboard.dto.CategoryRouteSelection;
import de.ichbinhier.volunteerformservice.dashboard.dto.RouteSelection;
import de.ichbinhier.volunteerformservice.dashboard.dto.RouteSelectionsResponse;

import lombok.RequiredArgsConstructor;

@Tag(name = "Dashboard: Auswahlwege")
@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class RouteSelectionsController {

    @Operation(summary = "Auswahlwege abrufen", security = @SecurityRequirement(name = "staffSession"))
    @GetMapping("/route-selections")
    ResponseEntity<RouteSelectionsResponse> list() {
        List<RouteSelection> fixedRoutes = List.of(
            new RouteSelection("COMMUNITY", 0),
            new RouteSelection("SUPPORTING_MEMBER", 0)
        );

        List<CategoryRouteSelection> categories = List.of();

        RouteSelectionsResponse response = new RouteSelectionsResponse();
        response.setFixedRoutes(fixedRoutes);
        response.setCategories(categories);
        return ResponseEntity.ok(response);
    }

}

package de.ichbinhier.volunteerformservice.routeselection.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.routeselection.RouteSelections;

import lombok.RequiredArgsConstructor;

@Tag(name = "Formular")
@RestController
@RequestMapping("/api/v1/route-selections")
@RequiredArgsConstructor
public class RouteSelectionController {

    private final RouteSelections routeSelections;

    @Operation(summary = "Gewählten Weg im Formular zählen")
    @ApiResponse(responseCode = "202", description = "Angenommen, auch bei unbekanntem Weg oder unbekannter Kategorie")
    @PostMapping
    ResponseEntity<Void> record(@RequestBody RouteSelectionRequest request) {
        routeSelections.record(request.route(), request.categoryId());
        return ResponseEntity.accepted().build();
    }

}

package de.ichbinhier.volunteerformservice.dashboard;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;


/**
 * Public endpoint for the applicant form to record which route or category was
 * picked. Fire-and-forget: the frontend ignores failures.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FormRouteSelectionsController {

    private final RouteSelectionCounterService counterService;

    @PostMapping("/route-selections")
    ResponseEntity<Void> create(@RequestBody RouteSelectionRequest request) {
        counterService.increment(request.getRoute(), request.getCategoryId());
        return ResponseEntity.accepted().build();
    }

}

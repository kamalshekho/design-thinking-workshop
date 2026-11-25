package de.ichbinhier.volunteerformservice.application.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.application.ApplicationRequest;
import de.ichbinhier.volunteerformservice.application.ApplicationResponse;
import de.ichbinhier.volunteerformservice.application.ApplicationSubmissionService;

import lombok.RequiredArgsConstructor;

@Tag(name = "Formular")
@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationSubmissionController {

    private final ApplicationSubmissionService applications;

    @Operation(summary = "Bewerbung absenden")
    @ApiResponse(responseCode = "201", description = "Bewerbung gespeichert oder bereits vorhanden")
    @ApiResponse(responseCode = "400", description = "Eingaben ungültig", content = @Content)
    @ApiResponse(responseCode = "429", description = "Zu viele Anfragen", content = @Content)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ApplicationResponse create(@Valid @RequestBody ApplicationRequest request) {
        return new ApplicationResponse(applications.submit(request));
    }

}

package de.ichbinhier.volunteerformservice.application;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applications;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ApplicationResponse create(@Valid @RequestBody ApplicationRequest request) {
        return new ApplicationResponse(applications.submit(request));
    }

}

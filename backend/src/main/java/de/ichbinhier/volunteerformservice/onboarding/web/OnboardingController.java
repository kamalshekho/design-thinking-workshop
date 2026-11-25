package de.ichbinhier.volunteerformservice.onboarding.web;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.onboarding.dto.OnboardingResponse;
import de.ichbinhier.volunteerformservice.onboarding.dto.UpdateOnboardingStepRequest;
import de.ichbinhier.volunteerformservice.onboarding.service.OnboardingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService service;

    @GetMapping("/{token}")
    public OnboardingResponse get(@PathVariable String token) {
        return service.getByToken(token);
    }

    @PutMapping("/{token}/steps/{stepId}")
    public OnboardingResponse updateStep(
            @PathVariable String token,
            @PathVariable String stepId,
            @Valid @RequestBody UpdateOnboardingStepRequest request) {
        return service.setStep(token, stepId, request.done());
    }

}

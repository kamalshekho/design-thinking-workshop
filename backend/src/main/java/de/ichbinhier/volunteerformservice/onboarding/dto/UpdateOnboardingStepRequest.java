package de.ichbinhier.volunteerformservice.onboarding.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateOnboardingStepRequest(
        @NotNull(message = "VALIDATION_FAILED") Boolean done) {
}

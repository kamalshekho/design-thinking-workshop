package de.ichbinhier.volunteerformservice.onboarding.dto;

import java.util.List;

public record OnboardingResponse(String name, List<OnboardingStepDto> steps) {
}

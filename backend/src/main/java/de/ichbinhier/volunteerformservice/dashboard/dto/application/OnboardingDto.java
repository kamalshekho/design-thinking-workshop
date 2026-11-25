package de.ichbinhier.volunteerformservice.dashboard.dto.application;

import de.ichbinhier.volunteerformservice.application.domain.Application;
import de.ichbinhier.volunteerformservice.onboarding.OnboardingProperties;
import de.ichbinhier.volunteerformservice.onboarding.OnboardingStep;

public record OnboardingDto(String link, int doneSteps, int totalSteps) {

    public static OnboardingDto of(
            Application application,
            OnboardingProperties properties,
            int doneSteps) {
        String token = application.getOnboardingToken();
        if (token == null) {
            return null;
        }
        return new OnboardingDto(
                properties.linkFor(token),
                doneSteps,
                OnboardingStep.values().length);
    }

}

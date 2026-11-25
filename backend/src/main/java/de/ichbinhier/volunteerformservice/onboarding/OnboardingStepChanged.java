package de.ichbinhier.volunteerformservice.onboarding;

import de.ichbinhier.volunteerformservice.application.domain.Application;

public record OnboardingStepChanged(Application application, int doneSteps) {
}

package de.ichbinhier.volunteerformservice.onboarding.service;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.ichbinhier.volunteerformservice.application.domain.Application;
import de.ichbinhier.volunteerformservice.application.domain.ApplicationStatus;
import de.ichbinhier.volunteerformservice.application.domain.StoredInstant;
import de.ichbinhier.volunteerformservice.application.repository.ApplicationRepository;
import de.ichbinhier.volunteerformservice.onboarding.OnboardingStep;
import de.ichbinhier.volunteerformservice.onboarding.OnboardingStepChanged;
import de.ichbinhier.volunteerformservice.onboarding.domain.OnboardingStepCompletion;
import de.ichbinhier.volunteerformservice.onboarding.dto.OnboardingResponse;
import de.ichbinhier.volunteerformservice.onboarding.dto.OnboardingStepDto;
import de.ichbinhier.volunteerformservice.onboarding.repository.OnboardingStepCompletionRepository;
import de.ichbinhier.volunteerformservice.web.ApiException;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final ApplicationRepository applications;
    private final OnboardingStepCompletionRepository completions;
    private final ApplicationEventPublisher events;

    @Transactional(readOnly = true)
    public OnboardingResponse getByToken(String token) {
        Application application = requireActiveOnboarding(token);
        return toResponse(application);
    }

    @Transactional
    public OnboardingResponse setStep(String token, String rawStepId, boolean done) {
        Application application = requireActiveOnboarding(token);
        OnboardingStep step = parseStep(rawStepId);

        if (done) {
            if (completions.findByApplicationIdAndStep(application.getId(), step).isEmpty()) {
                completions.save(OnboardingStepCompletion.builder()
                        .application(application)
                        .step(step)
                        .completedAt(StoredInstant.now())
                        .build());
            }
        } else {
            completions.findByApplicationIdAndStep(application.getId(), step)
                    .ifPresent(completions::delete);
        }

        completions.flush();
        OnboardingResponse response = toResponse(application);
        int doneSteps = (int) response.steps().stream().filter(OnboardingStepDto::done).count();
        events.publishEvent(new OnboardingStepChanged(application, doneSteps));
        return response;
    }

    private Application requireActiveOnboarding(String token) {
        if (token == null || token.isBlank()) {
            throw ApiException.notFound();
        }
        Application application = applications.findByOnboardingToken(token)
                .orElseThrow(ApiException::notFound);

        boolean validStatus = application.getStatus() == ApplicationStatus.ACCEPTED
                || application.getStatus() == ApplicationStatus.ACTIVE;
        if (!validStatus || application.getDiscardedAt() != null) {
            throw ApiException.notFound();
        }
        return application;
    }

    private static OnboardingStep parseStep(String rawStepId) {
        try {
            return OnboardingStep.valueOf(rawStepId);
        } catch (IllegalArgumentException unknown) {
            throw new FieldValidationException("stepId", "STEP_UNKNOWN");
        }
    }

    private OnboardingResponse toResponse(Application application) {
        Set<OnboardingStep> doneSteps = completions.findByApplicationId(application.getId()).stream()
                .map(OnboardingStepCompletion::getStep)
                .collect(Collectors.toSet());

        List<OnboardingStepDto> steps = Arrays.stream(OnboardingStep.values())
                .map(step -> new OnboardingStepDto(step.name(), doneSteps.contains(step)))
                .toList();

        return new OnboardingResponse(application.getName(), steps);
    }

}

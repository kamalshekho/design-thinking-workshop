package de.ichbinhier.volunteerformservice.onboarding.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import de.ichbinhier.volunteerformservice.onboarding.OnboardingStep;
import de.ichbinhier.volunteerformservice.onboarding.domain.OnboardingStepCompletion;

public interface OnboardingStepCompletionRepository extends JpaRepository<OnboardingStepCompletion, UUID> {

    List<OnboardingStepCompletion> findByApplicationId(UUID applicationId);

    Optional<OnboardingStepCompletion> findByApplicationIdAndStep(UUID applicationId, OnboardingStep step);

    long countByApplicationId(UUID applicationId);

    void deleteByApplicationId(UUID applicationId);

    @Query("select c.application.id as applicationId, count(c) as doneCount "
            + "from OnboardingStepCompletion c group by c.application.id")
    List<ApplicationStepCount> countDoneByApplication();

    interface ApplicationStepCount {
        UUID getApplicationId();
        long getDoneCount();
    }

}

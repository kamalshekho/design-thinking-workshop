package de.ichbinhier.volunteerformservice.dashboard.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.ichbinhier.volunteerformservice.application.domain.Application;
import de.ichbinhier.volunteerformservice.application.domain.ApplicationStatus;
import de.ichbinhier.volunteerformservice.application.domain.StateChange;
import de.ichbinhier.volunteerformservice.application.domain.StateChangeField;
import de.ichbinhier.volunteerformservice.application.domain.StoredInstant;
import de.ichbinhier.volunteerformservice.application.repository.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.repository.StateChangeRepository;
import de.ichbinhier.volunteerformservice.dashboard.DashboardApplicationService;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.ApplicationDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.ApplicationsResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.ChangesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.OnboardingDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.StateChangeDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.UpdateApplicationRequest;
import de.ichbinhier.volunteerformservice.email.ApplicationStatusChanged;
import de.ichbinhier.volunteerformservice.onboarding.OnboardingProperties;
import de.ichbinhier.volunteerformservice.onboarding.OnboardingTokens;
import de.ichbinhier.volunteerformservice.onboarding.repository.OnboardingStepCompletionRepository;
import de.ichbinhier.volunteerformservice.staff.domain.Staff;
import de.ichbinhier.volunteerformservice.staff.repository.StaffRepository;
import de.ichbinhier.volunteerformservice.web.ApiException;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class DashboardApplicationServiceImpl implements DashboardApplicationService {

    private final ApplicationRepository appRepo;
    private final StaffRepository staffRepo;
    private final StateChangeRepository changeRepo;
    private final OnboardingStepCompletionRepository onboardingSteps;
    private final OnboardingProperties onboardingProperties;
    private final OnboardingTokens onboardingTokens;
    private final ApplicationEventStream stream;
    private final ApplicationEventPublisher events;

    public ApplicationsResponse list() {
        Map<UUID, Integer> doneByApp = onboardingSteps.countDoneByApplication().stream()
                .collect(Collectors.toMap(
                        OnboardingStepCompletionRepository.ApplicationStepCount::getApplicationId,
                        row -> Math.toIntExact(row.getDoneCount())));

        List<ApplicationDto> apps = appRepo.findAllByOrderBySubmittedAtDesc().stream()
            .map(app -> ApplicationDto.of(
                    app,
                    onboardingOf(app, doneByApp.getOrDefault(app.getId(), 0))))
            .toList();

        ApplicationsResponse response = new ApplicationsResponse();
        response.setApplications(apps);
        return response;
    }

    public ChangesResponse changes(int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<StateChangeDto> changes = changeRepo.findByChangedAtGreaterThanEqualOrderByChangedAtAsc(since).stream()
            .map(this::toDto)
            .toList();

        ChangesResponse response = new ChangesResponse();
        response.setChanges(changes);
        return response;
    }

    @Transactional
    public ApplicationDto update(
        UUID id,
        UpdateApplicationRequest req) {

        String immutable = req.firstImmutableFieldSent();
        if (immutable != null) {
            throw new FieldValidationException(immutable, "IMMUTABLE_FIELD");
        }

        var app = appRepo.findById(id)
            .orElseThrow(ApiException::notFound);

        boolean statusChanged = updateStatus(app, req.getStatus());
        updateOwner(app, req);
        if (req.getInternalNotes() != null) {
            app.setInternalNotes(req.getInternalNotes());
        }
        updateDiscarded(app, req.getDiscarded());

        appRepo.save(app);

        ApplicationDto updated = ApplicationDto.of(app, onboardingOf(app));
        stream.updated(updated);
        if (statusChanged) {
            events.publishEvent(new ApplicationStatusChanged(
                app.getId(), app.getEmail(), app.getName(), app.getStatus(),
                app.getOnboardingToken()));
        }
        return updated;
    }

    private boolean updateStatus(Application app, String requestedStatus) {
        if (requestedStatus == null) {
            return false;
        }
        ApplicationStatus status = statusOf(requestedStatus);
        if (app.getStatus() == status) {
            return false;
        }
        app.setStatus(status);
        if (status == ApplicationStatus.ACCEPTED && app.getOnboardingToken() == null) {
            app.setOnboardingToken(onboardingTokens.generate());
        }
        recordChange(app, StateChangeField.STATUS, status.name());
        return true;
    }

    private OnboardingDto onboardingOf(Application app) {
        if (app.getOnboardingToken() == null) {
            return null;
        }
        int doneSteps = Math.toIntExact(onboardingSteps.countByApplicationId(app.getId()));
        return OnboardingDto.of(app, onboardingProperties, doneSteps);
    }

    private OnboardingDto onboardingOf(Application app, int doneSteps) {
        return OnboardingDto.of(app, onboardingProperties, doneSteps);
    }

    private void updateOwner(Application app, UpdateApplicationRequest req) {
        if (!req.isOwnerIdSent()) {
            return;
        }
        Staff owner = req.getOwnerId() == null
            ? null
            : staffRepo.findById(req.getOwnerId())
                .orElseThrow(() -> new FieldValidationException("ownerId", "OWNER_UNKNOWN"));
        String oldOwner = app.getOwner() != null ? app.getOwner().getId().toString() : null;
        String newOwner = owner != null ? owner.getId().toString() : null;
        app.setOwner(owner);
        if (!Objects.equals(oldOwner, newOwner)) {
            recordChange(app, StateChangeField.OWNER, newOwner);
        }
    }

    private void updateDiscarded(Application app, Boolean discarded) {
        if (discarded != null && discarded != (app.getDiscardedAt() != null)) {
            app.setDiscardedAt(discarded ? StoredInstant.now() : null);
            recordChange(app, StateChangeField.DISCARDED, discarded.toString());
        }
    }

    @Transactional
    public void deletePermanently(UUID id) {
        var app = appRepo.findById(id)
            .orElseThrow(ApiException::notFound);

        if (app.getDiscardedAt() == null) {
            throw ApiException.notDiscarded();
        }

        ApplicationDto erased = ApplicationDto.of(app, onboardingOf(app));

        onboardingSteps.deleteByApplicationId(id);
        changeRepo.deleteByApplicationId(id);
        appRepo.deleteById(id);

        stream.deleted(erased);
    }

    private static ApplicationStatus statusOf(String status) {
        try {
            return ApplicationStatus.valueOf(status);
        } catch (IllegalArgumentException unknown) {
            throw new FieldValidationException("status", "STATUS_UNKNOWN");
        }
    }

    private void recordChange(Application app, StateChangeField field, String toValue) {
        changeRepo.save(StateChange.builder()
            .application(app)
            .changedAt(StoredInstant.now())
            .field(field)
            .toValue(toValue)
            .build());
    }

    private StateChangeDto toDto(StateChange change) {
        Object toValue = change.getToValue();
        if (change.getField() == StateChangeField.DISCARDED) {
            toValue = Boolean.parseBoolean(change.getToValue());
        }

        StateChangeDto dto = new StateChangeDto();
        dto.setApplicationId(change.getApplication().getId());
        dto.setAt(change.getChangedAt());
        dto.setField(change.getField().name());
        dto.setTo(toValue);
        return dto;
    }

}

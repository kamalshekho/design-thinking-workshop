package de.ichbinhier.volunteerformservice.dashboard.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

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
import de.ichbinhier.volunteerformservice.dashboard.dto.ApplicationDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.ApplicationsResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.ChangesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.StateChangeDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.UpdateApplicationRequest;
import de.ichbinhier.volunteerformservice.email.ApplicationStatusChanged;
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
    private final ApplicationEventStream stream;
    private final ApplicationEventPublisher events;

    public ApplicationsResponse list() {
        List<ApplicationDto> apps = appRepo.findAllByOrderBySubmittedAtDesc().stream()
            .map(ApplicationDto::of)
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

        ApplicationDto updated = ApplicationDto.of(app);
        stream.updated(updated);
        if (statusChanged) {
            events.publishEvent(new ApplicationStatusChanged(
                app.getId(), app.getEmail(), app.getName(), app.getStatus()));
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
        recordChange(app, StateChangeField.STATUS, status.name());
        return true;
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

        ApplicationDto erased = ApplicationDto.of(app);

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

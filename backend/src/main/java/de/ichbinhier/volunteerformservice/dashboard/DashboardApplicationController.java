package de.ichbinhier.volunteerformservice.dashboard;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.application.Application;
import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.application.ApplicationStatus;
import de.ichbinhier.volunteerformservice.application.StateChange;
import de.ichbinhier.volunteerformservice.application.StateChangeField;
import de.ichbinhier.volunteerformservice.application.StateChangeRepository;
import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;
import de.ichbinhier.volunteerformservice.web.ApiException;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/staff/applications")
@RequiredArgsConstructor
public class DashboardApplicationController {

    private final ApplicationRepository appRepo;
    private final StaffRepository staffRepo;
    private final StateChangeRepository changeRepo;

    @GetMapping
    ResponseEntity<ApplicationsResponse> list() {
        List<ApplicationDto> apps = appRepo.findAllByOrderBySubmittedAtDesc().stream()
            .map(this::toDto)
            .toList();

        ApplicationsResponse response = new ApplicationsResponse();
        response.setApplications(apps);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(response);
    }

    @GetMapping("/changes")
    ResponseEntity<ChangesResponse> changes(@RequestParam(defaultValue = "30") int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<StateChangeDto> changes = changeRepo.findByChangedAtGreaterThanEqualOrderByChangedAtAsc(since).stream()
            .map(this::toDto)
            .toList();

        ChangesResponse response = new ChangesResponse();
        response.setChanges(changes);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(response);
    }

    @PatchMapping("/{id}")
    ResponseEntity<ApplicationDto> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateApplicationRequest req) {

        String immutable = req.firstImmutableFieldSent();
        if (immutable != null) {
            throw new FieldValidationException(immutable, "IMMUTABLE_FIELD");
        }

        var app = appRepo.findById(id)
            .orElseThrow(ApiException::notFound);

        if (req.getStatus() != null) {
            ApplicationStatus status = statusOf(req.getStatus());
            String oldStatus = app.getStatus().name();
            app.setStatus(status);
            if (!oldStatus.equals(req.getStatus())) {
                recordChange(app, StateChangeField.STATUS, req.getStatus());
            }
        }

        if (req.isOwnerIdSent()) {
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

        if (req.getInternalNotes() != null) {
            app.setInternalNotes(req.getInternalNotes());
        }

        if (req.getDiscarded() != null && req.getDiscarded() != (app.getDiscardedAt() != null)) {
            app.setDiscardedAt(req.getDiscarded() ? Instant.now() : null);
            recordChange(app, StateChangeField.DISCARDED, req.getDiscarded().toString());
        }

        appRepo.save(app);
        return ResponseEntity.ok(toDto(app));
    }

    @DeleteMapping("/{id}/permanently")
    ResponseEntity<Void> deletePermanently(@PathVariable UUID id) {
        var app = appRepo.findById(id)
            .orElseThrow(ApiException::notFound);

        if (app.getDiscardedAt() == null) {
            throw ApiException.notDiscarded();
        }

        appRepo.deleteById(id);
        return ResponseEntity.noContent().build();
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
            .changedAt(Instant.now())
            .field(field)
            .toValue(toValue)
            .build());
    }

    private ApplicationDto toDto(Application app) {
        ApplicationDto dto = new ApplicationDto();
        dto.setId(app.getId());
        dto.setCategoryId(app.getCategory().getId());
        dto.setName(app.getName());
        dto.setEmail(app.getEmail());
        dto.setWeeklyTime(app.getWeeklyTime().name());
        dto.setAbout(app.getAbout());
        dto.setStatus(app.getStatus().name());
        dto.setOwnerId(app.getOwner() != null ? app.getOwner().getId() : null);
        dto.setInternalNotes(app.getInternalNotes() != null ? app.getInternalNotes() : "");
        dto.setDiscardedAt(app.getDiscardedAt());
        dto.setConsentAt(app.getConsentAt());
        dto.setConsentTextVersion(app.getConsentTextVersion());
        dto.setSubmittedAt(app.getSubmittedAt());
        return dto;
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

package de.ichbinhier.volunteerformservice.dashboard;

import java.time.Instant;
import java.util.UUID;

import de.ichbinhier.volunteerformservice.application.Application;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDto {
    private UUID id;
    private UUID categoryId;
    private String name;
    private String email;
    private String weeklyTime;
    private String about;
    private String status;
    private UUID ownerId;
    private String internalNotes;
    private Instant discardedAt;
    private Instant consentAt;
    private String consentTextVersion;
    private Instant submittedAt;

    /**
     * The one mapping from an Application to its wire shape. The list endpoint
     * and all three live-stream events go through it, because
     * `dashboard/API.md` promises the stream's {@code data} is <em>exactly</em>
     * what {@code GET /api/v1/staff/applications} returns — two mappings would
     * drift.
     *
     * <p>Only identifiers are read off the lazy {@code category} and
     * {@code owner} associations, which a Hibernate proxy answers without a
     * session, so this is safe to call outside a transaction.
     */
    static ApplicationDto of(Application application) {
        ApplicationDto dto = new ApplicationDto();
        dto.setId(application.getId());
        dto.setCategoryId(application.getCategory().getId());
        dto.setName(application.getName());
        dto.setEmail(application.getEmail());
        dto.setWeeklyTime(application.getWeeklyTime().name());
        dto.setAbout(application.getAbout());
        dto.setStatus(application.getStatus().name());
        dto.setOwnerId(application.getOwner() != null ? application.getOwner().getId() : null);
        dto.setInternalNotes(
                application.getInternalNotes() != null ? application.getInternalNotes() : "");
        dto.setDiscardedAt(application.getDiscardedAt());
        dto.setConsentAt(application.getConsentAt());
        dto.setConsentTextVersion(application.getConsentTextVersion());
        dto.setSubmittedAt(application.getSubmittedAt());
        return dto;
    }
}

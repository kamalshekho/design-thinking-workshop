package de.ichbinhier.volunteerformservice.dashboard.dto;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import jakarta.validation.constraints.Size;

import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Bound field by field through the setters — no all-args constructor, because
 * Jackson would take it as a creator and never call {@link #setOwnerId}, which
 * is what tells an absent {@code ownerId} from an explicit {@code null}.
 */
@Data
@NoArgsConstructor
public class UpdateApplicationRequest {

    /**
     * What an applicant wrote. Present in a request means rejected, not ignored:
     * silently dropping it would let a future bug look like it worked.
     */
    private static final Set<String> IMMUTABLE_FIELDS = Set.of(
        "name", "email", "about", "weeklyTime", "categoryId", "consentAt", "consentTextVersion");

    private String status;
    private UUID ownerId;

    @Size(max = 4000, message = "NOTES_TOO_LONG")
    private String internalNotes;

    private Boolean discarded;

    @JsonIgnore
    private boolean ownerIdSent;

    @JsonIgnore
    private final Set<String> immutableFieldsSent = new LinkedHashSet<>();

    /**
     * Absent and {@code null} differ for {@code ownerId}: absent leaves the
     * Owner alone, {@code null} clears it. Jackson calls the setter only for a
     * field the request actually carries, so the setter is what tells them
     * apart.
     */
    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
        this.ownerIdSent = true;
    }

    @JsonIgnore
    public boolean isOwnerIdSent() {
        return ownerIdSent;
    }

    @JsonAnySetter
    void unmapped(String field, Object value) {
        if (IMMUTABLE_FIELDS.contains(field)) {
            immutableFieldsSent.add(field);
        }
    }

    @JsonIgnore
    public String firstImmutableFieldSent() {
        return immutableFieldsSent.stream().findFirst().orElse(null);
    }

}

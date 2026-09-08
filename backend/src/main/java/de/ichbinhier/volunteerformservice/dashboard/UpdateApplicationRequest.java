package de.ichbinhier.volunteerformservice.dashboard;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import jakarta.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
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
    private final Set<String> immutableFieldsSent = new LinkedHashSet<>();

    @JsonAnySetter
    void unmapped(String field, Object value) {
        if (IMMUTABLE_FIELDS.contains(field)) {
            immutableFieldsSent.add(field);
        }
    }

    @JsonIgnore
    String firstImmutableFieldSent() {
        return immutableFieldsSent.stream().findFirst().orElse(null);
    }

}

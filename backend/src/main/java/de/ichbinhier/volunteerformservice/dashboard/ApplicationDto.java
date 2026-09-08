package de.ichbinhier.volunteerformservice.dashboard;

import java.time.Instant;
import java.util.UUID;

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
}


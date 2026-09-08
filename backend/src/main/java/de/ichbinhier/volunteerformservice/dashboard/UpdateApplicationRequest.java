package de.ichbinhier.volunteerformservice.dashboard;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateApplicationRequest {
    private String status;
    private UUID ownerId;
    private String internalNotes;
    private Boolean discarded;
}


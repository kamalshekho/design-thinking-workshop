package de.ichbinhier.volunteerformservice.web.dashboard;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StateChangeDto {
    private UUID applicationId;
    private Instant at;
    private String field;
    private Object to;
}


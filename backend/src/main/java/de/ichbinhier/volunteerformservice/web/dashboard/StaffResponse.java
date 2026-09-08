package de.ichbinhier.volunteerformservice.web.dashboard;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffResponse {
    private UUID id;
    private String name;
    private String email;
}


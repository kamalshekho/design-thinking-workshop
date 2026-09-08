package de.ichbinhier.volunteerformservice.dashboard;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReorderRequest {
    private List<UUID> ids;
}


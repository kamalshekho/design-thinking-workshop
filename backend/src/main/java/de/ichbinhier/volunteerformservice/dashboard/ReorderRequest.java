package de.ichbinhier.volunteerformservice.dashboard;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReorderRequest {

    @NotEmpty(message = "ORDER_INCOMPLETE")
    private List<UUID> ids;

}

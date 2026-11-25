package de.ichbinhier.volunteerformservice.dashboard.dto.route;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteSelection {
    private String route;
    private int count;
}


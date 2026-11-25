package de.ichbinhier.volunteerformservice.dashboard.dto.route;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteSelectionsResponse {
    private List<RouteSelection> fixedRoutes;
    private List<CategoryRouteSelection> categories;
}


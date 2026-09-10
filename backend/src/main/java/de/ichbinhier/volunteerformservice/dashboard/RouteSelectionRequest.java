package de.ichbinhier.volunteerformservice.dashboard;

import java.util.Optional;
import java.util.UUID;

/**
 * Payload the applicant form sends when recording a route selection.
 */
public class RouteSelectionRequest {

    private String route;
    private UUID categoryId;

    public String getRoute() {
        return route;
    }

    public void setRoute(String route) {
        this.route = route;
    }

    public Optional<UUID> getCategoryId() {
        return Optional.ofNullable(categoryId);
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
    }

}

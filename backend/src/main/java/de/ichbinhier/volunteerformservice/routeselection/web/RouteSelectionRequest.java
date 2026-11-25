package de.ichbinhier.volunteerformservice.routeselection.web;

/**
 * {@code {"route": "COMMUNITY"}}, {@code {"route": "SUPPORTING_MEMBER"}} or
 * {@code {"route": "CATEGORY", "categoryId": "…"}}. Both fields stay strings, so
 * a value the backend does not know is ignored rather than refused.
 */
public record RouteSelectionRequest(String route, String categoryId) {
}

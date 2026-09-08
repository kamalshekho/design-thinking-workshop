package de.ichbinhier.volunteerformservice.application;

/**
 * Published once an Application has really been stored, so that the form does
 * not have to know a dashboard exists. The dashboard's live stream listens for
 * it; a repeated {@code submissionId}, which stores nothing, publishes nothing.
 */
public record ApplicationSubmitted(Application application) {}

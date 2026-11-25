package de.ichbinhier.volunteerformservice.email;

import java.util.UUID;

import de.ichbinhier.volunteerformservice.application.domain.ApplicationStatus;

public record ApplicationStatusChanged(UUID applicationId, String email, String name,
                                       ApplicationStatus status) {}

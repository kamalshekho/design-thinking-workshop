package de.ichbinhier.volunteerformservice.application;

import java.util.UUID;

public interface ApplicationSubmissionService {
    UUID submit(ApplicationRequest request);
}

package de.ichbinhier.volunteerformservice.application;

import java.util.UUID;

public interface ApplicationService {
    UUID submit(ApplicationRequest request);
}

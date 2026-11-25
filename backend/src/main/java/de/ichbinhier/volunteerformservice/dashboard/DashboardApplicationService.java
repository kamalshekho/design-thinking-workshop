package de.ichbinhier.volunteerformservice.dashboard;

import java.util.UUID;

import de.ichbinhier.volunteerformservice.dashboard.dto.application.ApplicationDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.ApplicationsResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.ChangesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.UpdateApplicationRequest;

public interface DashboardApplicationService {
    ApplicationsResponse list();
    ChangesResponse changes(int days);
    ApplicationDto update(UUID id, UpdateApplicationRequest request);
    void deletePermanently(UUID id);
}

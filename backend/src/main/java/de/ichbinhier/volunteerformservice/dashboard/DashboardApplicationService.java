package de.ichbinhier.volunteerformservice.dashboard;

import java.util.UUID;

import de.ichbinhier.volunteerformservice.dashboard.dto.ApplicationDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.ApplicationsResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.ChangesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.UpdateApplicationRequest;

public interface DashboardApplicationService {
    ApplicationsResponse list();
    ChangesResponse changes(int days);
    ApplicationDto update(UUID id, UpdateApplicationRequest request);
    void deletePermanently(UUID id);
}

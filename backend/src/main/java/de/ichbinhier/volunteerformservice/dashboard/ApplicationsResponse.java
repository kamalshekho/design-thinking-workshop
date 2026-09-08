package de.ichbinhier.volunteerformservice.dashboard;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationsResponse {
    private List<ApplicationDto> applications;
}


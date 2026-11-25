package de.ichbinhier.volunteerformservice.dashboard.dto.staff;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffMembersResponse {
    private List<StaffMemberResponse> members;
}


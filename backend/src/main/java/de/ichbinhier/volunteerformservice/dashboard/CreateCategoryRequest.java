package de.ichbinhier.volunteerformservice.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryRequest {
    private String name;
    private String description;
    private Boolean active;
}


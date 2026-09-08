package de.ichbinhier.volunteerformservice.web.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRouteSelection {
    private String categoryId;
    private String name;
    private int count;
}


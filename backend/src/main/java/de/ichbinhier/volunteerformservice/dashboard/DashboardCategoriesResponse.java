package de.ichbinhier.volunteerformservice.dashboard;

import java.util.List;

import de.ichbinhier.volunteerformservice.category.Category;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardCategoriesResponse {
    private List<CategoryDto> categories;

    /** The response for Categories already in display order. */
    static DashboardCategoriesResponse of(List<Category> ordered) {
        return new DashboardCategoriesResponse(ordered.stream().map(CategoryDto::of).toList());
    }
}


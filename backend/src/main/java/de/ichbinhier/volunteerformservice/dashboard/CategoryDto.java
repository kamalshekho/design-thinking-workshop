package de.ichbinhier.volunteerformservice.dashboard;

import java.util.UUID;

import de.ichbinhier.volunteerformservice.category.Category;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private UUID id;
    private String name;
    private String description;
    private boolean active;

    public static CategoryDto of(Category category) {
        return new CategoryDto(
            category.getId(),
            category.getName(),
            category.getDescription(),
            category.isActive());
    }
}


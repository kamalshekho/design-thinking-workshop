package de.ichbinhier.volunteerformservice.dashboard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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

    /** A Category name is 1–60 characters after trimming, as the contract says. */
    @NotBlank(message = "CATEGORY_NAME_REQUIRED")
    @Size(max = 60, message = "CATEGORY_NAME_TOO_LONG")
    public String getName() {
        return name != null ? name.trim() : null;
    }

    @Size(max = 140, message = "CATEGORY_DESCRIPTION_TOO_LONG")
    public String getDescription() {
        return description;
    }

}

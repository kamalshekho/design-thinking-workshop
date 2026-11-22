package de.ichbinhier.volunteerformservice.dashboard;

import java.util.UUID;

import de.ichbinhier.volunteerformservice.dashboard.dto.CategoryDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.CreateCategoryRequest;
import de.ichbinhier.volunteerformservice.dashboard.dto.DashboardCategoriesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.ReorderRequest;
import de.ichbinhier.volunteerformservice.dashboard.dto.UpdateCategoryRequest;

public interface DashboardCategoryService {
    DashboardCategoriesResponse list();
    CategoryDto create(CreateCategoryRequest request);
    CategoryDto update(UUID id, UpdateCategoryRequest request);
    void delete(UUID id);
    DashboardCategoriesResponse reorder(ReorderRequest request);
}

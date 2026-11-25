package de.ichbinhier.volunteerformservice.dashboard;

import java.util.UUID;

import de.ichbinhier.volunteerformservice.dashboard.dto.category.CategoryDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.CreateCategoryRequest;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.DashboardCategoriesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.ReorderRequest;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.UpdateCategoryRequest;

public interface DashboardCategoryService {
    DashboardCategoriesResponse list();
    CategoryDto create(CreateCategoryRequest request);
    CategoryDto update(UUID id, UpdateCategoryRequest request);
    void delete(UUID id);
    DashboardCategoriesResponse reorder(ReorderRequest request);
}

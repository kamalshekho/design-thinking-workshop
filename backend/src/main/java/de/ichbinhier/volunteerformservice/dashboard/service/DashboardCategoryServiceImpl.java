package de.ichbinhier.volunteerformservice.dashboard.service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.ichbinhier.volunteerformservice.application.repository.ApplicationRepository;
import de.ichbinhier.volunteerformservice.category.domain.Category;
import de.ichbinhier.volunteerformservice.category.repository.CategoryRepository;
import de.ichbinhier.volunteerformservice.dashboard.DashboardCategoryService;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.CategoryDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.CreateCategoryRequest;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.DashboardCategoriesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.ReorderRequest;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.UpdateCategoryRequest;
import de.ichbinhier.volunteerformservice.web.ApiException;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class DashboardCategoryServiceImpl implements DashboardCategoryService {

    private final CategoryRepository categoryRepo;
    private final ApplicationRepository appRepo;

    public DashboardCategoriesResponse list() {
        return DashboardCategoriesResponse.of(categoryRepo.findByOrderByDisplayOrderAsc());
    }

    public CategoryDto create(CreateCategoryRequest req) {
        String name = req.getName();
        String desc = req.getDescription() != null ? req.getDescription() : "";

        requireNameIsFree(name, null);

        Category cat = Category.builder()
            .name(name)
            .description(desc)
            .active(req.getActive() != null ? req.getActive() : true)
            .displayOrder(categoryRepo.findMaxDisplayOrder() + 1)
            .build();

        categoryRepo.save(cat);
        return CategoryDto.of(cat);
    }

    public CategoryDto update(
        UUID id,
        UpdateCategoryRequest req) {

        var cat = categoryRepo.findById(id)
            .orElseThrow(ApiException::notFound);

        if (req.getName() != null) {
            requireNameIsFree(req.getName(), id);
            cat.setName(req.getName());
        }

        if (req.getDescription() != null) {
            cat.setDescription(req.getDescription());
        }

        if (req.getActive() != null) {
            cat.setActive(req.getActive());
        }

        categoryRepo.save(cat);
        return CategoryDto.of(cat);
    }

    public void delete(UUID id) {
        categoryRepo.findById(id)
            .orElseThrow(ApiException::notFound);

        long count = appRepo.countByCategoryId(id);
        if (count > 0) {
            throw ApiException.categoryInUse();
        }

        categoryRepo.deleteById(id);
    }

    @Transactional
    public DashboardCategoriesResponse reorder(ReorderRequest req) {
        List<UUID> ids = req.getIds();
        Map<UUID, Category> byId = categoryRepo.findAll().stream()
            .collect(Collectors.toMap(Category::getId, Function.identity()));

        Set<UUID> sent = new HashSet<>(ids);
        if (sent.size() != ids.size() || !sent.equals(byId.keySet())) {
            throw orderIncomplete();
        }

        List<Category> ordered = ids.stream().map(byId::get).toList();
        for (int i = 0; i < ordered.size(); i++) {
            ordered.get(i).setDisplayOrder(i);
        }

        categoryRepo.saveAll(ordered);
        return DashboardCategoriesResponse.of(ordered);
    }

    private void requireNameIsFree(String name, UUID renaming) {
        Category existing = categoryRepo.findByNameIgnoreCase(name);
        if (existing != null && !existing.getId().equals(renaming)) {
            throw new FieldValidationException("name", "CATEGORY_NAME_TAKEN");
        }
    }

    private static FieldValidationException orderIncomplete() {
        return new FieldValidationException("ids", "ORDER_INCOMPLETE");
    }

}

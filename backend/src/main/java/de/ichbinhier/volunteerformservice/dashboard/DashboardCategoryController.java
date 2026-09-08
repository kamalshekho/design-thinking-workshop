package de.ichbinhier.volunteerformservice.dashboard;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.application.ApplicationRepository;
import de.ichbinhier.volunteerformservice.category.Category;
import de.ichbinhier.volunteerformservice.category.CategoryRepository;
import de.ichbinhier.volunteerformservice.web.ApiException;
import de.ichbinhier.volunteerformservice.web.FieldValidationException;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/staff/categories")
@RequiredArgsConstructor
public class DashboardCategoryController {

    private final CategoryRepository categoryRepo;
    private final ApplicationRepository appRepo;

    @GetMapping
    ResponseEntity<DashboardCategoriesResponse> list() {
        List<CategoryDto> cats = categoryRepo.findByOrderByDisplayOrderAsc().stream()
            .map(this::toDto)
            .toList();

        DashboardCategoriesResponse response = new DashboardCategoriesResponse();
        response.setCategories(cats);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(response);
    }

    @PostMapping
    ResponseEntity<CategoryDto> create(@Valid @RequestBody CreateCategoryRequest req) {
        String name = req.getName();
        String desc = req.getDescription() != null ? req.getDescription() : "";

        requireNameIsFree(name, null);

        int maxOrder = categoryRepo.findAll().stream()
            .mapToInt(Category::getDisplayOrder)
            .max()
            .orElse(0);

        Category cat = Category.builder()
            .name(name)
            .description(desc)
            .active(req.getActive() != null ? req.getActive() : true)
            .displayOrder(maxOrder + 1)
            .build();

        categoryRepo.save(cat);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(cat));
    }

    @PatchMapping("/{id}")
    ResponseEntity<CategoryDto> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateCategoryRequest req) {

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
        return ResponseEntity.ok(toDto(cat));
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable UUID id) {
        categoryRepo.findById(id)
            .orElseThrow(ApiException::notFound);

        long count = appRepo.countByCategoryId(id);
        if (count > 0) {
            throw ApiException.categoryInUse();
        }

        categoryRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/order")
    ResponseEntity<DashboardCategoriesResponse> reorder(@Valid @RequestBody ReorderRequest req) {
        Set<UUID> sent = new HashSet<>(req.getIds());
        if (sent.size() != req.getIds().size() || sent.size() != categoryRepo.count()) {
            throw orderIncomplete();
        }

        for (int i = 0; i < req.getIds().size(); i++) {
            var cat = categoryRepo.findById(req.getIds().get(i))
                .orElseThrow(DashboardCategoryController::orderIncomplete);

            cat.setDisplayOrder(i);
            categoryRepo.save(cat);
        }

        List<CategoryDto> cats = categoryRepo.findByOrderByDisplayOrderAsc().stream()
            .map(this::toDto)
            .toList();

        DashboardCategoriesResponse response = new DashboardCategoriesResponse();
        response.setCategories(cats);
        return ResponseEntity.ok(response);
    }

    /**
     * Two Categories may not share a name: an applicant reads it. Compared
     * case-insensitively after trimming, ignoring the Category being renamed.
     */
    private void requireNameIsFree(String name, UUID renaming) {
        Category existing = categoryRepo.findByNameIgnoreCase(name);
        if (existing != null && !existing.getId().equals(renaming)) {
            throw new FieldValidationException("name", "CATEGORY_NAME_TAKEN");
        }
    }

    private static FieldValidationException orderIncomplete() {
        return new FieldValidationException("ids", "ORDER_INCOMPLETE");
    }

    private CategoryDto toDto(Category cat) {
        CategoryDto dto = new CategoryDto();
        dto.setId(cat.getId());
        dto.setName(cat.getName());
        dto.setDescription(cat.getDescription());
        dto.setActive(cat.isActive());
        return dto;
    }

}

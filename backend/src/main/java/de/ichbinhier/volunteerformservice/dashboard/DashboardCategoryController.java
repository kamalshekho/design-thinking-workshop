package de.ichbinhier.volunteerformservice.dashboard;

import java.util.List;
import java.util.UUID;

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
    ResponseEntity<CategoryDto> create(@RequestBody CreateCategoryRequest req) {
        String name = req.getName() != null ? req.getName().trim() : "";
        String desc = req.getDescription() != null ? req.getDescription() : "";

        var existing = categoryRepo.findByNameIgnoreCase(name);
        if (existing != null) {
            return ResponseEntity.badRequest().build();
        }

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
        @RequestBody UpdateCategoryRequest req) {

        var cat = categoryRepo.findById(id)
            .orElse(null);

        if (cat == null) {
            return ResponseEntity.notFound().build();
        }

        if (req.getName() != null) {
            cat.setName(req.getName().trim());
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
        var cat = categoryRepo.findById(id)
            .orElse(null);

        if (cat == null) {
            return ResponseEntity.notFound().build();
        }

        long count = appRepo.countByCategoryId(id);
        if (count > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        categoryRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/order")
    ResponseEntity<DashboardCategoriesResponse> reorder(@RequestBody ReorderRequest req) {
        if (req.getIds().size() != categoryRepo.count()) {
            return ResponseEntity.badRequest().build();
        }

        for (int i = 0; i < req.getIds().size(); i++) {
            var cat = categoryRepo.findById(req.getIds().get(i))
                .orElse(null);

            if (cat == null) {
                return ResponseEntity.badRequest().build();
            }

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

    private CategoryDto toDto(Category cat) {
        CategoryDto dto = new CategoryDto();
        dto.setId(cat.getId());
        dto.setName(cat.getName());
        dto.setDescription(cat.getDescription());
        dto.setActive(cat.isActive());
        return dto;
    }

}

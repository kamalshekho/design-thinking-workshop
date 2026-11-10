package de.ichbinhier.volunteerformservice.dashboard;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
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
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(DashboardCategoriesResponse.of(categoryRepo.findByOrderByDisplayOrderAsc()));
    }

    @PostMapping
    ResponseEntity<CategoryDto> create(@Valid @RequestBody CreateCategoryRequest req) {
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
        return ResponseEntity.status(HttpStatus.CREATED).body(CategoryDto.of(cat));
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
        return ResponseEntity.ok(CategoryDto.of(cat));
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

    /**
     * One read for every Category and one batched write for the changed ones,
     * however many there are. The response is built from the same entities, in
     * the order just written, rather than read back.
     */
    @PutMapping("/order")
    @Transactional
    ResponseEntity<DashboardCategoriesResponse> reorder(@Valid @RequestBody ReorderRequest req) {
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
        return ResponseEntity.ok(DashboardCategoriesResponse.of(ordered));
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

}

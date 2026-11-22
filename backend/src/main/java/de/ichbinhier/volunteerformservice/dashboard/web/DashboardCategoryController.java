package de.ichbinhier.volunteerformservice.dashboard.web;

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

import de.ichbinhier.volunteerformservice.dashboard.DashboardCategoryService;
import de.ichbinhier.volunteerformservice.dashboard.dto.CategoryDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.CreateCategoryRequest;
import de.ichbinhier.volunteerformservice.dashboard.dto.DashboardCategoriesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.ReorderRequest;
import de.ichbinhier.volunteerformservice.dashboard.dto.UpdateCategoryRequest;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/staff/categories")
@RequiredArgsConstructor
public class DashboardCategoryController {

    private final DashboardCategoryService service;

    @GetMapping
    ResponseEntity<DashboardCategoriesResponse> list() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.list());
    }

    @PostMapping
    ResponseEntity<CategoryDto> create(@Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PatchMapping("/{id}")
    ResponseEntity<CategoryDto> update(@PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/order")
    ResponseEntity<DashboardCategoriesResponse> reorder(@Valid @RequestBody ReorderRequest request) {
        return ResponseEntity.ok(service.reorder(request));
    }
}

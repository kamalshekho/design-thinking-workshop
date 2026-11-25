package de.ichbinhier.volunteerformservice.dashboard.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

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
import de.ichbinhier.volunteerformservice.dashboard.dto.category.CategoryDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.CreateCategoryRequest;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.DashboardCategoriesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.ReorderRequest;
import de.ichbinhier.volunteerformservice.dashboard.dto.category.UpdateCategoryRequest;

import lombok.RequiredArgsConstructor;

@Tag(name = "Dashboard: Kategorien")
@RestController
@RequestMapping("/api/v1/staff/categories")
@RequiredArgsConstructor
public class DashboardCategoryController {

    private final DashboardCategoryService service;

    @Operation(summary = "Kategorien auflisten", security = @SecurityRequirement(name = "staffSession"))
    @GetMapping
    ResponseEntity<DashboardCategoriesResponse> list() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.list());
    }

    @Operation(summary = "Kategorie erstellen", security = @SecurityRequirement(name = "staffSession"))
    @ApiResponse(responseCode = "201", description = "Kategorie erstellt")
    @ApiResponse(responseCode = "400", description = "Eingaben ungültig", content = @Content)
    @PostMapping
    ResponseEntity<CategoryDto> create(@Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @Operation(summary = "Kategorie bearbeiten", security = @SecurityRequirement(name = "staffSession"))
    @PatchMapping("/{id}")
    ResponseEntity<CategoryDto> update(@PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @Operation(summary = "Kategorie löschen", security = @SecurityRequirement(name = "staffSession"))
    @ApiResponse(responseCode = "204", description = "Kategorie gelöscht", content = @Content)
    @ApiResponse(responseCode = "404", description = "Kategorie nicht gefunden", content = @Content)
    @ApiResponse(responseCode = "409", description = "Kategorie wird noch verwendet", content = @Content)
    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Kategorien sortieren", security = @SecurityRequirement(name = "staffSession"))
    @PutMapping("/order")
    ResponseEntity<DashboardCategoriesResponse> reorder(@Valid @RequestBody ReorderRequest request) {
        return ResponseEntity.ok(service.reorder(request));
    }
}

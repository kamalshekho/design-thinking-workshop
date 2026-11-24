package de.ichbinhier.volunteerformservice.category.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.category.CategoriesResponse;
import de.ichbinhier.volunteerformservice.category.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

@Tag(name = "Formular")
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categories;


    @Operation(summary = "Aktive Kategorien für das Formular laden")
    @GetMapping
    ResponseEntity<CategoriesResponse> list() {
        List<CategoriesResponse.Item> items =
                categories.findByActiveTrueOrderByDisplayOrderAsc().stream()
                        .map(category -> new CategoriesResponse.Item(
                                category.getId(), category.getName()))
                        .toList();

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .body(new CategoriesResponse(items));
    }

}


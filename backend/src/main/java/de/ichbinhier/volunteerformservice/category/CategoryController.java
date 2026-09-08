package de.ichbinhier.volunteerformservice.category;

import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categories;


    @GetMapping
    ResponseEntity<CategoriesResponse> list() {
        List<CategoriesResponse.Item> items =
                categories.findByActiveTrueOrderByDisplayOrderAsc().stream()
                        .map(category -> new CategoriesResponse.Item(
                                category.getId(), category.getName(), category.getDescription()))
                        .toList();

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .body(new CategoriesResponse(items));
    }

}


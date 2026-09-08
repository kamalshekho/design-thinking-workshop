package de.ichbinhier.volunteerformservice.category;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoriesResponse {
    List<Item> categories;

    // Field is "label", not "name" — see frontend/API.md, GET
    // /api/v1/categories. The frontend rejects any other shape as a load
    // failure rather than guessing (readCategories in application-form/api.ts).
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        UUID id;
        String label;
    }

}

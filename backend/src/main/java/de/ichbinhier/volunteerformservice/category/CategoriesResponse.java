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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        UUID id;
        String name;
        String description;
    }

}

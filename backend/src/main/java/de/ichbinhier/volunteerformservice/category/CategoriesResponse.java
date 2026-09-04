package de.ichbinhier.volunteerformservice.category;

import java.util.List;
import java.util.UUID;


public record CategoriesResponse(List<Item> categories) {

    public record Item(UUID id, String label) {}

}

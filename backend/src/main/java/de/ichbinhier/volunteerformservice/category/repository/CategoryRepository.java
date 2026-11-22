package de.ichbinhier.volunteerformservice.category.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import de.ichbinhier.volunteerformservice.category.domain.Category;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByActiveTrueOrderByDisplayOrderAsc();

    List<Category> findByOrderByDisplayOrderAsc();

    Category findByNameIgnoreCase(String name);

    /** The last position in the display order, or 0 while there are no Categories. */
    @Query("select coalesce(max(c.displayOrder), 0) from Category c")
    int findMaxDisplayOrder();

}

package de.ichbinhier.volunteerformservice.category.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.ichbinhier.volunteerformservice.category.domain.Category;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByActiveTrueOrderByDisplayOrderAsc();

    List<Category> findByOrderByDisplayOrderAsc();

    Category findByNameIgnoreCase(String name);

    /** The last position in the display order, or 0 while there are no Categories. */
    @Query("select coalesce(max(c.displayOrder), 0) from Category c")
    int findMaxDisplayOrder();

    /**
     * Adds one to the Category's selection count in the database, so two
     * selections at once both count. Answers 0 when no Category has this id.
     */
    @Modifying
    @Query(value = "update categories set selection_count = selection_count + 1 where id = :id",
            nativeQuery = true)
    int incrementSelectionCount(@Param("id") UUID id);

}

package de.ichbinhier.volunteerformservice.category;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;


public interface CategoryRepository extends JpaRepository<Category, UUID> {

    // activated categories
    List<Category> findByActiveTrueOrderByDisplayOrderAscLabelAsc();

}

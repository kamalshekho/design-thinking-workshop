package de.ichbinhier.volunteerformservice.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StateChangeRepository extends JpaRepository<StateChange, UUID> {
    List<StateChange> findByChangedAtGreaterThanEqualOrderByChangedAtAsc(Instant since);

    /**
     * Erasing an Application erases the rows that record its life; a caller runs
     * this before the Application itself, inside the same transaction. See
     * {@code dashboard/API.md}, "Erasing an Application erases its state
     * changes".
     */
    void deleteByApplicationId(UUID applicationId);
}

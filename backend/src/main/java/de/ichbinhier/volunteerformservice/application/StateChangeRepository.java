package de.ichbinhier.volunteerformservice.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StateChangeRepository extends JpaRepository<StateChange, UUID> {
    List<StateChange> findByChangedAtGreaterThanEqualOrderByChangedAtAsc(Instant since);
}

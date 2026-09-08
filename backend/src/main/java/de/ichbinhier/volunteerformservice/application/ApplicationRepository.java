package de.ichbinhier.volunteerformservice.application;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;


public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    Optional<Application> findBySubmissionId(UUID submissionId);

    List<Application> findAllByOrderBySubmittedAtDesc();

    long countByCategoryId(UUID categoryId);

}

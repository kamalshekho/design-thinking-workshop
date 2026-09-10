package de.ichbinhier.volunteerformservice.dashboard;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;


public interface RouteSelectionCounterRepository extends JpaRepository<RouteSelectionCounter, UUID> {

    Optional<RouteSelectionCounter> findByRoute(String route);

    List<RouteSelectionCounter> findAllByOrderByRouteAsc();

}

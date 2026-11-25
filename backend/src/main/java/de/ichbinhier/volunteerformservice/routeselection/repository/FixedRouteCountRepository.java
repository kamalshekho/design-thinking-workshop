package de.ichbinhier.volunteerformservice.routeselection.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import de.ichbinhier.volunteerformservice.routeselection.domain.FixedRoute;
import de.ichbinhier.volunteerformservice.routeselection.domain.FixedRouteCount;

public interface FixedRouteCountRepository extends JpaRepository<FixedRouteCount, FixedRoute> {

    /** Adds one in the database, so two selections at once both count. */
    @Modifying
    @Query(value = "update route_selection_counts set selection_count = selection_count + 1 where route = :route",
            nativeQuery = true)
    int increment(@Param("route") String route);

}

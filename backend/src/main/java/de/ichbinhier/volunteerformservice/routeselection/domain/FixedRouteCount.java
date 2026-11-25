package de.ichbinhier.volunteerformservice.routeselection.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * How often applicants picked one fixed route. V3 creates one row per route,
 * and {@link de.ichbinhier.volunteerformservice.routeselection.repository.FixedRouteCountRepository#increment}
 * is the only writer.
 */
@Entity
@Table(name = "route_selection_counts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FixedRouteCount {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "route", nullable = false, length = 32)
    private FixedRoute route;

    @Column(name = "selection_count", nullable = false, insertable = false, updatable = false)
    private long selectionCount;

}

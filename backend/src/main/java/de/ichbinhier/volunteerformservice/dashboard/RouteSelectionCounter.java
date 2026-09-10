package de.ichbinhier.volunteerformservice.dashboard;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Table(name = "route_selection_counters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteSelectionCounter {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "route", nullable = false, unique = true, length = 64)
    private String route;

    @Column(name = "count", nullable = false)
    @Builder.Default
    private int count = 0;

}

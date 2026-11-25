package de.ichbinhier.volunteerformservice.category.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Size(max = 60)
    @Column(name = "name", nullable = false, length = 60)
    private String name;

    @Size(max = 140)
    @Column(name = "description", length = 140)
    private String description;

    private int displayOrder;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * How often applicants picked this Category on the form (`A5`). Read-only
     * here: saving a Category must not write back a stale number, so only
     * {@code CategoryRepository#incrementSelectionCount} changes it.
     */
    @Column(name = "selection_count", nullable = false, insertable = false, updatable = false)
    private long selectionCount;

}

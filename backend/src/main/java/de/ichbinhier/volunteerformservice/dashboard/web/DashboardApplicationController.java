package de.ichbinhier.volunteerformservice.dashboard.web;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import de.ichbinhier.volunteerformservice.dashboard.DashboardApplicationService;
import de.ichbinhier.volunteerformservice.dashboard.dto.ApplicationDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.ApplicationsResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.ChangesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.UpdateApplicationRequest;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/staff/applications")
@RequiredArgsConstructor
public class DashboardApplicationController {

    private final DashboardApplicationService service;

    @GetMapping
    ResponseEntity<ApplicationsResponse> list() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.list());
    }

    @GetMapping("/changes")
    ResponseEntity<ChangesResponse> changes(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.changes(days));
    }

    @PatchMapping("/{id}")
    ResponseEntity<ApplicationDto> update(@PathVariable UUID id,
            @Valid @RequestBody UpdateApplicationRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}/permanently")
    ResponseEntity<Void> deletePermanently(@PathVariable UUID id) {
        service.deletePermanently(id);
        return ResponseEntity.noContent().build();
    }
}

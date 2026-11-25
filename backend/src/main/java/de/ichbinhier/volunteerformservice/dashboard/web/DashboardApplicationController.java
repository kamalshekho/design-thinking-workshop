package de.ichbinhier.volunteerformservice.dashboard.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

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
import de.ichbinhier.volunteerformservice.dashboard.dto.application.ApplicationDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.ApplicationsResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.ChangesResponse;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.UpdateApplicationRequest;

import lombok.RequiredArgsConstructor;

@Tag(name = "Dashboard: Bewerbungen")
@RestController
@RequestMapping("/api/v1/staff/applications")
@RequiredArgsConstructor
public class DashboardApplicationController {

    private final DashboardApplicationService service;

    @Operation(summary = "Bewerbungen auflisten", security = @SecurityRequirement(name = "staffSession"))
    @GetMapping
    ResponseEntity<ApplicationsResponse> list() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.list());
    }

    @Operation(summary = "Statusänderungen abrufen", security = @SecurityRequirement(name = "staffSession"))
    @GetMapping("/changes")
    ResponseEntity<ChangesResponse> changes(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.changes(days));
    }

    @Operation(summary = "Bewerbung bearbeiten", security = @SecurityRequirement(name = "staffSession"))
    @PatchMapping("/{id}")
    ResponseEntity<ApplicationDto> update(@PathVariable UUID id,
            @Valid @RequestBody UpdateApplicationRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @Operation(summary = "Ausgesonderte Bewerbung endgültig löschen", security = @SecurityRequirement(name = "staffSession"))
    @ApiResponse(responseCode = "204", description = "Bewerbung gelöscht", content = @Content)
    @ApiResponse(responseCode = "400", description = "Bewerbung ist nicht ausgesondert", content = @Content)
    @ApiResponse(responseCode = "404", description = "Bewerbung nicht gefunden", content = @Content)
    @DeleteMapping("/{id}/permanently")
    ResponseEntity<Void> deletePermanently(@PathVariable UUID id) {
        service.deletePermanently(id);
        return ResponseEntity.noContent().build();
    }
}

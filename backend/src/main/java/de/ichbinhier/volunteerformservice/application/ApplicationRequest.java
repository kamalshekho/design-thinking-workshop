package de.ichbinhier.volunteerformservice.application;

import java.util.UUID;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationRequest {
    @NotNull(message = "SUBMISSION_ID_REQUIRED")
    UUID submissionId;

    @NotNull(message = "CATEGORY_REQUIRED")
    UUID categoryId;

    @NotBlank(message = "NAME_REQUIRED")
    @Size(max = 120, message = "NAME_TOO_LONG")
    String name;

    @NotBlank(message = "EMAIL_REQUIRED")
    @Email(message = "EMAIL_INVALID")
    @Size(max = 254, message = "EMAIL_TOO_LONG")
    String email;

    @NotNull(message = "WEEKLY_TIME_REQUIRED")
    WeeklyTime weeklyTime;

    @Size(max = 2000, message = "ABOUT_TOO_LONG")
    String about;

    @AssertTrue(message = "CONSENT_REQUIRED")
    boolean privacyConsent;

    @NotBlank(message = "CONSENT_TEXT_VERSION_REQUIRED")
    @Size(max = 32, message = "CONSENT_TEXT_VERSION_REQUIRED")
    String consentTextVersion;

    String website;

    boolean looksLikeABot() {
        return website != null && !website.isBlank();
    }

}

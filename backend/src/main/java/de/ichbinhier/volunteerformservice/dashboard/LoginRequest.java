package de.ichbinhier.volunteerformservice.dashboard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "EMAIL_REQUIRED")
    private String email;

    /**
     * bcrypt reads no more than 72 bytes, so a longer password cannot be the
     * one that was hashed. {@code @Size} counts characters, so
     * {@link StaffAuthController} checks the byte count as well, for passwords
     * with characters outside ASCII.
     */
    @NotBlank(message = "PASSWORD_REQUIRED")
    @Size(max = StaffAuthController.BCRYPT_MAX_BYTES, message = "PASSWORD_TOO_LONG")
    private String password;

}

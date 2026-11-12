package de.ichbinhier.volunteerformservice.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;

/**
 * What {@code POST /api/v1/staff/session} accepts, and that a wrong address
 * cannot be told apart from a wrong password. Every test uses its own address,
 * for the reason {@link SignInTests} gives.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SignInRequestTests {

    private static final String PASSWORD = "correct horse";

    private static final String EMAIL = "ashton.blackwell@ichbinhier.online";

    @Autowired private MockMvc mvc;

    @Autowired private StaffRepository staffMembers;

    @MockitoSpyBean private PasswordEncoder passwordEncoder;

    @BeforeEach
    void reset() {
        staffMembers.deleteAll();
        staffMembers.save(Staff.builder()
                .name("Ashton Blackwell")
                .email(EMAIL)
                .passwordHash(passwordEncoder.encode(PASSWORD))
                .build());
        clearInvocations(passwordEncoder);
    }

    @Test
    void rejectsAnEmptyPasswordInTheErrorContract() throws Exception {
        signIn("{\"email\":\"" + EMAIL + "\",\"password\":\"\"}", "203.0.113.20")
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("password"))
                .andExpect(jsonPath("$.errors[0].code").value("PASSWORD_REQUIRED"));
    }

    @Test
    void rejectsAMissingEmailInTheErrorContract() throws Exception {
        signIn("{\"password\":\"" + PASSWORD + "\"}", "203.0.113.21")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("email"))
                .andExpect(jsonPath("$.errors[0].code").value("EMAIL_REQUIRED"));
    }

    @Test
    void rejectsAPasswordLongerThanBcryptReads() throws Exception {
        signIn(credentials(EMAIL, "x".repeat(73)), "203.0.113.22")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("password"))
                .andExpect(jsonPath("$.errors[0].code").value("PASSWORD_TOO_LONG"));
    }

    /** Forty characters, eighty bytes: within {@code @Size}, past bcrypt. */
    @Test
    void countsThePasswordLimitInBytes() throws Exception {
        signIn(credentials(EMAIL, "ä".repeat(40)), "203.0.113.23")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("password"))
                .andExpect(jsonPath("$.errors[0].code").value("PASSWORD_TOO_LONG"));

        verify(passwordEncoder, times(0)).matches(any(), anyString());
    }

    /**
     * An unknown address is compared against a hash too, so it takes as long
     * as a wrong password and answers the same.
     */
    @Test
    void answersAnUnknownAddressLikeAWrongPasswordAfterOneComparisonEach() throws Exception {
        MvcResult unknown = signIn(credentials("nobody@ichbinhier.online", "wrong"), "203.0.113.24")
                .andExpect(status().isUnauthorized())
                .andReturn();
        verify(passwordEncoder, times(1)).matches(any(), anyString());

        clearInvocations(passwordEncoder);

        MvcResult wrongPassword = signIn(credentials(EMAIL, "wrong"), "203.0.113.25")
                .andExpect(status().isUnauthorized())
                .andReturn();
        verify(passwordEncoder, times(1)).matches(any(), anyString());

        assertThat(unknown.getResponse().getContentAsString())
                .isEqualTo(wrongPassword.getResponse().getContentAsString())
                .contains("INVALID_CREDENTIALS");
        assertThat(unknown.getResponse().getContentType())
                .isEqualTo(wrongPassword.getResponse().getContentType());
    }

    private ResultActions signIn(String body, String address) throws Exception {
        return mvc.perform(post("/api/v1/staff/session")
                .with(request -> {
                    request.setRemoteAddr(address);
                    return request;
                })
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private static String credentials(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

}

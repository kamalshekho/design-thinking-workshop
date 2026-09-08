package de.ichbinhier.volunteerformservice.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import de.ichbinhier.volunteerformservice.staff.Staff;
import de.ichbinhier.volunteerformservice.staff.StaffRepository;

/**
 * A real Sign-in: twelve hours of sliding inactivity and throttling by address
 * rather than account lockout (`A17`, `A20`). See `dashboard/API.md`, "Sign-in
 * and staff members".
 *
 * <p>The durations are shortened to a second here so that inactivity can
 * actually be waited out, and every test that provokes a failure uses its own
 * address — the throttle is one bean for the whole context, and sharing an
 * address between tests would make them depend on their order.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = { "sign-in.inactivity=1s", "sign-in.attempt-limit=3" })
class SignInTests {

    private static final String PASSWORD = "correct horse";

    private static final String EMAIL = "ashton.blackwell@ichbinhier.online";

    @Autowired private MockMvc mvc;

    @Autowired private StaffRepository staffMembers;

    @Autowired private PasswordEncoder passwordEncoder;

    @BeforeEach
    void reset() {
        staffMembers.deleteAll();
        staffMembers.save(Staff.builder()
                .name("Ashton Blackwell")
                .email(EMAIL)
                .passwordHash(passwordEncoder.encode(PASSWORD))
                .build());
    }

    @Test
    void signsAStaffMemberInAndRecognisesThemAfterwards() throws Exception {
        MvcResult signedIn = signIn(EMAIL, PASSWORD, "203.0.113.1")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ashton Blackwell"))
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andReturn();

        assertThat(signedIn.getResponse().getHeader(HttpHeaders.SET_COOKIE))
                .contains("ibh_session=")
                .contains("HttpOnly")
                .contains("Secure")
                .contains("SameSite=Strict")
                .contains("Path=/")
                .contains("Max-Age=1");

        mvc.perform(get("/api/v1/staff/me").cookie(cookieFrom(signedIn)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ashton Blackwell"));
    }

    /**
     * Sliding inactivity is only sliding if the cookie moves with it — a
     * `Max-Age` fixed at sign-in would expire on the hour whatever the Staff
     * member did in between.
     */
    @Test
    void writesTheCookieAgainOnEveryAuthenticatedResponse() throws Exception {
        Cookie signIn = cookieFrom(signIn(EMAIL, PASSWORD, "203.0.113.2").andReturn());

        MvcResult afterAWhile = mvc.perform(get("/api/v1/staff/me").cookie(signIn))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(afterAWhile.getResponse().getHeader(HttpHeaders.SET_COOKIE))
                .contains("ibh_session=" + signIn.getValue())
                .contains("Max-Age=1");
    }

    @Test
    void endsTheSignInAfterTheInactivityItAllows() throws Exception {
        Cookie signIn = cookieFrom(signIn(EMAIL, PASSWORD, "203.0.113.3").andReturn());

        Thread.sleep(1200);

        mvc.perform(get("/api/v1/staff/me").cookie(signIn))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void endsTheSignInOnSignOutAndClearsTheCookieOnce() throws Exception {
        Cookie signIn = cookieFrom(signIn(EMAIL, PASSWORD, "203.0.113.4").andReturn());

        MvcResult signedOut = mvc.perform(delete("/api/v1/staff/session").cookie(signIn))
                .andExpect(status().isNoContent())
                .andReturn();

        List<String> cookies = signedOut.getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(cookies).hasSize(1);
        assertThat(cookies.getFirst()).contains("Max-Age=0");

        mvc.perform(get("/api/v1/staff/me").cookie(signIn))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void answersASignOutWithoutASignInAlike() throws Exception {
        mvc.perform(delete("/api/v1/staff/session"))
                .andExpect(status().isNoContent());
    }

    @Test
    void throttlesAnAddressThatKeepsGuessing() throws Exception {
        String address = "203.0.113.5";

        for (int attempt = 1; attempt <= 3; attempt++) {
            signIn(EMAIL, "wrong", address)
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
        }

        signIn(EMAIL, "wrong", address)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"))
                .andExpect(result -> assertThat(result.getResponse().getHeader(HttpHeaders.RETRY_AFTER))
                        .isNotNull());
    }

    /**
     * The throttle is read before the password is verified, so a throttled
     * address is told nothing about whether it guessed right — and no bcrypt
     * comparison is spent on it (`A20`).
     */
    @Test
    void answersAThrottledAddressBeforeCheckingItsPassword() throws Exception {
        String address = "203.0.113.6";
        exhaust(address);

        signIn(EMAIL, PASSWORD, address)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    /**
     * There is deliberately no account lockout: five staff members share one
     * account each and have no administrator to release them (`A17`), so a
     * throttled address must not follow the account around.
     */
    @Test
    void leavesTheAccountUsableFromAnotherAddress() throws Exception {
        exhaust("203.0.113.7");

        signIn(EMAIL, PASSWORD, "203.0.113.8")
                .andExpect(status().isOk());
    }

    @Test
    void forgetsAnAddressThatGetsIn() throws Exception {
        String address = "203.0.113.9";
        signIn(EMAIL, "wrong", address).andExpect(status().isUnauthorized());
        signIn(EMAIL, "wrong", address).andExpect(status().isUnauthorized());

        signIn(EMAIL, PASSWORD, address).andExpect(status().isOk());

        for (int attempt = 1; attempt <= 3; attempt++) {
            signIn(EMAIL, "wrong", address).andExpect(status().isUnauthorized());
        }
    }

    /**
     * Both nginx configs and the Vite proxy stand in front of the backend, so
     * without {@code server.forward-headers-strategy} every request would carry
     * the proxy's address and one person's typing mistakes would throttle all
     * five staff members at once.
     */
    @Test
    void tellsCallersApartByTheirForwardedAddress() throws Exception {
        exhaustForwarded("203.0.113.10");

        mvc.perform(post("/api/v1/staff/session")
                        .header("X-Forwarded-For", "203.0.113.11")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials(EMAIL, PASSWORD)))
                .andExpect(status().isOk());
    }

    private void exhaust(String address) throws Exception {
        for (int attempt = 1; attempt <= 3; attempt++) {
            signIn(EMAIL, "wrong", address).andExpect(status().isUnauthorized());
        }
    }

    private void exhaustForwarded(String address) throws Exception {
        for (int attempt = 1; attempt <= 3; attempt++) {
            mvc.perform(post("/api/v1/staff/session")
                            .header("X-Forwarded-For", address)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(credentials(EMAIL, "wrong")))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/v1/staff/session")
                        .header("X-Forwarded-For", address)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials(EMAIL, "wrong")))
                .andExpect(status().isTooManyRequests());
    }

    private ResultActions signIn(String email, String password, String address) throws Exception {
        return mvc.perform(post("/api/v1/staff/session")
                .with(request -> {
                    request.setRemoteAddr(address);
                    return request;
                })
                .contentType(MediaType.APPLICATION_JSON)
                .content(credentials(email, password)));
    }

    private static String credentials(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

    private static Cookie cookieFrom(MvcResult result) {
        Cookie cookie = result.getResponse().getCookie("ibh_session");
        assertThat(cookie).isNotNull();
        return cookie;
    }

}

package de.ichbinhier.volunteerformservice.web.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import de.ichbinhier.volunteerformservice.staff.Staff;

/**
 * The sweep that drops expired Sign-ins nobody presents again. Tested without
 * Spring, with the sweep's clock moved forward, so the twelve hours of `A17`
 * stay twelve hours here.
 */
class SignInsTests {

    private static final Duration INACTIVITY = Duration.ofHours(12);

    @Test
    void dropsASignInThatHasExpired() {
        SignIns signIns = signIns();
        String token = signIns.open(staff());

        signIns.sweepExpiredBy(Instant.now().plus(INACTIVITY).plusSeconds(60));

        assertThat(signIns.touch(token)).isEmpty();
    }

    @Test
    void keepsASignInThatIsStillValid() {
        SignIns signIns = signIns();
        Staff staff = staff();
        String token = signIns.open(staff);

        signIns.sweepExpiredBy(Instant.now().plus(INACTIVITY).minusSeconds(60));

        assertThat(signIns.touch(token)).contains(staff.getId());
    }

    private static SignIns signIns() {
        SignInProperties properties = new SignInProperties();
        properties.setInactivity(INACTIVITY);
        return new SignIns(properties);
    }

    private static Staff staff() {
        return Staff.builder().id(UUID.randomUUID()).name("Ashton Blackwell").build();
    }

}

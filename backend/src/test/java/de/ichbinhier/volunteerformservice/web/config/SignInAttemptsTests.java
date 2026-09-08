package de.ichbinhier.volunteerformservice.web.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.Test;

/**
 * The counter behind `429 RATE_LIMITED` (`A20`). Tested without Spring, because
 * the invented numbers are the whole subject and a window measured in
 * milliseconds is the only way to watch one lapse.
 */
class SignInAttemptsTests {

    private static final String ADDRESS = "203.0.113.7";

    @Test
    void letsTheLimitThroughAndThrottlesTheNextAttempt() {
        SignInAttempts attempts = attempts(3, Duration.ofMinutes(15), 100);

        for (int attempt = 1; attempt <= 3; attempt++) {
            assertThat(attempts.throttleFor(ADDRESS)).isEmpty();
            attempts.failed(ADDRESS);
        }

        assertThat(attempts.throttleFor(ADDRESS)).isPresent();
    }

    @Test
    void tellsAThrottledAddressHowLongItHasToWait() {
        SignInAttempts attempts = attempts(1, Duration.ofMinutes(15), 100);
        attempts.failed(ADDRESS);

        assertThat(attempts.throttleFor(ADDRESS))
                .hasValueSatisfying(wait -> assertThat(wait)
                        .isPositive()
                        .isLessThanOrEqualTo(Duration.ofMinutes(15)));
    }

    @Test
    void forgetsTheRunOnceTheWindowLapses() throws Exception {
        SignInAttempts attempts = attempts(1, Duration.ofMillis(50), 100);
        attempts.failed(ADDRESS);
        assertThat(attempts.throttleFor(ADDRESS)).isPresent();

        Thread.sleep(80);

        assertThat(attempts.throttleFor(ADDRESS)).isEmpty();
    }

    @Test
    void clearsTheAddressOnASuccessfulSignIn() {
        SignInAttempts attempts = attempts(1, Duration.ofMinutes(15), 100);
        attempts.failed(ADDRESS);

        attempts.succeeded(ADDRESS);

        assertThat(attempts.throttleFor(ADDRESS)).isEmpty();
    }

    @Test
    void throttlesOneAddressWithoutTouchingAnother() {
        SignInAttempts attempts = attempts(1, Duration.ofMinutes(15), 100);
        attempts.failed(ADDRESS);

        assertThat(attempts.throttleFor("198.51.100.4")).isEmpty();
    }

    /**
     * A throttle put up against password guessing must not become a way to fill
     * the heap from a changing address, so the store is bounded and drops every
     * run at once when it fills.
     */
    @Test
    void dropsEveryRunWhenItRunsOutOfRoomForAddresses() {
        SignInAttempts attempts = attempts(1, Duration.ofMinutes(15), 2);
        attempts.failed(ADDRESS);
        attempts.failed("198.51.100.4");

        attempts.failed("192.0.2.9");

        assertThat(List.of(
                attempts.throttleFor(ADDRESS),
                attempts.throttleFor("198.51.100.4")))
                .allSatisfy(wait -> assertThat(wait).isEmpty());
        assertThat(attempts.throttleFor("192.0.2.9")).isPresent();
    }

    private static SignInAttempts attempts(int limit, Duration window, int addressLimit) {
        SignInProperties properties = new SignInProperties();
        properties.setAttemptLimit(limit);
        properties.setAttemptWindow(window);
        properties.setAttemptAddressLimit(addressLimit);
        return new SignInAttempts(properties);
    }

}

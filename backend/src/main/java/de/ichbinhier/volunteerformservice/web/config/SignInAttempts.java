package de.ichbinhier.volunteerformservice.web.config;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Failed sign-ins per address, so that repeated guessing meets
 * {@code 429 RATE_LIMITED} (`A20`). Deliberately not an account lockout: with
 * five staff members and no administrator, a locked account stays locked
 * (`A17`).
 *
 * <p>Separate from {@link SignIns} because a failed attempt and an open Sign-in
 * are different things with different lifetimes — a quarter of an hour against
 * twelve hours — and because this is read before a Sign-in exists at all.
 */
@Component
public class SignInAttempts {

    private static final Logger log = LoggerFactory.getLogger(SignInAttempts.class);

    private final ConcurrentHashMap<String, FailureRun> byAddress = new ConcurrentHashMap<>();

    private final int limit;

    private final Duration window;

    private final int addressLimit;

    SignInAttempts(SignInProperties properties) {
        this.limit = properties.getAttemptLimit();
        this.window = properties.getAttemptWindow();
        this.addressLimit = properties.getAttemptAddressLimit();
    }

    /**
     * How long this address has to wait, or empty when it may try. Read before
     * the password is verified, so a throttled address is told nothing about
     * whether it guessed right and costs us no bcrypt comparison (`A20`).
     */
    public Optional<Duration> throttleFor(String address) {
        Instant now = Instant.now();
        FailureRun run = byAddress.compute(address, (ignored, existing) -> {
            if (existing == null || existing.hasLapsedBy(now, window)) {
                return null;
            }
            return existing;
        });

        if (run == null || run.count() < limit) {
            return Optional.empty();
        }
        return Optional.of(run.remainingOf(now, window));
    }

    /** Records a failure, starting a fresh run when the last one has lapsed. */
    public void failed(String address) {
        Instant now = Instant.now();
        forgetEverythingIfFull(address);
        byAddress.compute(address, (ignored, existing) -> {
            if (existing == null || existing.hasLapsedBy(now, window)) {
                return new FailureRun(1, now);
            }
            return existing.andAnother();
        });
    }

    /** A Staff member who got in is not guessing, so the address is cleared. */
    public void succeeded(String address) {
        byAddress.remove(address);
    }

    /**
     * The bound from {@code sign-in.attempt-address-limit}. Dropping every run
     * at once, rather than sweeping the oldest, keeps this store free of an
     * eviction order to maintain; the cost of being wrong is that a guessing
     * address gets its allowance back, which is what an unbounded map would
     * have given it anyway.
     */
    private void forgetEverythingIfFull(String address) {
        if (byAddress.size() >= addressLimit && !byAddress.containsKey(address)) {
            log.warn("Remembering {} addresses with failed sign-ins, the limit; dropping all of them",
                    byAddress.size());
            byAddress.clear();
        }
    }

    private record FailureRun(int count, Instant firstAt) {

        boolean hasLapsedBy(Instant now, Duration window) {
            return firstAt.plus(window).isBefore(now);
        }

        Duration remainingOf(Instant now, Duration window) {
            Duration left = Duration.between(now, firstAt.plus(window));
            return left.isNegative() ? Duration.ZERO : left;
        }

        FailureRun andAnother() {
            return new FailureRun(count + 1, firstAt);
        }

    }

}

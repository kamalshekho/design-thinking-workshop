package de.ichbinhier.volunteerformservice.web.config;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import de.ichbinhier.volunteerformservice.staff.Staff;

/**
 * Every open Sign-in, keyed by the opaque token that travels in the
 * {@code ibh_session} cookie.
 *
 * <p>Two shapes here are decisions rather than details (`A17`). The store is
 * the backend's memory rather than a table, so a restart ends every Sign-in at
 * once — at five staff members that is cheaper than a Sign-in entity nobody
 * queries. And a Sign-in holds a Staff member's <em>id</em>, not the row: a
 * detached entity kept for twelve hours would answer {@code GET /me} with a
 * name that has since been corrected, and a Staff member deleted mid-Sign-in
 * would live on as a ghost in this map.
 */
@Component
public class SignIns {

    private static final SecureRandom RANDOM = new SecureRandom();

    private static final int TOKEN_BYTES = 32;

    private final ConcurrentHashMap<String, OpenSignIn> byToken = new ConcurrentHashMap<>();

    private final Duration inactivity;

    SignIns(SignInProperties properties) {
        this.inactivity = properties.getInactivity();
    }

    /** Opens a Sign-in and answers the token the cookie carries. */
    public String open(Staff staff) {
        String token = freshToken();
        byToken.put(token, new OpenSignIn(staff.getId(), Instant.now()));
        return token;
    }

    /**
     * The Staff member this token signs in, sliding the Sign-in's expiry forward
     * in the same step — reading a Sign-in <em>is</em> the activity that keeps it
     * alive. An expired Sign-in is dropped here rather than by a sweep: at this
     * volume the only entry worth evicting is one someone has just asked for.
     */
    public Optional<UUID> touch(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        Instant now = Instant.now();
        OpenSignIn open = byToken.compute(token, (ignored, existing) -> {
            if (existing == null || existing.hasExpiredBy(now, inactivity)) {
                return null;
            }
            return existing.seenAt(now);
        });

        return Optional.ofNullable(open).map(OpenSignIn::staffId);
    }

    /** Ends the Sign-in. Answers alike whether or not the token named one. */
    public void close(String token) {
        if (token != null) {
            byToken.remove(token);
        }
    }

    /** How long a cookie may live before inactivity would have ended the Sign-in. */
    public Duration getInactivity() {
        return inactivity;
    }

    private static String freshToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private record OpenSignIn(UUID staffId, Instant lastSeen) {

        boolean hasExpiredBy(Instant now, Duration inactivity) {
            return lastSeen.plus(inactivity).isBefore(now);
        }

        OpenSignIn seenAt(Instant now) {
            return new OpenSignIn(staffId, now);
        }

    }

}

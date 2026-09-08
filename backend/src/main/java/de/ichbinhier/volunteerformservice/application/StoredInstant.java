package de.ichbinhier.volunteerformservice.application;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * The clock every timestamp the platform stores is read from.
 *
 * <p>A timestamp column keeps microseconds, in Postgres and in H2 alike, so an
 * {@code Instant.now()} taken at nanosecond precision comes back from a read
 * three digits shorter than it went in. The dashboard receives the same
 * Application from three places — the list, a {@code PATCH} response and the
 * live stream — and `dashboard/API.md` promises the stream's {@code data} is
 * exactly what the list returns, so a value held in memory has to be a value
 * the database can hold.
 *
 * <p>Hibernate already truncates the timestamps it generates itself, which is
 * why {@code submittedAt} never drifted and the ones we mint did.
 */
public final class StoredInstant {

    public static Instant now() {
        return Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    private StoredInstant() {}

}

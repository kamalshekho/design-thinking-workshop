package de.ichbinhier.volunteerformservice.application;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

/**
 * How many Applications one email address may submit in a window (`A26`).
 * Every Application sends a confirmation email to the address it names, so
 * without a limit the form could send any number of mails to a stranger.
 */
@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "application-limit")
public class ApplicationLimitProperties {

    /** Applications one email address may submit inside {@link #window} (`A26`). */
    private int perEmail = 3;

    /** How far back Applications from the same email address count (`A26`). */
    private Duration window = Duration.ofHours(24);

}

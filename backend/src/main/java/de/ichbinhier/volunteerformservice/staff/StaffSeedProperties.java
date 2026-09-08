package de.ichbinhier.volunteerformservice.staff;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.Getter;
import lombok.Setter;

/**
 * The initial passwords for the seeded accounts, one per Staff member, supplied
 * as environment variables and never as a literal in this repo (`A17`). The
 * placeholders live in {@code application.properties}, so an unset variable
 * arrives here as an empty string rather than as a missing property.
 */
@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "staff")
public class StaffSeedProperties {

    private List<String> seedPasswords = new ArrayList<>();

    /**
     * The password for the account at {@code position} — 1-based, matching the
     * name of the variable a person has to set.
     *
     * @throws IllegalStateException when the variable is unset, naming it. An
     *     account that cannot be created is worth refusing to start over: the
     *     alternative is a dashboard nobody can sign in to, failing later and
     *     less clearly.
     */
    public String passwordFor(int position) {
        String password = position <= seedPasswords.size() ? seedPasswords.get(position - 1) : null;
        if (!StringUtils.hasText(password)) {
            throw new IllegalStateException(
                    "STAFF_" + position + "_PASSWORD is not set, so the seeded staff account "
                            + position + " of " + StaffSeeder.MEMBERS.size()
                            + " cannot be created. See .env.example.");
        }
        return password;
    }

}

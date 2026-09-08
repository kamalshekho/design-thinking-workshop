package de.ichbinhier.volunteerformservice.email;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.Getter;

@Component
@Getter
@ConfigurationProperties(prefix = "resend")
public class ResendProperties {

    // From the Resend dashboard — never committed, set via RESEND_API_KEY (see .env.example)
    private String apiKey;

    // Must stay onboarding@resend.dev until a domain is verified in Resend;
    // a verified domain can then send to any address, not only our own.
    private String from = "onboarding@resend.dev";


    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    // Docker Compose passes RESEND_FROM through as "" when it is set but
    // empty in .env — a distinct case from unset, and one Spring's own
    // property-placeholder default (${RESEND_FROM:onboarding@resend.dev})
    // does not catch, since a present-but-empty value still counts as
    // present. An explicit blank means "use the default", same as unset.
    public void setFrom(String from) {
        if (StringUtils.hasText(from)) {
            this.from = from;
        }
    }

}

package de.ichbinhier.volunteerformservice.onboarding;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.Getter;

@Component
@Getter
@ConfigurationProperties(prefix = "onboarding")
public class OnboardingProperties {

    private String baseUrl = "http://localhost:8081";

    public void setBaseUrl(String baseUrl) {
        if (StringUtils.hasText(baseUrl)) {
            this.baseUrl = baseUrl.replaceAll("/+$", "");
        }
    }

    public String linkFor(String token) {
        return baseUrl + "/onboarding/" + token;
    }

}

package de.ichbinhier.volunteerformservice.email;

import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Conditional;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

// Talks to the Resend HTTP API directly — resend.com has no official Java
// SDK, and the API is one POST request, so a client library would be more
// code than it saves. Active only when resend.api-key is set to a non-blank
// value; otherwise NoopEmailSender takes over (see its class comment).
//
// Both this class and NoopEmailSender evaluate resend.api-key directly
// (negations of each other) rather than one depending on "is the other bean
// present" — @ConditionalOnMissingBean on plain @Component classes has no
// guaranteed evaluation order, which is exactly the kind of bug that is
// silent until the day it flips.
@Component
@Conditional(HasResendApiKey.class)
public class ResendEmailSender implements EmailSender {

    private final RestClient client;
    private final String fromAddress;


    public ResendEmailSender(ResendProperties properties) {
        this.fromAddress = properties.getFrom();
        this.client = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + properties.getApiKey())
                .build();
    }


    @Override
    public void send(String toAddress, String subject, String htmlBody) {
        client.post()
                .uri("/emails")
                .body(Map.of(
                        "from", fromAddress,
                        "to", List.of(toAddress),
                        "subject", subject,
                        "html", htmlBody))
                .retrieve()
                .toBodilessEntity();
    }

}

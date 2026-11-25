package de.ichbinhier.volunteerformservice.email;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

// Priority of EmailSender implementations:
// 1. ResendEmailSender when resend.api-key is non-blank (HasResendApiKey)
// 2. SmtpEmailSender when resend.api-key is blank and spring.mail.host is non-blank (SmtpConfigured)
// 3. NoopEmailSender when neither is configured (NoProvider)
// Evaluating properties directly ensures exactly one EmailSender bean always exists.
class HasResendApiKey implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String apiKey = context.getEnvironment().getProperty("resend.api-key");
        return StringUtils.hasText(apiKey);
    }

    private static boolean hasSmtpHost(ConditionContext context) {
        String host = context.getEnvironment().getProperty("spring.mail.host");
        return StringUtils.hasText(host);
    }

    static class SmtpConfigured implements Condition {

        private final HasResendApiKey resend = new HasResendApiKey();

        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            return !resend.matches(context, metadata) && hasSmtpHost(context);
        }

    }

    static class NoProvider implements Condition {

        private final HasResendApiKey resend = new HasResendApiKey();

        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            return !resend.matches(context, metadata) && !hasSmtpHost(context);
        }

    }

}

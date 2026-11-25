package de.ichbinhier.volunteerformservice.email;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

/**
 * Selects exactly one {@link EmailSender} implementation by environment
 * property precedence: Resend ({@code resend.api-key}) over SMTP
 * ({@code spring.mail.host}) over {@link NoopEmailSender}.
 */
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

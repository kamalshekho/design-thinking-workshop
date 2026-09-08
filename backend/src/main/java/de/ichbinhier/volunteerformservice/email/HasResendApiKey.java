package de.ichbinhier.volunteerformservice.email;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

// True exactly when resend.api-key resolves to a non-blank value. Shared by
// ResendEmailSender (@Conditional(HasResendApiKey.class)) and NoopEmailSender
// (its negation), so exactly one EmailSender bean always exists — see the
// comment on ResendEmailSender for why this isn't @ConditionalOnMissingBean.
class HasResendApiKey implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String apiKey = context.getEnvironment().getProperty("resend.api-key");
        return StringUtils.hasText(apiKey);
    }


    static class NotSet implements Condition {

        private final HasResendApiKey delegate = new HasResendApiKey();

        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            return !delegate.matches(context, metadata);
        }

    }

}

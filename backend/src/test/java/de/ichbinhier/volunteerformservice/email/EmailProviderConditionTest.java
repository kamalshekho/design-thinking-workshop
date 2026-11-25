package de.ichbinhier.volunteerformservice.email;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.mock.env.MockEnvironment;

class EmailProviderConditionTest {

    @Test
    void resendTakesPrecedenceOverSmtpAndNoop() {
        ConditionContext context = contextWith("re_123", "mailpit");
        assertThat(new HasResendApiKey().matches(context, null)).isTrue();
        assertThat(new HasResendApiKey.SmtpConfigured().matches(context, null)).isFalse();
        assertThat(new HasResendApiKey.NoProvider().matches(context, null)).isFalse();
    }

    @Test
    void smtpTakesPrecedenceOverNoopWhenResendUnset() {
        ConditionContext context = contextWith("", "mailpit");
        assertThat(new HasResendApiKey().matches(context, null)).isFalse();
        assertThat(new HasResendApiKey.SmtpConfigured().matches(context, null)).isTrue();
        assertThat(new HasResendApiKey.NoProvider().matches(context, null)).isFalse();
    }

    @Test
    void noopIsActiveWhenNeitherIsConfigured() {
        ConditionContext context = contextWith("", "");
        assertThat(new HasResendApiKey().matches(context, null)).isFalse();
        assertThat(new HasResendApiKey.SmtpConfigured().matches(context, null)).isFalse();
        assertThat(new HasResendApiKey.NoProvider().matches(context, null)).isTrue();
    }

    private static ConditionContext contextWith(String resendKey, String smtpHost) {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("resend.api-key", resendKey);
        env.setProperty("spring.mail.host", smtpHost);
        ConditionContext context = mock(ConditionContext.class);
        when(context.getEnvironment()).thenReturn(env);
        return context;
    }

}

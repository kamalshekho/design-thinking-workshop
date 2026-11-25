package de.ichbinhier.volunteerformservice.dashboard.service;

import static java.util.stream.Collectors.joining;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter.SseEventBuilder;

import de.ichbinhier.volunteerformservice.onboarding.OnboardingProperties;

/**
 * The scheduler fires every 20 seconds, longer than any test runs, so these
 * tests call one heartbeat pass directly. The open connections are mocks put
 * straight into the registry: a real emitter only writes once Spring MVC has
 * attached it to a response.
 */
class ApplicationEventStreamHeartbeatTest {

    private ApplicationEventStream stream;

    private List<SseEmitter> openConnections;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void createStream() {
        stream = new ApplicationEventStream(new OnboardingProperties());
        openConnections = (List<SseEmitter>) ReflectionTestUtils.getField(stream, "emitters");
    }

    @AfterEach
    void stopStream() {
        stream.stopHeartbeats();
    }

    @Test
    void sendsAHeartbeatCommentToEveryOpenConnection() throws Exception {
        SseEmitter first = connection();
        SseEmitter second = connection();

        stream.heartbeat();

        assertThat(wireFormOf(sentTo(first))).isEqualTo(":heartbeat\n\n");
        assertThat(wireFormOf(sentTo(second))).isEqualTo(":heartbeat\n\n");
        assertThat(openConnections).containsExactly(first, second);
    }

    @Test
    void dropsAConnectionWhoseWriteFailsAndStillReachesTheRest() throws Exception {
        SseEmitter closed = connection();
        doThrow(new IOException("Broken pipe")).when(closed).send(any(SseEventBuilder.class));
        SseEmitter failing = connection();
        doThrow(new IllegalArgumentException("unexpected")).when(failing)
                .send(any(SseEventBuilder.class));
        SseEmitter healthy = connection();

        stream.heartbeat();

        assertThat(wireFormOf(sentTo(healthy))).isEqualTo(":heartbeat\n\n");
        assertThat(openConnections).containsExactly(healthy);
    }

    @Test
    void stopsTheSchedulerOnShutdown() {
        stream.startHeartbeats();

        stream.stopHeartbeats();

        ScheduledExecutorService heartbeats = (ScheduledExecutorService)
                ReflectionTestUtils.getField(stream, "heartbeats");
        assertThat(heartbeats.isShutdown()).isTrue();
    }

    private SseEmitter connection() {
        SseEmitter emitter = mock(SseEmitter.class);
        openConnections.add(emitter);
        return emitter;
    }

    private static SseEventBuilder sentTo(SseEmitter emitter) throws IOException {
        ArgumentCaptor<SseEventBuilder> sent = ArgumentCaptor.forClass(SseEventBuilder.class);
        verify(emitter).send(sent.capture());
        return sent.getValue();
    }

    private static String wireFormOf(SseEventBuilder event) {
        return event.build().stream()
                .map(part -> part.getData().toString())
                .collect(joining());
    }

}

package de.ichbinhier.volunteerformservice.dashboard.service;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import de.ichbinhier.volunteerformservice.application.ApplicationSubmitted;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.ApplicationDto;
import de.ichbinhier.volunteerformservice.dashboard.dto.application.OnboardingDto;
import de.ichbinhier.volunteerformservice.onboarding.OnboardingProperties;
import de.ichbinhier.volunteerformservice.onboarding.OnboardingStepChanged;

import lombok.RequiredArgsConstructor;

/**
 * Every open dashboard's live stream, and the only place the three event types
 * of `dashboard/API.md`, "The live stream", are sent from. An event goes to
 * every open stream, the originator's included: suppressing the originator's
 * own event would mean two code paths for one state change.
 *
 * <p>Requests are served by many threads, so the registry and the event
 * counter are touched concurrently, and two threads can reach the same
 * connection at once — a broadcast and the heartbeat. Hence the copy-on-write
 * registry, the atomic counter, and one lock per emitter around the write
 * itself.
 *
 * <p>One scheduler thread sends the heartbeat to every open connection. A
 * thread per connection held a platform thread for each open dashboard: the
 * load test in `load-test/RESULTS.md` measured 1,000 open streams as 1,244 JVM
 * threads.
 */
@Component
@RequiredArgsConstructor
public class ApplicationEventStream {

    private static final long HEARTBEAT_INTERVAL_MILLIS = 20000;

    private static final long CONNECTION_TIMEOUT_MILLIS = 3600000;

    private final OnboardingProperties onboardingProperties;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    private final AtomicLong eventCounter = new AtomicLong();

    private final ScheduledExecutorService heartbeats = Executors.newSingleThreadScheduledExecutor(
            Thread.ofPlatform().name("dashboard-heartbeat").daemon().factory());

    @PostConstruct
    void startHeartbeats() {
        heartbeats.scheduleAtFixedRate(this::heartbeat,
                HEARTBEAT_INTERVAL_MILLIS, HEARTBEAT_INTERVAL_MILLIS, TimeUnit.MILLISECONDS);
    }

    @PreDestroy
    void stopHeartbeats() {
        heartbeats.shutdownNow();
    }

    /**
     * A fresh connection, registered and kept alive by a comment heartbeat
     * every 20 seconds — which also makes a dead network visible in seconds
     * rather than at the timeout. The first heartbeat goes out at once, so the
     * response headers reach the dashboard without waiting for an event.
     */
    public SseEmitter open() {
        SseEmitter emitter = new SseEmitter(CONNECTION_TIMEOUT_MILLIS);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(failure -> emitters.remove(emitter));

        write(emitter, SseEmitter.event().comment("heartbeat"));
        return emitter;
    }

    /** Any {@code PATCH} that succeeded, discarding and restoring included. */
    void updated(ApplicationDto application) {
        send("application.updated", application);
    }

    /**
     * A permanent erase. The Application is already gone by the time this is
     * called, which is why the caller passes the wire shape it captured before
     * the delete — the dashboard needs the whole row to drop it from every
     * screen.
     */
    void deleted(ApplicationDto application) {
        send("application.deleted", application);
    }

    @EventListener
    void applicationCreated(ApplicationSubmitted submitted) {
        send("application.created", ApplicationDto.of(submitted.application()));
    }

    @EventListener
    void onboardingStepChanged(OnboardingStepChanged changed) {
        OnboardingDto onboarding = OnboardingDto.of(
                changed.application(), onboardingProperties, changed.doneSteps());
        send("application.updated", ApplicationDto.of(changed.application(), onboarding));
    }

    /**
     * Sending inside a transaction would announce a change that a failing
     * commit then rolls back, and the stream keeps no replay buffer to correct
     * it with — so where a transaction is running, the event waits for it.
     */
    private void send(String event, ApplicationDto application) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            broadcast(event, application);
                        }
                    });
            return;
        }

        broadcast(event, application);
    }

    private void broadcast(String event, ApplicationDto application) {
        String id = String.valueOf(eventCounter.incrementAndGet());

        for (SseEmitter emitter : emitters) {
            write(emitter, SseEmitter.event()
                    .id(id)
                    .name(event)
                    .data(application, MediaType.APPLICATION_JSON));
        }
    }

    /**
     * Runs on the scheduler thread. An exception escaping here would cancel
     * every later heartbeat, so whatever one connection throws only drops that
     * connection.
     */
    private void heartbeat() {
        for (SseEmitter emitter : emitters) {
            try {
                write(emitter, SseEmitter.event().comment("heartbeat"));
            } catch (RuntimeException failure) {
                emitters.remove(emitter);
            }
        }
    }

    /**
     * A closed connection is the ordinary case — a staff member closed the tab
     * — so it drops out of the registry rather than failing the request that
     * caused the event. An Applicant's submit must not fail because a
     * dashboard went away.
     */
    private boolean write(SseEmitter emitter, SseEmitter.SseEventBuilder payload) {
        synchronized (emitter) {
            try {
                emitter.send(payload);
                return true;
            } catch (IOException | IllegalStateException disconnected) {
                emitters.remove(emitter);
                return false;
            }
        }
    }

}

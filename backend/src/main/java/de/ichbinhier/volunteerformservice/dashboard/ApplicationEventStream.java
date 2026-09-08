package de.ichbinhier.volunteerformservice.dashboard;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import de.ichbinhier.volunteerformservice.application.ApplicationSubmitted;

/**
 * Every open dashboard's live stream, and the only place the three event types
 * of `dashboard/API.md`, "The live stream", are sent from. An event goes to
 * every open stream, the originator's included: suppressing the originator's
 * own event would mean two code paths for one state change.
 *
 * <p>Requests are served by many threads, so the registry and the event
 * counter are touched concurrently, and two threads can reach the same
 * connection at once — a broadcast and that connection's own heartbeat. Hence
 * the copy-on-write registry, the atomic counter, and one lock per emitter
 * around the write itself.
 */
@Component
public class ApplicationEventStream {

    private static final long HEARTBEAT_INTERVAL_MILLIS = 20000;

    private static final long CONNECTION_TIMEOUT_MILLIS = 3600000;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    private final AtomicLong eventCounter = new AtomicLong();

    /**
     * A fresh connection, registered and kept alive by a comment heartbeat
     * every 20 seconds — which also makes a dead network visible in seconds
     * rather than at the timeout.
     */
    SseEmitter open() {
        SseEmitter emitter = new SseEmitter(CONNECTION_TIMEOUT_MILLIS);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(failure -> emitters.remove(emitter));

        Thread.ofPlatform().name("dashboard-heartbeat").daemon().start(() -> heartbeat(emitter));
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

    private void heartbeat(SseEmitter emitter) {
        try {
            while (emitters.contains(emitter)) {
                if (!write(emitter, SseEmitter.event().comment("heartbeat"))) {
                    return;
                }
                Thread.sleep(HEARTBEAT_INTERVAL_MILLIS);
            }
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
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

package de.ichbinhier.volunteerformservice.dashboard;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class EventStreamController {

    private static final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private static long eventCounter = 0;

    @GetMapping(path = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events() {
        SseEmitter emitter = new SseEmitter(3600000L);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));

        new Thread(() -> {
            try {
                while (emitters.contains(emitter)) {
                    emitter.send(SseEmitter.event().comment("heartbeat"));
                    Thread.sleep(20000);
                }
            } catch (IOException | InterruptedException e) {
                emitters.remove(emitter);
            }
        }).start();

        return emitter;
    }

    public static void broadcast(String eventType, String data) {
        eventCounter++;
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                    .id(String.valueOf(eventCounter))
                    .name(eventType)
                    .data(data));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }

}

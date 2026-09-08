package de.ichbinhier.volunteerformservice.dashboard;

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

    private final ApplicationEventStream stream;

    /**
     * {@code X-Accel-Buffering: no} is sent by the backend as well as
     * configured on the proxy, because a buffering proxy delivers the events in
     * batches and "the Application appears while you watch" — the moment the
     * demo is built around — then does not happen. Saying it here means the
     * behaviour survives a proxy configuration nobody remembered to change.
     */
    @GetMapping(path = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    ResponseEntity<SseEmitter> events() {
        return ResponseEntity.ok()
            .header("X-Accel-Buffering", "no")
            .body(stream.open());
    }

}

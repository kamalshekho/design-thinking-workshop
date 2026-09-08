package de.ichbinhier.volunteerformservice.web;

import java.net.URI;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import de.ichbinhier.volunteerformservice.application.WeeklyTime;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;


// exceptions handlers who return ProblemDetail with structure described in api.md
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final URI VALIDATION_FAILED = URI.create("https://ichbinhier.eu/problems/validation-failed");


    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ProblemDetail> onInvalidBody(MethodArgumentNotValidException exception) {
        return validationFailed(
                exception.getBindingResult().getFieldErrors().stream()
                        .map(error -> new ApiFieldError(error.getField(), error.getDefaultMessage()))
                        .toList());
    }


    // unknown enum value fails in jackson
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ProblemDetail> onUnreadableBody(HttpMessageNotReadableException exception) {
        Throwable cause = exception.getCause();
        if (cause instanceof InvalidFormatException) {
            InvalidFormatException formatException = (InvalidFormatException) cause;
            if (formatException.getTargetType() == WeeklyTime.class) {
                return validationFailed(List.of(new ApiFieldError("weeklyTime", "WEEKLY_TIME_UNKNOWN")));
            }
        }
        return validationFailed(List.of());
    }


    @ExceptionHandler(FieldValidationException.class)
    ResponseEntity<ProblemDetail> onFieldValidation(FieldValidationException exception) {
        return validationFailed(List.of(new ApiFieldError(exception.getField(), exception.getCode())));
    }


    private static ResponseEntity<ProblemDetail> validationFailed(List<ApiFieldError> errors) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setType(VALIDATION_FAILED);
        problem.setTitle("Validation failed");
        problem.setProperty("code", "VALIDATION_FAILED");
        problem.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(problem);
    }

}

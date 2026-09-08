package de.ichbinhier.volunteerformservice.web;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import de.ichbinhier.volunteerformservice.application.WeeklyTime;

import tools.jackson.databind.exc.InvalidFormatException;

/**
 * Every failure leaves here as {@code application/problem+json} carrying a
 * {@code code}: no empty body, no bare status, no German.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ProblemDetail> onInvalidBody(MethodArgumentNotValidException exception) {
        return validationFailed(
                exception.getBindingResult().getFieldErrors().stream()
                        .map(error -> new ApiFieldError(error.getField(), error.getDefaultMessage()))
                        .toList());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ProblemDetail> onUnreadableBody(HttpMessageNotReadableException exception) {
        Throwable cause = exception.getCause();
        if (cause instanceof InvalidFormatException formatException
                && formatException.getTargetType() == WeeklyTime.class) {
            return validationFailed(List.of(new ApiFieldError("weeklyTime", "WEEKLY_TIME_UNKNOWN")));
        }
        return validationFailed(List.of());
    }

    @ExceptionHandler(FieldValidationException.class)
    ResponseEntity<ProblemDetail> onFieldValidation(FieldValidationException exception) {
        return validationFailed(List.of(new ApiFieldError(exception.getField(), exception.getCode())));
    }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ProblemDetail> onApiFailure(ApiException exception) {
        return ResponseEntity.status(exception.getStatus())
                .headers(exception.getHeaders())
                .body(ApiProblem.of(exception.getStatus(), exception.getCode()));
    }

    /**
     * An id that is not a UUID names no Application and no Category, so it reads
     * as {@code NOT_FOUND}; a query parameter of the wrong type is a bad request.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ProblemDetail> onUnusableParameter(MethodArgumentTypeMismatchException exception) {
        boolean inPath = exception.getParameter().hasParameterAnnotation(PathVariable.class);
        if (inPath) {
            return onApiFailure(ApiException.notFound());
        }
        return validationFailed(List.of(new ApiFieldError(exception.getName(), "VALIDATION_FAILED")));
    }

    /**
     * The last resort. Spring's own refusals — an unknown route, a wrong method,
     * an unsupported media type — keep their status and get the code that goes
     * with it; anything else is a defect and reads as {@code INTERNAL_ERROR}.
     */
    @ExceptionHandler(Exception.class)
    ResponseEntity<ProblemDetail> onUnexpectedFailure(Exception exception) {
        if (exception instanceof ErrorResponse known) {
            return ResponseEntity.status(known.getStatusCode())
                    .body(ApiProblem.of(known.getStatusCode(), ApiProblem.codeFor(known.getStatusCode())));
        }
        log.error("Unhandled failure", exception);
        return ResponseEntity.internalServerError()
                .body(ApiProblem.of(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR"));
    }

    private static ResponseEntity<ProblemDetail> validationFailed(List<ApiFieldError> errors) {
        ProblemDetail problem = ApiProblem.of(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED");
        problem.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(problem);
    }

}

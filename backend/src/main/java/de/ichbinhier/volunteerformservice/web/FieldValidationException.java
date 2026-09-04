package de.ichbinhier.volunteerformservice.web;

import lombok.Getter;


@Getter
public class FieldValidationException extends RuntimeException {

    private final String field;
    private final String code;


    public FieldValidationException(String field, String code) {
        super(code);
        this.field = field;
        this.code = code;
    }

}

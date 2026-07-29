package com.nfc_tag_service.global.exception;


import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class ApiResponse<T> {

    private final boolean success;
    private final int status;
    private final String code;
    private final String message;
    private final T data;
    private final LocalDateTime timestamp;


    private ApiResponse(boolean success, int status, String code, String message, T data) {
        this.success = success;
        this.status = status;
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }


    public static <T> ApiResponse<T> success(int status, String message, T data) {
        return new ApiResponse<>(true, status, null, message, data);
    }


    public static <T> ApiResponse<T> success(int status, String message) {
        return new ApiResponse<>(true, status, null, message, null);
    }

    public static <T> ApiResponse<T> fail(int status, String code, String message) {
        return new ApiResponse<>(false, status, code, message, null);
    }
}
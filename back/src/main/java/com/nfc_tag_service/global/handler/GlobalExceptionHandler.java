package com.nfc_tag_service.global.handler;


import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.method.MethodValidationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import jakarta.validation.ConstraintViolationException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleNoResourceFound(
            NoResourceFoundException ex,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = ErrorCode.RESOURCE_NOT_FOUND;
        String accept = request.getHeader(HttpHeaders.ACCEPT);
        boolean pageNavigation = "GET".equalsIgnoreCase(request.getMethod())
                && accept != null
                && accept.contains(MediaType.TEXT_HTML_VALUE);
        ClassPathResource index = new ClassPathResource("static/index.html");

        if (pageNavigation && index.exists()) {
            return ResponseEntity
                    .status(errorCode.getHttpStatus())
                    .contentType(MediaType.TEXT_HTML)
                    .body(index);
        }

        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(ApiResponse.fail(
                        errorCode.getHttpStatus().value(),
                        errorCode.getCode(),
                        errorCode.getMessage()
                ));
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            MethodValidationException.class,
            ConstraintViolationException.class,
            HttpMessageNotReadableException.class
    })
    public ResponseEntity<ApiResponse<Void>> handleValidationException(Exception ex) {
        ErrorCode errorCode = ErrorCode.INVALID_INPUT;
        log.warn("Validation Exception: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.fail(
                errorCode.getHttpStatus().value(),
                errorCode.getCode(),
                errorCode.getMessage()
        ));
    }

    /**
     * 비즈니스 로직 중 발생하는 커스텀 예외 처리 (CustomException)
     */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        log.warn("Service Exception: [{} - {}]", errorCode.getCode(), errorCode.getMessage());

        // ApiResponse.fail 공통 포맷 생성
        ApiResponse<Void> response = ApiResponse.fail(
                errorCode.getHttpStatus().value(),
                errorCode.getCode(),
                errorCode.getMessage()
        );

        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(response);
    }

    /**
     * 시스템 내부에서 예측하지 못하게 발생한 치명적인 예외 처리 (Exception)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        log.error("Unhandled Exception: ", ex);

        ErrorCode defaultError = ErrorCode.INTERNAL_SERVER_ERROR;

        // ApiResponse.fail 공통 포맷 생성
        ApiResponse<Void> response = ApiResponse.fail(
                defaultError.getHttpStatus().value(),
                defaultError.getCode(),
                defaultError.getMessage()
        );

        return ResponseEntity
                .status(defaultError.getHttpStatus())
                .body(response);
    }
}
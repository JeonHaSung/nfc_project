package com.nfc_tag_service.management.admin.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.management.admin.dto.EmailRecoveryDtos.EmailCodeRequest;
import com.nfc_tag_service.management.admin.dto.EmailRecoveryDtos.EmailRequest;
import com.nfc_tag_service.management.admin.dto.EmailRecoveryDtos.FindIdResponse;
import com.nfc_tag_service.management.admin.dto.EmailRecoveryDtos.ResetPasswordSendRequest;
import com.nfc_tag_service.management.admin.dto.EmailRecoveryDtos.ResetPasswordVerifyRequest;
import com.nfc_tag_service.management.admin.service.AdminRecoveryService;
import com.nfc_tag_service.management.admin.service.EmailVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/management/auth")
@RequiredArgsConstructor
public class AdminRecoveryController {

    private static final String GENERIC_SEND_MESSAGE =
            "요청을 처리했습니다. 입력한 이메일을 확인해 주세요.";

    private final EmailVerificationService verificationService;
    private final AdminRecoveryService recoveryService;

    @PostMapping("/email/signup/send")
    public ApiResponse<Void> sendSignupCode(@Valid @RequestBody EmailRequest request) {
        verificationService.sendSignupCode(request.email());
        return ApiResponse.success(HttpStatus.OK.value(), GENERIC_SEND_MESSAGE);
    }

    @PostMapping("/email/signup/verify")
    public ApiResponse<Void> verifySignupCode(@Valid @RequestBody EmailCodeRequest request) {
        verificationService.verifySignupCode(request.email(), request.code());
        return ApiResponse.success(HttpStatus.OK.value(), "SUCCESS");
    }

    @PostMapping("/recovery/find-id/send")
    public ApiResponse<Void> sendFindIdCode(@Valid @RequestBody EmailRequest request) {
        verificationService.sendFindIdCode(request.email());
        return ApiResponse.success(HttpStatus.OK.value(), GENERIC_SEND_MESSAGE);
    }

    @PostMapping("/recovery/find-id/verify")
    public ApiResponse<FindIdResponse> verifyFindIdCode(
            @Valid @RequestBody EmailCodeRequest request
    ) {
        String loginId = verificationService.verifyFindIdCode(request.email(), request.code());
        return ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                new FindIdResponse(loginId)
        );
    }

    @PostMapping("/recovery/reset-password/send")
    public ApiResponse<Void> sendResetPasswordCode(
            @Valid @RequestBody ResetPasswordSendRequest request
    ) {
        recoveryService.sendResetPasswordCode(request.loginId(), request.email());
        return ApiResponse.success(HttpStatus.OK.value(), GENERIC_SEND_MESSAGE);
    }

    @PostMapping("/recovery/reset-password/verify")
    public ApiResponse<Void> resetPassword(
            @Valid @RequestBody ResetPasswordVerifyRequest request
    ) {
        recoveryService.resetPassword(request.loginId(), request.email(), request.code());
        return ApiResponse.success(HttpStatus.OK.value(), "SUCCESS");
    }
}

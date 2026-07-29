package com.nfc_tag_service.management.admin.controller;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.global.security.JwtService;
import com.nfc_tag_service.management.admin.dto.AdminDtos.AdminResponse;
import com.nfc_tag_service.management.admin.dto.AdminDtos.LoginRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.UpdateMeRequest;
import com.nfc_tag_service.management.admin.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/management/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminService adminService;
    private final JwtService jwtService;

    @GetMapping("/csrf")
    public ApiResponse<String> csrf(CsrfToken csrfToken) {
        return ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                csrfToken.getToken()
        );
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AdminResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AdminEntity admin = adminService.authenticate(request);
        String token = jwtService.createToken(admin);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtService.authenticationCookie(token).toString())
                .body(ApiResponse.success(
                        HttpStatus.OK.value(),
                        "SUCCESS",
                        AdminResponse.from(admin)
                ));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtService.expiredAuthenticationCookie().toString())
                .body(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS"));
    }

    @GetMapping("/me")
    public ApiResponse<AdminResponse> me(@AuthenticationPrincipal AdminPrincipal principal) {
        return ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                adminService.getMe(principal.id())
        );
    }

    @PutMapping("/me")
    public ApiResponse<AdminResponse> updateMe(
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody UpdateMeRequest request
    ) {
        return ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                adminService.updateMe(principal.id(), request)
        );
    }
}

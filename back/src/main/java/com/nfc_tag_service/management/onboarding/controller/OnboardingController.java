package com.nfc_tag_service.management.onboarding.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.onboarding.dto.OnboardingDtos.AttachCardRequest;
import com.nfc_tag_service.management.onboarding.dto.OnboardingDtos.OnboardingStoreItem;
import com.nfc_tag_service.management.onboarding.dto.OnboardingDtos.RegisterStoreRequest;
import com.nfc_tag_service.management.onboarding.dto.OnboardingDtos.TagPreview;
import com.nfc_tag_service.management.onboarding.service.OnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    @GetMapping("/tag")
    public ApiResponse<TagPreview> tagPreview(@RequestParam("ti") String tagId) {
        return ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", onboardingService.getTagPreview(tagId));
    }

    @GetMapping("/my-stores")
    public ApiResponse<List<OnboardingStoreItem>> myStores(
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", onboardingService.myStores(principal));
    }

    @PostMapping("/register-store")
    public ApiResponse<String> registerStore(
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody RegisterStoreRequest request
    ) {
        return ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                onboardingService.registerStore(principal, request)
        );
    }

    @PostMapping("/attach-card")
    public ApiResponse<String> attachCard(
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody AttachCardRequest request
    ) {
        return ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                onboardingService.attachCard(principal, request)
        );
    }
}

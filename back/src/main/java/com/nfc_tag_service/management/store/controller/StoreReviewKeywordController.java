package com.nfc_tag_service.management.store.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.store.dto.StoreReviewKeywordDtos.KeywordRequest;
import com.nfc_tag_service.management.store.dto.StoreReviewKeywordDtos.KeywordResponse;
import com.nfc_tag_service.management.store.service.StoreReviewKeywordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/management/store/{storeId}/review-keywords")
@RequiredArgsConstructor
public class StoreReviewKeywordController {

    private final StoreReviewKeywordService keywordService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<KeywordResponse>>> list(
            @PathVariable String storeId,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(), "SUCCESS", keywordService.list(storeId, principal)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<KeywordResponse>> create(
            @PathVariable String storeId,
            @RequestBody KeywordRequest request,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(), "SUCCESS", keywordService.create(storeId, request, principal)));
    }

    @PostMapping("/{keywordId}/update")
    public ResponseEntity<ApiResponse<KeywordResponse>> update(
            @PathVariable String storeId,
            @PathVariable Long keywordId,
            @RequestBody KeywordRequest request,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                keywordService.update(storeId, keywordId, request, principal)));
    }

    @PostMapping("/del")
    public ResponseEntity<ApiResponse<Integer>> delete(
            @PathVariable String storeId,
            @RequestBody List<Long> ids,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(), "SUCCESS", keywordService.delete(storeId, ids, principal)));
    }
}

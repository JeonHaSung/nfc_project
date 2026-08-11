package com.nfc_tag_service.management.store.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.page.PageRequestDTO;
import com.nfc_tag_service.global.page.PageResponseDTO;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.store.dto.StoreFormRequestDTO;
import com.nfc_tag_service.management.store.dto.StoreResponseDTO;
import com.nfc_tag_service.management.store.service.StoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/management/store")
@RequiredArgsConstructor
@Slf4j
public class StoreController {
    private final StoreService storeService;

    @PostMapping("/update")
    public ResponseEntity<ApiResponse<String>> storeUpdate(@RequestBody StoreFormRequestDTO request) {
        String result = storeService.storeUpdate(request);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", result));
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<PageResponseDTO<StoreResponseDTO>>> searchList(
            @ModelAttribute PageRequestDTO dto,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        PageResponseDTO<StoreResponseDTO> result = storeService.storeList(dto, principal);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", result));
    }

    @PostMapping("/del")
    public ResponseEntity<ApiResponse<Integer>> delStore(@RequestBody List<String> ids) {
        int result = storeService.delStore(ids);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", result));
    }

    @GetMapping("/select/list")
    public ResponseEntity<ApiResponse<List<StoreResponseDTO>>> selectList(
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        List<StoreResponseDTO> result = storeService.selectList(principal);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", result));
    }

    @GetMapping("/select/search")
    public ResponseEntity<ApiResponse<PageResponseDTO<StoreResponseDTO>>> selectSearch(
            @ModelAttribute PageRequestDTO dto,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        PageResponseDTO<StoreResponseDTO> result = storeService.selectSearch(dto, principal);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", result));
    }

    @GetMapping("/select/{storeId}")
    public ResponseEntity<ApiResponse<StoreResponseDTO>> selectById(
            @PathVariable String storeId,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        StoreResponseDTO result = storeService.selectById(storeId, principal);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", result));
    }
}

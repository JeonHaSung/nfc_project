package com.nfc_tag_service.management.store.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.page.PageRequestDTO;
import com.nfc_tag_service.global.page.PageResponseDTO;
import com.nfc_tag_service.management.store.dto.StoreFormRequestDTO;
import com.nfc_tag_service.management.store.dto.StoreResponseDTO;
import com.nfc_tag_service.management.store.service.StoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/management/store")
@RequiredArgsConstructor
@Slf4j
public class StoreController {
    private final StoreService storeService;

    @PostMapping("/insert")
    public ResponseEntity<ApiResponse<String>> storeInsert(@RequestBody StoreFormRequestDTO request) {
        log.info("[스토어]등록:" + request.getName());
        String result = storeService.storeInsert(request);
        ApiResponse<String> response = ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                result
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/update")
    public ResponseEntity<ApiResponse<String>> storeUpdate(@RequestBody StoreFormRequestDTO request) {
        log.info("[스토어]수정:" + request.getName());
        String result = storeService.storeUpdate(request);
        ApiResponse<String> response = ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                result
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<PageResponseDTO<StoreResponseDTO>>> searchList(@ModelAttribute PageRequestDTO dto) {

        PageResponseDTO<StoreResponseDTO> result = storeService.storeList(dto);

        ApiResponse<PageResponseDTO<StoreResponseDTO>> response = ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                result
        );
        return ResponseEntity.ok(response);
    }
    @PostMapping("/del")
    public ResponseEntity<ApiResponse<Integer>> delStore(@RequestBody List<String> ids) {
        log.info("[스토어]삭제:" + ids.size() + "개");
        int result = storeService.delStore(ids);
        ApiResponse<Integer> response = ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                result
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/select/list")
    public ResponseEntity<ApiResponse<List<StoreResponseDTO>>> selectList() {
        List<StoreResponseDTO> result = storeService.selectList();
        ApiResponse<List<StoreResponseDTO>> response = ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                result
        );
        return ResponseEntity.ok(response);
    }



}

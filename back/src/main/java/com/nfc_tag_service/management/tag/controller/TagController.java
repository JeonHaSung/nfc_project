package com.nfc_tag_service.management.tag.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.store.service.StoreService;
import com.nfc_tag_service.management.tag.dto.TagExcelRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagGenerateRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagNicknameUpdateRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagResponseDTO;
import com.nfc_tag_service.management.tag.dto.TagUpdateResponseDTO;
import com.nfc_tag_service.management.tag.service.TagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/management/tag")
@RequiredArgsConstructor
@Slf4j
public class TagController {

    private final TagService tagService;
    private final StoreService storeService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Integer>> generate(@RequestBody TagGenerateRequestDTO request) {
        int created = tagService.generateTags(request);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", created));
    }

    @GetMapping("/factory-list")
    public ResponseEntity<ApiResponse<List<TagResponseDTO>>> factoryList(
            @RequestParam("tagType") String tagType,
            @RequestParam("status") String status
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                tagService.factoryList(tagType, status)
        ));
    }

    @GetMapping("/factory-progress")
    public ResponseEntity<ApiResponse<List<com.nfc_tag_service.management.tag.dto.FactoryBatchProgressDTO>>> factoryProgress(
            @RequestParam("tagType") String tagType
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                tagService.factoryBatchProgress(tagType)
        ));
    }

    @PostMapping("/excel")
    public ResponseEntity<byte[]> issueExcel(@RequestBody TagExcelRequestDTO request) {
        byte[] excel = tagService.issueExcel(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"tags.xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }

    @GetMapping("/excel-orders")
    public ResponseEntity<ApiResponse<List<com.nfc_tag_service.management.tag.dto.TagExcelOrderResponseDTO>>> excelOrders(
            @RequestParam("tagType") String tagType
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                tagService.recentExcelOrders(tagType)
        ));
    }

    @GetMapping("/excel-orders/{id}/download")
    public ResponseEntity<byte[]> downloadExcelOrder(@PathVariable("id") Long id) {
        byte[] excel = tagService.downloadExcelOrder(id);
        String fileName = tagService.excelOrderFileName(id);
        String encoded = java.net.URLEncoder.encode(fileName, java.nio.charset.StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }

    @PostMapping("/update")
    public ResponseEntity<ApiResponse<TagUpdateResponseDTO>> tagUpdate(
            @AuthenticationPrincipal AdminPrincipal principal,
            @RequestBody TagNicknameUpdateRequestDTO request
    ) {
        TagUpdateResponseDTO result = tagService.tagUpdate(request, principal);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", result));
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<TagResponseDTO>>> tagList(
            @RequestParam("tagType") String tagType,
            @RequestParam("storeId") String storeId,
            @RequestParam(value = "experienceType", defaultValue = "ALL") String experienceType,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        storeService.assertStoreReadable(storeId, principal);
        List<TagResponseDTO> result = tagService.tagList(tagType, storeId, experienceType);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", result));
    }

    @PostMapping("/del")
    public ResponseEntity<ApiResponse<Integer>> delTag(@RequestBody List<String> ids) {
        int result = tagService.delTag(ids);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", result));
    }
}

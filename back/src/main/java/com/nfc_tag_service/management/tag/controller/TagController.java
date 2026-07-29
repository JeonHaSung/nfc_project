package com.nfc_tag_service.management.tag.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.management.store.dto.StoreFormRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagFormRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagResponseDTO;
import com.nfc_tag_service.management.tag.dto.TagUpdateResponseDTO;
import com.nfc_tag_service.management.tag.service.TagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/management/tag")
@RequiredArgsConstructor
@Slf4j
public class TagController {

    private final TagService tagService;

    @PostMapping("/insert")
    public ResponseEntity<ApiResponse<String>> tagInsert(@RequestBody TagFormRequestDTO request) {
        log.info("[태그]등록:" + request.getNickname());
        String result = tagService.tagInsert(request);
        ApiResponse<String> response = ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                result
        );
        return ResponseEntity.ok(response);
    }
    @PostMapping("/update")
    public ResponseEntity<ApiResponse<TagUpdateResponseDTO>> tagUpdate(@RequestBody TagFormRequestDTO request) {
        log.info("[태그]수정:" + request.getNickname());
        TagUpdateResponseDTO result = tagService.tagUpdate(request);
        ApiResponse<TagUpdateResponseDTO> response = ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                result
        );
        return ResponseEntity.ok(response);
    }
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<TagResponseDTO>>> tagList(@RequestParam("tagType") String tagType,
                                                                     @RequestParam("storeId") String storeId) {
        log.info("[태그]조회:");
        List<TagResponseDTO> result = tagService.tagList(tagType, storeId);
        ApiResponse<List<TagResponseDTO>> response = ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                result
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/del")
    public ResponseEntity<ApiResponse<Integer>> delTag(@RequestBody List<String> ids) {
        log.info("[태그]삭제:" + ids.size() + "개");
        int result = tagService.delTag(ids);
        ApiResponse<Integer> response = ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                result
        );
        return ResponseEntity.ok(response);
    }


}

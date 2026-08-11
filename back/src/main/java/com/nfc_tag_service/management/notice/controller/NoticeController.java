package com.nfc_tag_service.management.notice.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.management.notice.dto.NoticeDtos.ActiveNoticeResponse;
import com.nfc_tag_service.management.notice.dto.NoticeDtos.NoticeRequest;
import com.nfc_tag_service.management.notice.dto.NoticeDtos.NoticeResponse;
import com.nfc_tag_service.management.notice.dto.NoticeDtos.NoticeUpdateRequest;
import com.nfc_tag_service.management.notice.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/management/notice")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<NoticeResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", noticeService.list()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<ActiveNoticeResponse>> active() {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", noticeService.active()));
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<NoticeResponse>> create(@RequestBody NoticeRequest request) {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", noticeService.create(request)));
    }

    @PostMapping("/update")
    public ResponseEntity<ApiResponse<NoticeResponse>> update(@RequestBody NoticeUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", noticeService.update(request)));
    }

    @PostMapping("/del")
    public ResponseEntity<ApiResponse<Integer>> delete(@RequestBody List<Long> ids) {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", noticeService.delete(ids)));
    }

    @PostMapping("/select/{id}")
    public ResponseEntity<ApiResponse<NoticeResponse>> select(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", noticeService.select(id)));
    }

    @PostMapping("/select/clear")
    public ResponseEntity<ApiResponse<String>> clearSelection() {
        noticeService.clearSelection();
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", "CLEARED"));
    }
}

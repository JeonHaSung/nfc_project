package com.nfc_tag_service.management.store.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.store.dto.StoreEventDtos.EventRequest;
import com.nfc_tag_service.management.store.dto.StoreEventDtos.EventResponse;
import com.nfc_tag_service.management.store.dto.StoreEventDtos.ToggleRequest;
import com.nfc_tag_service.management.store.service.StoreEventService;
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
@RequestMapping("/management/store/{storeId}/events")
@RequiredArgsConstructor
public class StoreEventController {

    private final StoreEventService eventService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> list(
            @PathVariable String storeId,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(), "SUCCESS", eventService.list(storeId, principal)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EventResponse>> create(
            @PathVariable String storeId,
            @RequestBody EventRequest request,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(), "SUCCESS", eventService.create(storeId, request, principal)));
    }

    @PostMapping("/{eventId}/update")
    public ResponseEntity<ApiResponse<EventResponse>> update(
            @PathVariable String storeId,
            @PathVariable Long eventId,
            @RequestBody EventRequest request,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                eventService.update(storeId, eventId, request, principal)));
    }

    @PostMapping("/{eventId}/toggle")
    public ResponseEntity<ApiResponse<EventResponse>> toggle(
            @PathVariable String storeId,
            @PathVariable Long eventId,
            @RequestBody(required = false) ToggleRequest request,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                eventService.toggle(storeId, eventId, request, principal)));
    }

    @PostMapping("/del")
    public ResponseEntity<ApiResponse<Integer>> delete(
            @PathVariable String storeId,
            @RequestBody List<Long> ids,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(), "SUCCESS", eventService.delete(storeId, ids, principal)));
    }
}

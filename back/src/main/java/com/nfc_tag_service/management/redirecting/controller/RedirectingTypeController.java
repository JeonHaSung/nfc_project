package com.nfc_tag_service.management.redirecting.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.management.redirecting.dto.RedirectingTypeAdminResponse;
import com.nfc_tag_service.management.redirecting.dto.RedirectingTypeUpsertRequest;
import com.nfc_tag_service.management.redirecting.service.RedirectingTypeAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/management/redirecting-types")
@RequiredArgsConstructor
public class RedirectingTypeController {

    private final RedirectingTypeAdminService redirectingTypeAdminService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RedirectingTypeAdminResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                redirectingTypeAdminService.list()
        ));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RedirectingTypeAdminResponse>> create(
            @RequestBody RedirectingTypeUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                redirectingTypeAdminService.create(request)
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RedirectingTypeAdminResponse>> update(
            @PathVariable("id") Long id,
            @RequestBody RedirectingTypeUpsertRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                redirectingTypeAdminService.update(id, request)
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") Long id) {
        redirectingTypeAdminService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS"));
    }
}

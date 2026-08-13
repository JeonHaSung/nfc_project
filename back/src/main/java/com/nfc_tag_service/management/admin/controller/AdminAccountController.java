package com.nfc_tag_service.management.admin.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.page.PageRequestDTO;
import com.nfc_tag_service.global.page.PageResponseDTO;
import com.nfc_tag_service.management.admin.dto.AdminDtos.AdminResponse;
import com.nfc_tag_service.management.admin.dto.AdminDtos.ChangePasswordRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.CreateAdminRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.SuspendRequest;
import com.nfc_tag_service.management.admin.dto.AdminDtos.UpdateAdminRequest;
import com.nfc_tag_service.management.admin.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/management/admin/accounts")
@RequiredArgsConstructor
public class AdminAccountController {

    private final AdminService adminService;

    @GetMapping
    public ApiResponse<List<AdminResponse>> accounts() {
        return success(adminService.getAdminAccounts());
    }

    @GetMapping("/search")
    public ApiResponse<PageResponseDTO<AdminResponse>> searchAccounts(
            @ModelAttribute PageRequestDTO request,
            @RequestParam(value = "role", required = false, defaultValue = "NORMAL") String role
    ) {
        return success(adminService.searchAdminAccounts(request, role));
    }

    @PostMapping
    public ApiResponse<AdminResponse> create(@Valid @RequestBody CreateAdminRequest request) {
        return success(adminService.createAdmin(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<AdminResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAdminRequest request
    ) {
        return success(adminService.updateAdmin(id, request));
    }

    @PatchMapping("/{id}/password")
    public ApiResponse<AdminResponse> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        return success(adminService.changeAdminPassword(id, request));
    }

    @PatchMapping("/{id}/suspend")
    public ApiResponse<AdminResponse> suspend(
            @PathVariable Long id,
            @Valid @RequestBody SuspendRequest request
    ) {
        return success(adminService.setSuspended(id, request.suspended()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        adminService.deleteAdmin(id);
        return ApiResponse.success(HttpStatus.OK.value(), "SUCCESS");
    }

    private <T> ApiResponse<T> success(T data) {
        return ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", data);
    }
}

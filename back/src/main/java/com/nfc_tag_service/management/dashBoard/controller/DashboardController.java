package com.nfc_tag_service.management.dashBoard.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.dashBoard.dto.DashboardChartsResponseDTO;
import com.nfc_tag_service.management.dashBoard.dto.DashboardSummaryResponseDTO;
import com.nfc_tag_service.management.dashBoard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/management/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponseDTO>> getSummary(
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        DashboardSummaryResponseDTO result = dashboardService.getSummary(principal);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(), "SUCCESS", result));
    }

    @GetMapping("/charts")
    public ResponseEntity<ApiResponse<DashboardChartsResponseDTO>> getCharts(
            @RequestParam("storeId") String storeId,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        DashboardChartsResponseDTO result = dashboardService.getCharts(storeId, principal);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(), "SUCCESS", result));
    }
}

package com.nfc_tag_service.management.dashBoard.service;

import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.dashBoard.dto.DashboardChartsResponseDTO;
import com.nfc_tag_service.management.dashBoard.dto.DashboardSummaryResponseDTO;

public interface DashboardService {
    DashboardSummaryResponseDTO getSummary(AdminPrincipal principal);

    DashboardChartsResponseDTO getCharts(String storeId, AdminPrincipal principal);
}

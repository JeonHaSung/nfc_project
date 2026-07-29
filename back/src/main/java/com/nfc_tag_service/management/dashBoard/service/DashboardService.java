package com.nfc_tag_service.management.dashBoard.service;

import com.nfc_tag_service.management.dashBoard.dto.DashboardChartsResponseDTO;
import com.nfc_tag_service.management.dashBoard.dto.DashboardSummaryResponseDTO;

public interface DashboardService {
    DashboardSummaryResponseDTO getSummary();
    DashboardChartsResponseDTO getCharts(String storeId);
}

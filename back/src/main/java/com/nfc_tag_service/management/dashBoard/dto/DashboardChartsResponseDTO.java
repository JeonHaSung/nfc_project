package com.nfc_tag_service.management.dashBoard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class DashboardChartsResponseDTO {
    private String storeId;
    private long currentHitCount;
    private List<DashboardDailyResponseDTO> daily;
    private List<DashboardWeeklyResponseDTO> weekly;
    private List<DashboardMonthlyResponseDTO> monthly;
    private String latestMonthMostClickedDayOfWeek;
}

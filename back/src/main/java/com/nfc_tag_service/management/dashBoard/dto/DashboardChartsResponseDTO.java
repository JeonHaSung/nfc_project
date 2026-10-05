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
    private List<DashboardYearlyResponseDTO> yearly;
    private List<DashboardHourlyResponseDTO> todayHourly;
    private String latestMonthMostClickedDayOfWeek;
    private String yesterdayMostClickedHour;
    private String lastWeekMostClickedDayOfWeek;
    private String lastMonthMostClickedDayOfWeek;
    private String lastMonthMostClickedHour;
    private Long lastYearCount;
    private String lastYearMostClickedDayOfWeek;
    private String lastYearMostClickedHour;
    private List<DashboardTagRedirectStatsDTO> tagRedirectStats;
}

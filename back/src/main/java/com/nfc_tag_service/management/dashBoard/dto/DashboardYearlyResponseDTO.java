package com.nfc_tag_service.management.dashBoard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DashboardYearlyResponseDTO {
    private int year;
    private long count;
    private long cumulativeCount;
    private String mostClickedDayOfWeek;
    private String mostClickedHour;
}

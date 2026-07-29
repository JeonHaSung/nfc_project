package com.nfc_tag_service.management.dashBoard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
@AllArgsConstructor
public class DashboardMonthlyResponseDTO {
    private LocalDate monthStartDate;
    private long count;
    private String mostClickedDayOfWeek;
}

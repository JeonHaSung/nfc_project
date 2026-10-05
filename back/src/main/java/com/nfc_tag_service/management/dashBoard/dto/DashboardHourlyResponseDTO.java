package com.nfc_tag_service.management.dashBoard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DashboardHourlyResponseDTO {
    private int hour;
    private String label;
    private long count;
}

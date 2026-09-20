package com.nfc_tag_service.management.dashBoard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DashboardRedirectingCountDTO {
    private Long id;
    private String type;
    private String label;
    private String color;
    private Long count;
}

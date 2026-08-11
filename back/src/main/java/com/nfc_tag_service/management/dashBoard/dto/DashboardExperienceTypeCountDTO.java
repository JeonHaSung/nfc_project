package com.nfc_tag_service.management.dashBoard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DashboardExperienceTypeCountDTO {
    private String experienceType;
    private long count;
}

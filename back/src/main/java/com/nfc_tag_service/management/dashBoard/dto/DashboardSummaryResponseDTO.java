package com.nfc_tag_service.management.dashBoard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class DashboardSummaryResponseDTO {
    private long storeCount;
    private long tagCount;
    private List<DashboardExperienceTypeCountDTO> experienceTypeCounts;
}

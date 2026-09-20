package com.nfc_tag_service.management.dashBoard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class DashboardTagRedirectStatsDTO {
    private String tagId;
    private String nickname;
    private List<DashboardRedirectingCountDTO> items;
}

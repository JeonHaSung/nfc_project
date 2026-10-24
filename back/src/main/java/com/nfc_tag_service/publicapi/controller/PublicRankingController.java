package com.nfc_tag_service.publicapi.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.publicapi.dto.StoreRankingDtos.RankingsResponse;
import com.nfc_tag_service.publicapi.service.PublicRankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicRankingController {

    private final PublicRankingService publicRankingService;

    @GetMapping("/rankings")
    public ApiResponse<RankingsResponse> rankings() {
        return ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                publicRankingService.getRankings()
        );
    }
}

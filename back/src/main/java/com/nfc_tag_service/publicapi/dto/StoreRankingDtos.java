package com.nfc_tag_service.publicapi.dto;

import java.util.List;

public final class StoreRankingDtos {

    private StoreRankingDtos() {
    }

    public record RankingItem(
            int rank,
            String storeName,
            long hitCount
    ) {
    }

    public record RankingsResponse(
            List<RankingItem> cumulative,
            List<RankingItem> today,
            String refreshedAt
    ) {
    }
}

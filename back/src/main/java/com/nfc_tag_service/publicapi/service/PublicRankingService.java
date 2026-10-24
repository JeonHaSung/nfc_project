package com.nfc_tag_service.publicapi.service;

import com.nfc_tag_service.management.dashBoard.repository.HourlyCountRepository;
import com.nfc_tag_service.management.store.repository.StoreRepository;
import com.nfc_tag_service.publicapi.dto.StoreRankingDtos.RankingItem;
import com.nfc_tag_service.publicapi.dto.StoreRankingDtos.RankingsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicRankingService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);
    private static final int TOP_N = 10;
    private static final DateTimeFormatter REFRESHED_AT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");

    private final StoreRepository storeRepository;
    private final HourlyCountRepository hourlyCountRepository;

    private final Object cacheLock = new Object();
    private volatile RankingsResponse cached;
    private volatile Instant cachedAt;
    private volatile LocalDate cachedForDate;

    @Transactional(readOnly = true)
    public RankingsResponse getRankings() {
        LocalDate today = LocalDate.now(SERVICE_ZONE);
        RankingsResponse hit = readFreshCache(today);
        if (hit != null) {
            return hit;
        }
        synchronized (cacheLock) {
            hit = readFreshCache(today);
            if (hit != null) {
                return hit;
            }
        }
        RankingsResponse fresh = loadRankings(today);
        synchronized (cacheLock) {
            hit = readFreshCache(today);
            if (hit != null) {
                return hit;
            }
            cached = fresh;
            cachedAt = Instant.now();
            cachedForDate = today;
            return fresh;
        }
    }

    private RankingsResponse readFreshCache(LocalDate today) {
        RankingsResponse current = cached;
        Instant at = cachedAt;
        LocalDate forDate = cachedForDate;
        if (current == null || at == null || forDate == null) {
            return null;
        }
        if (!forDate.equals(today)) {
            return null;
        }
        if (!Instant.now().isBefore(at.plus(CACHE_TTL))) {
            return null;
        }
        return current;
    }

    private RankingsResponse loadRankings(LocalDate today) {
        PageRequest page = PageRequest.of(0, TOP_N);
        List<RankingItem> cumulative = toItems(storeRepository.findTopStoresByHitCount(page));
        List<RankingItem> todayList = toItems(hourlyCountRepository.findTopStoresByTodayHits(today, page));
        String refreshedAt = Instant.now().atZone(SERVICE_ZONE).format(REFRESHED_AT);
        return new RankingsResponse(cumulative, todayList, refreshedAt);
    }

    private static List<RankingItem> toItems(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        List<RankingItem> items = new ArrayList<>(Math.min(rows.size(), TOP_N));
        int rank = 1;
        for (Object[] row : rows) {
            if (row == null || row.length < 2) {
                continue;
            }
            String name = row[0] == null ? "-" : String.valueOf(row[0]).trim();
            if (name.isEmpty()) {
                name = "-";
            }
            long hits = row[1] instanceof Number number ? number.longValue() : 0L;
            if (hits <= 0L) {
                continue;
            }
            items.add(new RankingItem(rank++, name, hits));
            if (items.size() >= TOP_N) {
                break;
            }
        }
        return List.copyOf(items);
    }
}

package com.nfc_tag_service.management.dashBoard.service;

import com.nfc_tag_service.domain.MonthlyCountEntity;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.management.dashBoard.dto.DashboardChartsResponseDTO;
import com.nfc_tag_service.management.dashBoard.dto.DashboardDailyResponseDTO;
import com.nfc_tag_service.management.dashBoard.dto.DashboardMonthlyResponseDTO;
import com.nfc_tag_service.management.dashBoard.dto.DashboardSummaryResponseDTO;
import com.nfc_tag_service.management.dashBoard.dto.DashboardWeeklyResponseDTO;
import com.nfc_tag_service.management.dashBoard.repository.DashboardQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");
    private final DashboardQueryRepository dashboardQueryRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponseDTO getSummary() {
        return DashboardSummaryResponseDTO.builder()
                .storeCount(dashboardQueryRepository.countActiveStores())
                .tagCount(dashboardQueryRepository.countActiveTags())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardChartsResponseDTO getCharts(String storeId) {
        if (storeId == null || storeId.isBlank()
                || !dashboardQueryRepository.existsActiveStore(storeId)) {
            throw new CustomException(ErrorCode.STORE_ID_NOTFOUND);
        }

        LocalDate today = LocalDate.now(SERVICE_ZONE);
        LocalDate dailyEnd = today.minusDays(1);
        LocalDate dailyStart = dailyEnd.minusDays(13);

        LocalDate currentWeekStart = today.with(
                TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        LocalDate previousWeekStart = currentWeekStart.minusWeeks(1);
        LocalDate weeklyStart = previousWeekStart.minusMonths(5);

        List<DashboardDailyResponseDTO> daily = dashboardQueryRepository
                .findDailyCounts(storeId, dailyStart, dailyEnd)
                .stream()
                .map(item -> DashboardDailyResponseDTO.builder()
                        .date(item.getDate())
                        .dayOfWeek(item.getDayOfWeek())
                        .count(item.getTodayCount())
                        .cumulativeCount(item.getCountValue())
                        .build())
                .toList();

        List<DashboardWeeklyResponseDTO> weekly = dashboardQueryRepository
                .findWeeklyCounts(storeId, weeklyStart, previousWeekStart)
                .stream()
                .map(item -> DashboardWeeklyResponseDTO.builder()
                        .weekStartDate(item.getDate())
                        .count(item.getSevenDayCount())
                        .cumulativeCount(item.getCountValue())
                        .build())
                .toList();

        List<MonthlyCountEntity> monthlySnapshots = new ArrayList<>(
                dashboardQueryRepository.findLatestMonthlyCounts(storeId, 13));
        Collections.reverse(monthlySnapshots);
        List<DashboardMonthlyResponseDTO> monthly = buildMonthlyData(monthlySnapshots);
        String latestMonthDay = monthly.isEmpty()
                ? null
                : monthly.getLast().getMostClickedDayOfWeek();

        return DashboardChartsResponseDTO.builder()
                .storeId(storeId)
                .currentHitCount(dashboardQueryRepository.sumActiveTagHitCount(storeId))
                .daily(daily)
                .weekly(weekly)
                .monthly(monthly)
                .latestMonthMostClickedDayOfWeek(latestMonthDay)
                .build();
    }

    private List<DashboardMonthlyResponseDTO> buildMonthlyData(
            List<MonthlyCountEntity> snapshots) {
        if (snapshots.isEmpty()) {
            return List.of();
        }

        List<DashboardMonthlyResponseDTO> result = new ArrayList<>();
        for (int i = 0; i < snapshots.size(); i++) {
            MonthlyCountEntity current = snapshots.get(i);
            long count = i == 0
                    ? 0L
                    : Math.max(0L,
                    current.getCountValue() - snapshots.get(i - 1).getCountValue());
            result.add(DashboardMonthlyResponseDTO.builder()
                    .monthStartDate(current.getDate())
                    .count(count)
                    .mostClickedDayOfWeek(current.getMostClickedDayOfWeek())
                    .build());
        }

        if (result.size() > 12) {
            return new ArrayList<>(result.subList(result.size() - 12, result.size()));
        }
        return result;
    }
}

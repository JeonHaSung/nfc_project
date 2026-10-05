package com.nfc_tag_service.management.dashBoard.service;

import com.nfc_tag_service.domain.HourMonthAccEntity;
import com.nfc_tag_service.domain.HourlyCountEntity;
import com.nfc_tag_service.domain.MonthlyCountEntity;
import com.nfc_tag_service.domain.SevenDayCountEntity;
import com.nfc_tag_service.domain.StoreEntity;
import com.nfc_tag_service.domain.WeeklyCountEntity;
import com.nfc_tag_service.domain.YearlyCountEntity;
import com.nfc_tag_service.management.dashBoard.repository.HourMonthAccRepository;
import com.nfc_tag_service.management.dashBoard.repository.HourlyCountRepository;
import com.nfc_tag_service.management.dashBoard.repository.MonthlyCountRepository;
import com.nfc_tag_service.management.dashBoard.repository.SevenDayCountRepository;
import com.nfc_tag_service.management.dashBoard.repository.WeeklyCountRepository;
import com.nfc_tag_service.management.dashBoard.repository.YearlyCountRepository;
import com.nfc_tag_service.management.store.repository.StoreRepository;
import com.nfc_tag_service.management.tag.repository.TagRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeeklyServiceImpl {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final StoreRepository storeRepository;
    private final WeeklyCountRepository weeklyCountRepository;
    private final SevenDayCountRepository sevenDayCountRepository;
    private final MonthlyCountRepository monthlyCountRepository;
    private final YearlyCountRepository yearlyCountRepository;
    private final HourlyCountRepository hourlyCountRepository;
    private final HourMonthAccRepository hourMonthAccRepository;
    private final TagRepository tagRepository;
    private final EntityManager entityManager;

    @Transactional
    public void dailyWeeklyCount() {
        List<StoreEntity> storeData = storeRepository.findAllNotDeleted();
        log.info("집계시작");

        for (StoreEntity data : storeData) {
            try {
                processStoreDailyCount(data);
            } catch (Exception e) {
                log.error("스토어 일별 카운트 처리 실패 - storeId: {}", data.getId(), e);
            }
        }
        LocalDate staleBefore = LocalDate.now(SERVICE_ZONE).minusDays(14);
        long staleHours = hourlyCountRepository.deleteByDateBefore(staleBefore);
        if (staleHours > 0) {
            log.warn("14일 이전 미적용 시간대 로그 정리 - 기준일: {}, 삭제 건수: {}", staleBefore, staleHours);
        }
    }

    @Transactional
    public void sevenDayWeeklyCount() {
        List<StoreEntity> storeData = storeRepository.findAllNotDeleted();
        log.info("7일 집계 시작");

        for (StoreEntity data : storeData) {
            try {
                processStoreSevenDayCount(data);
            } catch (Exception e) {
                log.error("스토어 7일 카운트 처리 실패 - storeId: {}", data.getId(), e);
            }
        }
    }

    @Transactional
    public void monthlyCount() {
        List<StoreEntity> storeData = storeRepository.findAllNotDeleted();
        log.info("월별 누적 집계 시작");

        for (StoreEntity data : storeData) {
            try {
                processStoreMonthlyCount(data);
            } catch (Exception e) {
                log.error("스토어 월별 누적 카운트 처리 실패 - storeId: {}", data.getId(), e);
            }
        }
    }

    @Transactional
    public void backfillAllYearlyFromMonthly() {
        for (StoreEntity store : storeRepository.findAllNotDeleted()) {
            try {
                backfillYearlyFromMonthly(store.getId());
            } catch (Exception e) {
                log.error("연도별 스냅샷 보정 실패 - storeId: {}", store.getId(), e);
            }
        }
    }

    @Transactional
    public void deleteDailyDataOlderThanThreeMonths() {
        LocalDate cutoffDate = LocalDate.now(SERVICE_ZONE).minusMonths(3);
        long deletedCount = weeklyCountRepository.deleteByDateBefore(cutoffDate);
        log.info("3개월 이전 일별 집계 데이터 삭제 완료 - 기준일: {}, 삭제 건수: {}",
                cutoffDate, deletedCount);
    }

    @Transactional
    public void deleteSevenDayDataOlderThanSixMonths() {
        LocalDate cutoffDate = LocalDate.now(SERVICE_ZONE).minusMonths(6);
        int deletedCount = entityManager.createQuery(
                        "DELETE FROM SevenDayCountEntity s WHERE s.date < :cutoffDate")
                .setParameter("cutoffDate", cutoffDate)
                .executeUpdate();
        log.info("6개월 이전 7일 집계 데이터 삭제 완료 - 기준일: {}, 삭제 건수: {}",
                cutoffDate, deletedCount);
    }

    private void processStoreSevenDayCount(StoreEntity data) {
        LocalDate today = LocalDate.now(SERVICE_ZONE);
        LocalDate currentWeekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        LocalDate previousWeekStart = currentWeekStart.minusWeeks(1);
        if (sevenDayCountRepository.existsByStoreIdAndDate(data.getId(), previousWeekStart)) {
            return;
        }

        LocalDate previousWeekEnd = currentWeekStart.minusDays(1);
        String dayOfWeek = previousWeekStart.getDayOfWeek()
                .getDisplayName(TextStyle.FULL, Locale.KOREAN);

        Long cumulativeCount = findDailyCumulativeCountAtOrBefore(data.getId(), previousWeekEnd)
                .orElseGet(() -> findTagCountSum(data.getId()));
        Optional<Long> lastCumulativeCountOpt =
                findLatestSevenDayCumulativeCount(data.getId(), previousWeekStart);
        Long sevenDayCount = lastCumulativeCountOpt
                .map(lastCount -> Math.max(0L, cumulativeCount - lastCount))
                .orElse(cumulativeCount);
        String mostClickedDay = pickMostClickedDay(
                findWeekdayCounts(data.getId(), previousWeekStart, previousWeekEnd))
                .orElse(null);

        entityManager.persist(SevenDayCountEntity.builder()
                .id(newLogId())
                .countValue(cumulativeCount)
                .sevenDayCount(sevenDayCount)
                .dayOfWeek(dayOfWeek)
                .mostClickedDayOfWeek(mostClickedDay)
                .date(previousWeekStart)
                .storeId(data.getId())
                .build());
    }

    private void processStoreMonthlyCount(StoreEntity data) {
        YearMonth previousMonth = YearMonth.from(LocalDate.now(SERVICE_ZONE)).minusMonths(1);
        LocalDate previousMonthStart = previousMonth.atDay(1);
        LocalDate previousMonthEnd = previousMonth.atEndOfMonth();

        MonthlyCountEntity month = monthlyCountRepository
                .findFirstByStoreIdAndDateOrderByIdDesc(data.getId(), previousMonthStart)
                .orElse(null);
        Map<String, Long> weekdayCounts = findWeekdayCounts(
                data.getId(), previousMonthStart, previousMonthEnd);
        HourMonthAccEntity monthHours = hourMonthAccRepository
                .findByStoreIdAndDate(data.getId(), previousMonthStart)
                .orElse(null);
        Integer mostClickedHour = monthHours == null ? null : monthHours.mostClickedHour().orElse(null);
        if (month == null) {
            Optional<Long> cumulativeCountOpt = findDailyCumulativeCountInMonth(
                    data.getId(), previousMonthStart, previousMonthEnd);
            if (cumulativeCountOpt.isEmpty()) {
                log.warn("월별 집계 생략 - 이전 달 일별 데이터 없음, storeId: {}, 기간: {} ~ {}",
                        data.getId(), previousMonthStart, previousMonthEnd);
            } else {
                month = MonthlyCountEntity.builder()
                        .id(newLogId())
                        .countValue(cumulativeCountOpt.get())
                        .mostClickedDayOfWeek(pickMostClickedDay(weekdayCounts).orElse(null))
                        .mostClickedHour(mostClickedHour)
                        .date(previousMonthStart)
                        .storeId(data.getId())
                        .build();
                entityManager.persist(month);
            }
        }

        backfillYearlyFromMonthly(data.getId());
        if (month != null) {
            applyYearlyMonth(
                    data.getId(),
                    previousMonthStart,
                    nz(month.getCountValue()),
                    weekdayCounts,
                    monthHours == null || monthHours.getHourCounts() == null
                            ? Map.of()
                            : monthHours.getHourCounts());
        }
    }

    private void processStoreDailyCount(StoreEntity data) {
        LocalDate today = LocalDate.now(SERVICE_ZONE);
        LocalDate yesterday = today.minusDays(1);
        List<LocalDate> dates = new ArrayList<>(
                hourlyCountRepository.findDistinctDatesByStoreIdAndDateBefore(data.getId(), today));
        if (!dates.contains(yesterday)) {
            dates.add(yesterday);
        }
        dates.sort(Comparator.naturalOrder());
        for (LocalDate targetDate : dates) {
            if (targetDate == null || !targetDate.isBefore(today)) {
                continue;
            }
            processStoreDailyCountForDate(data, targetDate);
            hourlyCountRepository.deleteByStoreIdAndDate(data.getId(), targetDate);
        }
    }

    private void processStoreDailyCountForDate(StoreEntity data, LocalDate targetDate) {
        Map<Integer, Long> hourCounts = toHourMap(
                hourlyCountRepository.findByStoreIdAndDateOrderByHourOfDayAsc(data.getId(), targetDate));
        Integer mostClickedHour = pickMostClickedHour(hourCounts).orElse(null);
        applyHoursToMonthAcc(data.getId(), targetDate, hourCounts);

        if (weeklyCountRepository.existsByStoreIdAndDate(data.getId(), targetDate)) {
            return;
        }
        String dayOfWeek = targetDate.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.KOREAN);
        long hourSum = 0L;
        for (Long value : hourCounts.values()) {
            hourSum += value == null ? 0L : value;
        }
        Optional<Long> lastCumulativeCountOpt = weeklyCountRepository
                .findTopByStoreIdAndDateLessThanEqualOrderByDateDescIdDesc(data.getId(), targetDate.minusDays(1))
                .map(WeeklyCountEntity::getCountValue);
        long live = findTagCountSum(data.getId());
        long todayCount;
        long cumulativeCount;
        if (lastCumulativeCountOpt.isPresent()) {
            long last = lastCumulativeCountOpt.get();
            todayCount = hourSum > 0 ? hourSum : Math.max(0L, live - last);
            cumulativeCount = last + todayCount;
        } else {
            cumulativeCount = Math.max(live, hourSum);
            todayCount = cumulativeCount;
        }

        weeklyCountRepository.save(buildWeeklyCount(
                newLogId(),
                cumulativeCount,
                todayCount,
                dayOfWeek,
                mostClickedHour,
                targetDate,
                data.getId()));
    }

    private String newLogId() {
        String timePrefix = LocalDateTime.now(SERVICE_ZONE).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String uuidSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        return timePrefix + uuidSuffix;
    }

    private void applyYearlyMonth(
            String storeId,
            LocalDate monthStart,
            long cumulative,
            Map<String, Long> weekdayCounts,
            Map<Integer, Long> hourCounts
    ) {
        LocalDate yearStart = monthStart.withDayOfYear(1);
        YearlyCountEntity yearly = yearlyCountRepository.findByStoreIdAndDate(storeId, yearStart)
                .orElseGet(() -> YearlyCountEntity.builder()
                        .id(newLogId())
                        .storeId(storeId)
                        .date(yearStart)
                        .countValue(0L)
                        .weekdayCounts(new LinkedHashMap<>())
                        .hourCounts(new LinkedHashMap<>())
                        .build());
        yearly.applyMonthSnapshot(monthStart, cumulative, weekdayCounts, hourCounts);
        yearlyCountRepository.save(yearly);
    }

    private void backfillYearlyFromMonthly(String storeId) {
        List<MonthlyCountEntity> months = monthlyCountRepository.findByStoreIdOrderByDateAscIdAsc(storeId);
        if (months.isEmpty()) {
            return;
        }
        LinkedHashMap<Integer, MonthlyCountEntity> lastByYear = new LinkedHashMap<>();
        Map<Integer, Map<String, Long>> weekdayVotes = new LinkedHashMap<>();
        Map<Integer, Map<Integer, Long>> hourVotes = new LinkedHashMap<>();
        for (MonthlyCountEntity month : months) {
            if (month.getDate() == null) {
                continue;
            }
            int year = month.getDate().getYear();
            lastByYear.put(year, month);
            weekdayVotes.computeIfAbsent(year, key -> new LinkedHashMap<>());
            hourVotes.computeIfAbsent(year, key -> new LinkedHashMap<>());
            String day = month.getMostClickedDayOfWeek();
            if (day != null && !day.isBlank()) {
                weekdayVotes.get(year).merge(day, 1L, Long::sum);
            }
            if (month.getMostClickedHour() != null) {
                hourVotes.get(year).merge(month.getMostClickedHour(), 1L, Long::sum);
            }
        }
        int currentYear = LocalDate.now(SERVICE_ZONE).getYear();
        for (Map.Entry<Integer, MonthlyCountEntity> entry : lastByYear.entrySet()) {
            if (entry.getKey() >= currentYear) {
                continue;
            }
            LocalDate yearStart = LocalDate.of(entry.getKey(), 1, 1);
            if (yearlyCountRepository.existsByStoreIdAndDate(storeId, yearStart)) {
                continue;
            }
            String mostClicked = pickMostClickedDay(weekdayVotes.getOrDefault(entry.getKey(), Map.of()))
                    .orElse(entry.getValue().getMostClickedDayOfWeek());
            Integer mostClickedHour = pickMostClickedHour(hourVotes.getOrDefault(entry.getKey(), Map.of()))
                    .orElse(entry.getValue().getMostClickedHour());
            yearlyCountRepository.save(YearlyCountEntity.builder()
                    .id(newLogId())
                    .storeId(storeId)
                    .date(yearStart)
                    .countValue(entry.getValue().getCountValue())
                    .mostClickedDayOfWeek(mostClicked)
                    .mostClickedHour(mostClickedHour)
                    .weekdayCounts(new LinkedHashMap<>())
                    .hourCounts(new LinkedHashMap<>())
                    .build());
        }
    }

    private WeeklyCountEntity buildWeeklyCount(String id, Long cumulativeCount, Long todayCount,
                                               String dayOfWeek, Integer mostClickedHour,
                                               LocalDate targetDate, String storeId) {
        return WeeklyCountEntity.builder()
                .id(id)
                .countValue(cumulativeCount)
                .todayCount(todayCount)
                .dayOfWeek(dayOfWeek)
                .mostClickedHour(mostClickedHour)
                .date(targetDate)
                .storeId(storeId)
                .build();
    }

    private void applyHoursToMonthAcc(String storeId, LocalDate day, Map<Integer, Long> hourCounts) {
        LocalDate monthStart = day.withDayOfMonth(1);
        HourMonthAccEntity acc = hourMonthAccRepository.findByStoreIdAndDate(storeId, monthStart)
                .orElseGet(() -> HourMonthAccEntity.builder()
                        .id(newLogId())
                        .storeId(storeId)
                        .date(monthStart)
                        .hourCounts(new LinkedHashMap<>())
                        .build());
        acc.applyDay(day, hourCounts);
        hourMonthAccRepository.save(acc);
    }

    private Map<Integer, Long> toHourMap(List<HourlyCountEntity> rows) {
        Map<Integer, Long> counts = new LinkedHashMap<>();
        if (rows == null) {
            return counts;
        }
        for (HourlyCountEntity row : rows) {
            if (row.getHourOfDay() == null) {
                continue;
            }
            counts.merge(row.getHourOfDay(), nz(row.getCountValue()), Long::sum);
        }
        return counts;
    }

    private Long findTagCountSum(String storeId) {
        Long sum = tagRepository.sumHitCountByStoreId(storeId);
        return sum != null ? sum : 0L;
    }

    private Optional<Long> findDailyCumulativeCountAtOrBefore(String storeId, LocalDate endDate) {
        return weeklyCountRepository
                .findTopByStoreIdAndDateLessThanEqualOrderByDateDescIdDesc(storeId, endDate)
                .map(WeeklyCountEntity::getCountValue);
    }

    private Optional<Long> findDailyCumulativeCountInMonth(
            String storeId, LocalDate monthStart, LocalDate monthEnd) {
        return weeklyCountRepository
                .findTopByStoreIdAndDateBetweenOrderByDateDescIdDesc(storeId, monthStart, monthEnd)
                .map(WeeklyCountEntity::getCountValue);
    }

    private Optional<Long> findLatestSevenDayCumulativeCount(
            String storeId, LocalDate previousWeekStart) {
        return entityManager.createQuery(
                        "SELECT s.countValue FROM SevenDayCountEntity s " +
                                "WHERE s.storeId = :storeId " +
                                "AND s.date < :previousWeekStart " +
                                "ORDER BY s.date DESC, s.id DESC",
                        Long.class)
                .setParameter("storeId", storeId)
                .setParameter("previousWeekStart", previousWeekStart)
                .setMaxResults(1)
                .getResultStream()
                .findFirst();
    }

    private Map<String, Long> findWeekdayCounts(
            String storeId, LocalDate firstDay, LocalDate lastDay) {
        Map<String, Long> counts = new LinkedHashMap<>();
        List<Object[]> rows = entityManager.createQuery(
                        "SELECT w.dayOfWeek, SUM(w.todayCount) FROM WeeklyCountEntity w " +
                                "WHERE w.storeId = :storeId " +
                                "AND w.date BETWEEN :firstDay AND :lastDay " +
                                "AND w.id = (SELECT MAX(w2.id) FROM WeeklyCountEntity w2 " +
                                "WHERE w2.storeId = w.storeId AND w2.date = w.date) " +
                                "GROUP BY w.dayOfWeek",
                        Object[].class)
                .setParameter("storeId", storeId)
                .setParameter("firstDay", firstDay)
                .setParameter("lastDay", lastDay)
                .getResultList();
        for (Object[] row : rows) {
            if (row[0] == null) {
                continue;
            }
            long sum = row[1] == null ? 0L : ((Number) row[1]).longValue();
            counts.put((String) row[0], sum);
        }
        return counts;
    }

    private Optional<String> pickMostClickedDay(Map<String, Long> weekdayCounts) {
        if (weekdayCounts == null || weekdayCounts.isEmpty()) {
            return Optional.empty();
        }
        return weekdayCounts.entrySet().stream()
                .filter(entry -> entry.getValue() != null && entry.getValue() > 0)
                .max(Comparator.<Map.Entry<String, Long>>comparingLong(Map.Entry::getValue)
                        .thenComparing(Map.Entry::getKey))
                .map(Map.Entry::getKey);
    }

    private Optional<Integer> pickMostClickedHour(Map<Integer, Long> hourCounts) {
        if (hourCounts == null || hourCounts.isEmpty()) {
            return Optional.empty();
        }
        return hourCounts.entrySet().stream()
                .filter(entry -> entry.getKey() != null && entry.getValue() != null && entry.getValue() > 0)
                .max(Comparator.<Map.Entry<Integer, Long>>comparingLong(Map.Entry::getValue)
                        .thenComparing(Map.Entry::getKey, Comparator.reverseOrder()))
                .map(Map.Entry::getKey);
    }

    private static long nz(Long value) {
        return value == null ? 0L : value;
    }
}
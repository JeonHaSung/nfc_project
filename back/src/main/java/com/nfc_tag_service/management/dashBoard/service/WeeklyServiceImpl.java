package com.nfc_tag_service.management.dashBoard.service;

import com.nfc_tag_service.domain.MonthlyCountEntity;
import com.nfc_tag_service.domain.SevenDayCountEntity;
import com.nfc_tag_service.domain.StoreEntity;
import com.nfc_tag_service.domain.WeeklyCountEntity;
import com.nfc_tag_service.management.dashBoard.repository.WeeklyCountRepository;
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
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeeklyServiceImpl {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final StoreRepository storeRepository;
    private final WeeklyCountRepository weeklyCountRepository;
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
        // 1. ID 생성
        LocalDateTime now = LocalDateTime.now(SERVICE_ZONE);
        String timePrefix = now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String uuidSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 2);
        String id = timePrefix + uuidSuffix;

        LocalDate currentWeekStart = now.toLocalDate()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        LocalDate previousWeekStart = currentWeekStart.minusWeeks(1);
        LocalDate previousWeekEnd = currentWeekStart.minusDays(1);
        String dayOfWeek = previousWeekStart.getDayOfWeek()
                .getDisplayName(TextStyle.FULL, Locale.KOREAN);

        Long cumulativeCount = findDailyCumulativeCountAtOrBefore(data.getId(), previousWeekEnd)
                .orElseGet(() -> findTagCountSum(data.getId()));

        Optional<Long> lastCumulativeCountOpt =
                findLatestSevenDayCumulativeCount(data.getId(), previousWeekStart);

        Long sevenDayCount = lastCumulativeCountOpt
                .map(lastCount -> Math.max(0L, cumulativeCount - lastCount))
                .orElse(0L);

        // 6. 저장
        SevenDayCountEntity entity = SevenDayCountEntity.builder()
                .id(id)
                .countValue(cumulativeCount)
                .sevenDayCount(sevenDayCount)
                .dayOfWeek(dayOfWeek)
                .date(previousWeekStart)
                .storeId(data.getId())
                .build();

        entityManager.persist(entity);
    }

    private void processStoreMonthlyCount(StoreEntity data) {
        LocalDateTime now = LocalDateTime.now(SERVICE_ZONE);
        String timePrefix = now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String uuidSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 2);
        String id = timePrefix + uuidSuffix;

        YearMonth previousMonth = YearMonth.from(now.toLocalDate()).minusMonths(1);
        LocalDate previousMonthStart = previousMonth.atDay(1);
        LocalDate previousMonthEnd = previousMonth.atEndOfMonth();

        Optional<Long> cumulativeCountOpt =
                findDailyCumulativeCountOnDate(data.getId(), previousMonthEnd);
        Optional<String> mostClickedDayOfWeekOpt = findMostClickedDayOfWeek(
                data.getId(), previousMonthStart, previousMonthEnd);

        if (cumulativeCountOpt.isEmpty() || mostClickedDayOfWeekOpt.isEmpty()) {
            log.warn("월별 집계 생략 - 이전 달 일별 데이터 없음, storeId: {}, 기간: {} ~ {}",
                    data.getId(), previousMonthStart, previousMonthEnd);
            return;
        }

        MonthlyCountEntity entity = MonthlyCountEntity.builder()
                .id(id)
                .countValue(cumulativeCountOpt.get())
                .mostClickedDayOfWeek(mostClickedDayOfWeekOpt.get())
                .date(previousMonthStart)
                .storeId(data.getId())
                .build();

        entityManager.persist(entity);
    }

    private void processStoreDailyCount(StoreEntity data) {
        // ID 생성 (년월일시분초밀리초 + UUID 2자리)
        LocalDateTime now = LocalDateTime.now(SERVICE_ZONE);
        String timePrefix = now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String uuidSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 2);
        String id = timePrefix + uuidSuffix;

        // 자정 실행 기준: 집계 대상은 '어제' 날짜와 요일
        LocalDate targetDate = now.toLocalDate().minusDays(1);
        String dayOfWeek = targetDate.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.KOREAN);

        // 오늘 누적 스냅샷
        Long cumulativeCount = findTagCountSum(data.getId());

        // 직전 누적 스냅샷 (기록이 없으면 Optional.empty())
        Optional<Long> lastCumulativeCountOpt = findTopByStoreIdOrderByIdDesc(data.getId());

        // 최초 집계 시 0L, 이후 집계 시 (현재 누적 - 직전 누적)
        Long todayCount = lastCumulativeCountOpt
                .map(lastCount -> Math.max(0L, cumulativeCount - lastCount))
                .orElse(0L);

        // 엔티티 생성 및 저장 (어제 날짜 기준)
        WeeklyCountEntity entity = buildWeeklyCount(id, cumulativeCount, todayCount, dayOfWeek, targetDate, data.getId());
        weeklyCountRepository.save(entity);
    }

    private WeeklyCountEntity buildWeeklyCount(String id, Long cumulativeCount, Long todayCount,
                                               String dayOfWeek, LocalDate targetDate, String storeId) {
        return WeeklyCountEntity.builder()
                .id(id)
                .countValue(cumulativeCount)
                .todayCount(todayCount)
                .dayOfWeek(dayOfWeek)
                .date(targetDate)
                .storeId(storeId)
                .build();
    }

    private Long findTagCountSum(String storeId) {
        Long sum = tagRepository.sumHitCountByStoreId(storeId);
        return sum != null ? sum : 0L; // null 예외 안전장치
    }

    private Optional<Long> findTopByStoreIdOrderByIdDesc(String storeId) {
        return weeklyCountRepository.findTopByStoreIdOrderByIdDesc(storeId)
                .map(WeeklyCountEntity::getCountValue);
    }

    private Optional<Long> findDailyCumulativeCountAtOrBefore(String storeId, LocalDate endDate) {
        return weeklyCountRepository
                .findTopByStoreIdAndDateLessThanEqualOrderByDateDescIdDesc(storeId, endDate)
                .map(WeeklyCountEntity::getCountValue);
    }

    private Optional<Long> findDailyCumulativeCountOnDate(String storeId, LocalDate date) {
        return weeklyCountRepository
                .findTopByStoreIdAndDateOrderByIdDesc(storeId, date)
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

    private Optional<String> findMostClickedDayOfWeek(
            String storeId, LocalDate firstDayOfMonth, LocalDate lastDayOfMonth) {
        return entityManager.createQuery(
                        "SELECT w.dayOfWeek FROM WeeklyCountEntity w " +
                                "WHERE w.storeId = :storeId " +
                                "AND w.date BETWEEN :firstDay AND :lastDay " +
                                "GROUP BY w.dayOfWeek " +
                                "ORDER BY SUM(w.todayCount) DESC, w.dayOfWeek ASC",
                        String.class)
                .setParameter("storeId", storeId)
                .setParameter("firstDay", firstDayOfMonth)
                .setParameter("lastDay", lastDayOfMonth)
                .setMaxResults(1)
                .getResultStream()
                .findFirst();
    }
}
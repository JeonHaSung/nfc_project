package com.nfc_tag_service.global.scheduler;

import com.nfc_tag_service.management.dashBoard.service.WeeklyServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Component
@RequiredArgsConstructor
public class WeeklyCountScheduler {
    private final WeeklyServiceImpl weeklyService;
    private final AtomicBoolean dailyRunning = new AtomicBoolean(false);
    private final AtomicBoolean weeklyRunning = new AtomicBoolean(false);
    private final AtomicBoolean monthlyRunning = new AtomicBoolean(false);
    private final AtomicBoolean dailyCleanupRunning = new AtomicBoolean(false);
    private final AtomicBoolean weeklyCleanupRunning = new AtomicBoolean(false);

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    public void processDailyWeeklyCount() {
        runExclusive("일별 집계", dailyRunning, weeklyService::dailyWeeklyCount);
    }

    @Scheduled(cron = "0 5 0 * * SUN", zone = "Asia/Seoul")
    public void processSevenDayWeeklyCount() {
        runExclusive("주별 집계", weeklyRunning, weeklyService::sevenDayWeeklyCount);
    }

    @Scheduled(cron = "0 10 0 * * *", zone = "Asia/Seoul")
    public void deleteOldDailyCountData() {
        runExclusive("일별 만료 삭제", dailyCleanupRunning, weeklyService::deleteDailyDataOlderThanThreeMonths);
    }

    @Scheduled(cron = "0 15 0 1 * *", zone = "Asia/Seoul")
    public void processMonthlyCount() {
        runExclusive("월별 집계", monthlyRunning, weeklyService::monthlyCount);
    }

    @Scheduled(cron = "0 20 0 1 * *", zone = "Asia/Seoul")
    public void deleteOldSevenDayCountData() {
        runExclusive("주별 만료 삭제", weeklyCleanupRunning, weeklyService::deleteSevenDayDataOlderThanSixMonths);
    }

    private void runExclusive(String jobName, AtomicBoolean running, Runnable job) {
        if (!running.compareAndSet(false, true)) {
            log.warn("{} 이미 실행 중이라 건너뜁니다", jobName);
            return;
        }
        try {
            job.run();
        } catch (Exception e) {
            log.error("{} 실패", jobName, e);
        } finally {
            running.set(false);
        }
    }
}

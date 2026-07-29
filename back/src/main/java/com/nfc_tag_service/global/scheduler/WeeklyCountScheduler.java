package com.nfc_tag_service.global.scheduler;

import com.nfc_tag_service.management.dashBoard.service.WeeklyServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WeeklyCountScheduler {
    private final WeeklyServiceImpl weeklyService;
    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    public void processDailyWeeklyCount() {
        weeklyService.dailyWeeklyCount();
    }
    @Scheduled(cron = "0 5 0 * * SUN", zone = "Asia/Seoul")
    public void processSevenDayWeeklyCount() {
        weeklyService.sevenDayWeeklyCount();
    }
    @Scheduled(cron = "0 10 0 * * *", zone = "Asia/Seoul")
    public void deleteOldDailyCountData() {
        weeklyService.deleteDailyDataOlderThanThreeMonths();
    }
    @Scheduled(cron = "0 15 0 1 * *", zone = "Asia/Seoul")
    public void processMonthlyCount() {
        weeklyService.monthlyCount();
    }

    @Scheduled(cron = "0 20 0 1 * *", zone = "Asia/Seoul")
    public void deleteOldSevenDayCountData() {
        weeklyService.deleteSevenDayDataOlderThanSixMonths();
    }

}

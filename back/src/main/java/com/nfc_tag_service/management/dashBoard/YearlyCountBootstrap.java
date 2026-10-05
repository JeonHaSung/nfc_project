package com.nfc_tag_service.management.dashBoard;

import com.nfc_tag_service.management.dashBoard.service.WeeklyServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(30)
@RequiredArgsConstructor
public class YearlyCountBootstrap implements ApplicationRunner {

    private final WeeklyServiceImpl weeklyService;

    @Override
    public void run(ApplicationArguments args) {
        weeklyService.backfillAllYearlyFromMonthly();
    }
}

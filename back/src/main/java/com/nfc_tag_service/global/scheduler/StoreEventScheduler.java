package com.nfc_tag_service.global.scheduler;

import com.nfc_tag_service.management.store.service.StoreEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Component
@RequiredArgsConstructor
public class StoreEventScheduler {

    private final StoreEventService storeEventService;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")
    public void disableExpiredEvents() {
        if (!running.compareAndSet(false, true)) {
            return;
        }
        try {
            int count = storeEventService.expireOverdue();
            if (count > 0) {
                log.info("기간 만료 이벤트 OFF 처리 {}건", count);
            }
        } catch (Exception e) {
            log.error("기간 만료 이벤트 OFF 처리 실패", e);
        } finally {
            running.set(false);
        }
    }
}

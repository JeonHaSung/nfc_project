package com.nfc_tag_service.management.dashBoard.service;

import com.nfc_tag_service.management.dashBoard.repository.HourlyCountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HourlyCountService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter ID_TIME =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");

    private final HourlyCountRepository hourlyCountRepository;

    @Transactional
    public void incrementForStore(String storeId) {
        if (!StringUtils.hasText(storeId)) {
            return;
        }
        LocalDateTime now = LocalDateTime.now(SERVICE_ZONE);
        increment(storeId.trim(), now.toLocalDate(), now.getHour());
    }

    private void increment(String storeId, LocalDate date, int hour) {
        try {
            hourlyCountRepository.increment(newLogId(), storeId, date, hour);
        } catch (DataIntegrityViolationException first) {
            hourlyCountRepository.increment(newLogId(), storeId, date, hour);
        }
    }

    private String newLogId() {
        return LocalDateTime.now(SERVICE_ZONE).format(ID_TIME)
                + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
}

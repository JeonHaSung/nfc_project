package com.nfc_tag_service.management.restore;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record StorePurgeLogItem(
        Long id,
        String actorName,
        String actorEmail,
        String actorPhone,
        String storeName,
        String reason,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
        LocalDateTime createdAt
) {
}

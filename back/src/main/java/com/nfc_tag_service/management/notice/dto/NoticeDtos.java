package com.nfc_tag_service.management.notice.dto;

import com.nfc_tag_service.domain.NoticeEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public final class NoticeDtos {

    private NoticeDtos() {
    }

    @Getter
    @NoArgsConstructor
    public static class NoticeRequest {
        private String title;
        private String body;
    }

    @Getter
    @NoArgsConstructor
    public static class NoticeUpdateRequest {
        private Long id;
        private String title;
        private String body;
    }

    @Getter
    public static class NoticeResponse {
        private final Long id;
        private final String title;
        private final String body;
        private final boolean selected;
        private final LocalDateTime createdAt;
        private final LocalDateTime updatedAt;

        public NoticeResponse(NoticeEntity entity) {
            this.id = entity.getId();
            this.title = entity.getTitle();
            this.body = entity.getBody();
            this.selected = entity.isSelected();
            this.createdAt = entity.getCreatedAt();
            this.updatedAt = entity.getUpdatedAt();
        }
    }

    @Getter
    public static class ActiveNoticeResponse {
        private final Long id;
        private final String title;
        private final String body;

        public ActiveNoticeResponse(NoticeEntity entity) {
            this.id = entity.getId();
            this.title = entity.getTitle();
            this.body = entity.getBody();
        }
    }
}

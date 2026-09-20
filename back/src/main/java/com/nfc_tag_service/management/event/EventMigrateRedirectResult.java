package com.nfc_tag_service.management.event;

/**
 * 일회성 마이그레이션 결과.
 * 완료 후 management.event 패키지와 프론트 이벤트 API/버튼을 함께 삭제하면 된다.
 */
public record EventMigrateRedirectResult(
        String tagId,
        String category,
        boolean redirectCopied
) {
}

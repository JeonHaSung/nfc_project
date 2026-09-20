package com.nfc_tag_service.management.event;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.security.AdminPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 일회성 이벤트 API.
 * 마이그레이션이 끝나면 이 클래스와 event 패키지 전체를 삭제하면 된다.
 */
@RestController
@RequestMapping("/management/event")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping("/tags/{tagId}/migrate-redirects")
    public ResponseEntity<ApiResponse<EventMigrateRedirectResult>> migrateTagRedirect(
            @PathVariable("tagId") String tagId,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        EventMigrateRedirectResult result = eventService.migrateTagRedirect(tagId, principal);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS", result));
    }
}

package com.nfc_tag_service.management.restore;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.global.security.AdminPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/management/restore")
@RequiredArgsConstructor
public class RestoreController {

    private final RestoreService restoreService;

    @GetMapping("/stores")
    public ResponseEntity<ApiResponse<List<RestoreStoreItem>>> stores(
            @RequestParam("registeredById") Long registeredById
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                restoreService.listStores(registeredById)
        ));
    }

    @GetMapping("/stores/{storeId}/tags")
    public ResponseEntity<ApiResponse<List<RestoreTagItem>>> tags(@PathVariable("storeId") String storeId) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                restoreService.listTags(storeId)
        ));
    }

    @GetMapping("/purge-logs")
    public ResponseEntity<ApiResponse<List<StorePurgeLogItem>>> purgeLogs() {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                restoreService.listPurgeLogs()
        ));
    }

    @PostMapping("/stores/{storeId}")
    public ResponseEntity<ApiResponse<RestoreStoreItem>> restoreStore(@PathVariable("storeId") String storeId) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                restoreService.restoreStore(storeId)
        ));
    }

    @PostMapping("/tags/{tagId}")
    public ResponseEntity<ApiResponse<RestoreTagItem>> restoreTag(@PathVariable("tagId") String tagId) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                restoreService.restoreTag(tagId)
        ));
    }

    @PostMapping("/stores/{storeId}/purge")
    public ResponseEntity<ApiResponse<Void>> purgeStore(
            @PathVariable("storeId") String storeId,
            @RequestBody StorePurgeRequest request,
            @AuthenticationPrincipal AdminPrincipal principal
    ) {
        restoreService.purgeStore(storeId, request, principal);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "SUCCESS"));
    }
}

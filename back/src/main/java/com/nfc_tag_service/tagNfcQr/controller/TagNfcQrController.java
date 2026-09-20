package com.nfc_tag_service.tagNfcQr.controller;

import com.nfc_tag_service.global.exception.ApiResponse;
import com.nfc_tag_service.management.redirecting.dto.RedirectingResponseDTO;
import com.nfc_tag_service.management.tag.dto.TagOpenResult;
import com.nfc_tag_service.management.tag.service.TagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class TagNfcQrController {
    private final TagService tagService;

    @GetMapping("/tag/open")
    public ResponseEntity<Void> openTag(@RequestParam("ti") String tagId) {
        log.info("[태그]접속: {}", tagId);
        TagOpenResult result = tagService.resolveOpen(tagId);
        return ResponseEntity
                .status(HttpStatus.FOUND)
                .location(URI.create(result.location()))
                .build();
    }

    @GetMapping("/tag/choices")
    public ResponseEntity<ApiResponse<List<RedirectingResponseDTO>>> choices(@RequestParam("ti") String tagId) {
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK.value(),
                "SUCCESS",
                tagService.listChoices(tagId)
        ));
    }

    @GetMapping("/tag/go")
    public ResponseEntity<Void> go(@RequestParam("ri") Long redirectingId) {
        TagOpenResult result = tagService.resolveGo(redirectingId);
        return ResponseEntity
                .status(HttpStatus.FOUND)
                .location(URI.create(result.location()))
                .build();
    }
}

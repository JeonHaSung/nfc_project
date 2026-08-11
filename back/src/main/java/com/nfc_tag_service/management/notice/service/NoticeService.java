package com.nfc_tag_service.management.notice.service;

import com.nfc_tag_service.domain.NoticeEntity;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.management.notice.dto.NoticeDtos.ActiveNoticeResponse;
import com.nfc_tag_service.management.notice.dto.NoticeDtos.NoticeRequest;
import com.nfc_tag_service.management.notice.dto.NoticeDtos.NoticeResponse;
import com.nfc_tag_service.management.notice.dto.NoticeDtos.NoticeUpdateRequest;
import com.nfc_tag_service.management.notice.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;

    @Transactional(readOnly = true)
    public List<NoticeResponse> list() {
        return noticeRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(NoticeResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public ActiveNoticeResponse active() {
        return noticeRepository.findFirstBySelectedTrue()
                .map(ActiveNoticeResponse::new)
                .orElse(null);
    }

    @Transactional
    public NoticeResponse create(NoticeRequest request) {
        String title = requireTitle(request.getTitle());
        String body = requireBody(request.getBody());
        NoticeEntity saved = noticeRepository.save(NoticeEntity.builder()
                .title(title)
                .body(body)
                .selected(false)
                .build());
        return new NoticeResponse(saved);
    }

    @Transactional
    public NoticeResponse update(NoticeUpdateRequest request) {
        if (request.getId() == null) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        NoticeEntity notice = noticeRepository.findById(request.getId())
                .orElseThrow(() -> new CustomException(ErrorCode.NOTICE_NOT_FOUND));
        notice.update(requireTitle(request.getTitle()), requireBody(request.getBody()));
        return new NoticeResponse(notice);
    }

    @Transactional
    public int delete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        List<NoticeEntity> notices = noticeRepository.findAllById(ids);
        if (notices.isEmpty()) {
            throw new CustomException(ErrorCode.NOTICE_NOT_FOUND);
        }
        noticeRepository.deleteAll(notices);
        return notices.size();
    }

    @Transactional
    public NoticeResponse select(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new CustomException(ErrorCode.NOTICE_NOT_FOUND);
        }
        noticeRepository.clearAllSelected();
        NoticeEntity notice = noticeRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.NOTICE_NOT_FOUND));
        notice.select();
        return new NoticeResponse(notice);
    }

    @Transactional
    public void clearSelection() {
        noticeRepository.clearAllSelected();
    }

    private String requireTitle(String title) {
        if (!StringUtils.hasText(title)) {
            throw new CustomException(ErrorCode.INVALID_NOTICE_INPUT);
        }
        String value = title.trim();
        if (value.length() > 200) {
            throw new CustomException(ErrorCode.INVALID_NOTICE_INPUT);
        }
        return value;
    }

    private String requireBody(String body) {
        if (!StringUtils.hasText(body)) {
            throw new CustomException(ErrorCode.INVALID_NOTICE_INPUT);
        }
        return body.trim();
    }
}

package com.nfc_tag_service.management.store.service;

import com.nfc_tag_service.domain.StoreReviewKeywordEntity;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.store.dto.StoreReviewKeywordDtos.KeywordRequest;
import com.nfc_tag_service.management.store.dto.StoreReviewKeywordDtos.KeywordResponse;
import com.nfc_tag_service.management.store.repository.StoreReviewKeywordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreReviewKeywordService {

    private static final int MAX_KEYWORD_LENGTH = 100;
    private static final int MAX_KEYWORDS_PER_STORE = 50;

    private final StoreReviewKeywordRepository keywordRepository;
    private final StoreService storeService;

    @Transactional(readOnly = true)
    public List<KeywordResponse> list(String storeId, AdminPrincipal principal) {
        storeService.assertStoreReadable(storeId, principal);
        return keywordRepository.findByStoreIdOrderByIdAsc(storeId.trim()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public KeywordResponse create(String storeId, KeywordRequest request, AdminPrincipal principal) {
        storeService.assertStoreReadable(storeId, principal);
        String id = storeId.trim();
        String keyword = normalize(request == null ? null : request.getKeyword());
        if (keywordRepository.countByStoreId(id) >= MAX_KEYWORDS_PER_STORE) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        if (keywordRepository.existsByStoreIdAndKeywordIgnoreCase(id, keyword)) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        StoreReviewKeywordEntity saved = keywordRepository.save(StoreReviewKeywordEntity.builder()
                .storeId(id)
                .keyword(keyword)
                .build());
        return toResponse(saved);
    }

    @Transactional
    public KeywordResponse update(String storeId, Long keywordId, KeywordRequest request, AdminPrincipal principal) {
        storeService.assertStoreReadable(storeId, principal);
        String id = storeId.trim();
        StoreReviewKeywordEntity entity = keywordRepository.findByIdAndStoreId(keywordId, id)
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_STORE_INPUT));
        String keyword = normalize(request == null ? null : request.getKeyword());
        if (keywordRepository.existsByStoreIdAndKeywordIgnoreCaseAndIdNot(id, keyword, keywordId)) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        entity.updateKeyword(keyword);
        return toResponse(entity);
    }

    @Transactional
    public int delete(String storeId, List<Long> ids, AdminPrincipal principal) {
        storeService.assertStoreReadable(storeId, principal);
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        return keywordRepository.deleteByStoreIdAndIdIn(storeId.trim(), ids);
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        String keyword = value.trim().replaceAll("\\s+", " ");
        if (keyword.isEmpty() || keyword.length() > MAX_KEYWORD_LENGTH) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        return keyword;
    }

    private KeywordResponse toResponse(StoreReviewKeywordEntity entity) {
        return KeywordResponse.builder()
                .id(entity.getId())
                .storeId(entity.getStoreId())
                .keyword(entity.getKeyword())
                .build();
    }
}

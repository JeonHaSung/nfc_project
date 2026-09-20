package com.nfc_tag_service.management.event;

import com.nfc_tag_service.domain.RedirectingEntity;
import com.nfc_tag_service.domain.RedirectingType;
import com.nfc_tag_service.domain.TagEntity;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.global.type.TagCategory;
import com.nfc_tag_service.management.redirecting.repository.RedirectingRepository;
import com.nfc_tag_service.management.store.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 일회성 이벤트. 카드 1장의 시리즈를 SERIES2로 바꾸고 매장 redirect_url을 redirectings에 넣는다.
 * 완료 후 이 패키지를 삭제하면 된다.
 */
@Service
@RequiredArgsConstructor
public class EventService {

    private static final RedirectingType PLACEHOLDER_TYPE = RedirectingType.NAVER_RECEIPT_REVIEW;

    private final StoreService storeService;
    private final EventQueryRepository eventQueryRepository;
    private final EventTagQueryRepository eventTagQueryRepository;
    private final RedirectingRepository redirectingRepository;

    @Transactional
    public EventMigrateRedirectResult migrateTagRedirect(String tagId, AdminPrincipal principal) {
        TagEntity tag = eventTagQueryRepository.findActiveAssignedById(tagId)
                .orElseThrow(() -> new CustomException(ErrorCode.TAG_ID_NOTFOUND));
        if (!StringUtils.hasText(tag.getStoreId())) {
            throw new CustomException(ErrorCode.TAG_ID_NOTFOUND);
        }
        storeService.assertStoreReadable(tag.getStoreId(), principal);

        tag.updateCategory(TagCategory.SERIES2.name());

        String redirectUrl = eventQueryRepository.findStoreRedirectUrl(tag.getStoreId())
                .map(String::trim)
                .filter(StringUtils::hasText)
                .orElse(null);
        if (!StringUtils.hasText(redirectUrl)) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }

        boolean redirectCopied = false;
        if (!redirectingRepository.existsByTagIdAndDelFalse(tag.getId())) {
            long hitCount = tag.getHitCount() == null ? 0L : tag.getHitCount();
            redirectingRepository.save(RedirectingEntity.builder()
                    .tagId(tag.getId())
                    .redirectingType(PLACEHOLDER_TYPE)
                    .value(redirectUrl)
                    .count(hitCount)
                    .build());
            redirectCopied = true;
        }
        return new EventMigrateRedirectResult(tag.getId(), tag.getCategory(), redirectCopied);
    }
}

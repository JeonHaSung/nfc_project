package com.nfc_tag_service.management.restore;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.domain.StoreEntity;
import com.nfc_tag_service.domain.StorePurgeLogEntity;
import com.nfc_tag_service.domain.TagEntity;
import com.nfc_tag_service.domain.TagStatus;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.admin.repository.AdminRepository;
import com.nfc_tag_service.management.dashBoard.repository.MonthlyCountRepository;
import com.nfc_tag_service.management.dashBoard.repository.SevenDayCountRepository;
import com.nfc_tag_service.management.dashBoard.repository.WeeklyCountRepository;
import com.nfc_tag_service.management.redirecting.repository.RedirectingRepository;
import com.nfc_tag_service.management.redirecting.service.RedirectingService;
import com.nfc_tag_service.management.store.repository.StoreRepository;
import com.nfc_tag_service.management.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RestoreService {

    private final AdminRepository adminRepository;
    private final StoreRepository storeRepository;
    private final TagRepository tagRepository;
    private final RedirectingService redirectingService;
    private final RedirectingRepository redirectingRepository;
    private final WeeklyCountRepository weeklyCountRepository;
    private final SevenDayCountRepository sevenDayCountRepository;
    private final MonthlyCountRepository monthlyCountRepository;
    private final StorePurgeLogRepository storePurgeLogRepository;

    @Transactional(readOnly = true)
    public List<RestoreStoreItem> listStores(Long registeredById) {
        if (registeredById == null) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        adminRepository.findByIdAndDelFalse(registeredById)
                .orElseThrow(() -> new CustomException(ErrorCode.ADMIN_NOT_FOUND));
        return storeRepository.findAllByRegisteredById(registeredById).stream()
                .map(store -> new RestoreStoreItem(
                        store.getId(),
                        store.getName(),
                        store.getCategory(),
                        store.isDel()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RestoreTagItem> listTags(String storeId) {
        StoreEntity store = storeRepository.findById(storeId)
                .orElseThrow(() -> new CustomException(ErrorCode.STORE_ID_NOTFOUND));
        if (store.isDel()) {
            throw new CustomException(ErrorCode.STORE_ID_NOTFOUND);
        }
        return tagRepository.findAssignedByStoreIdIncludeDeleted(storeId).stream()
                .map(tag -> new RestoreTagItem(
                        tag.getId(),
                        tag.getNickname(),
                        tag.getCategory(),
                        tag.getExperienceType() == null ? null : tag.getExperienceType().name(),
                        tag.isDel()
                ))
                .toList();
    }

    @Transactional
    public RestoreStoreItem restoreStore(String storeId) {
        StoreEntity store = storeRepository.findById(storeId)
                .orElseThrow(() -> new CustomException(ErrorCode.STORE_ID_NOTFOUND));
        if (store.isDel()) {
            store.restore();
        }
        return new RestoreStoreItem(store.getId(), store.getName(), store.getCategory(), store.isDel());
    }

    @Transactional
    public RestoreTagItem restoreTag(String tagId) {
        TagEntity tag = tagRepository.findByIdIncludeDeleted(tagId)
                .orElseThrow(() -> new CustomException(ErrorCode.TAG_ID_NOTFOUND));
        if (tag.getStatus() != TagStatus.ASSIGNED || tag.getStoreId() == null) {
            throw new CustomException(ErrorCode.TAG_INVALID_STATUS);
        }
        StoreEntity store = storeRepository.findById(tag.getStoreId())
                .orElseThrow(() -> new CustomException(ErrorCode.STORE_ID_NOTFOUND));
        if (store.isDel()) {
            throw new CustomException(ErrorCode.STORE_ID_NOTFOUND);
        }
        if (tag.isDel()) {
            tagRepository.restoreById(tag.getId());
            redirectingService.restoreByTagId(tag.getId());
        }
        return new RestoreTagItem(
                tag.getId(),
                tag.getNickname(),
                tag.getCategory(),
                tag.getExperienceType() == null ? null : tag.getExperienceType().name(),
                false
        );
    }

    @Transactional(readOnly = true)
    public List<StorePurgeLogItem> listPurgeLogs() {
        return storePurgeLogRepository.findAllByOrderByIdDesc().stream()
                .map(log -> new StorePurgeLogItem(
                        log.getId(),
                        log.getActorName(),
                        log.getActorEmail(),
                        log.getActorPhone(),
                        log.getStoreName(),
                        log.getReason(),
                        log.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public void purgeStore(String storeId, StorePurgeRequest request, AdminPrincipal principal) {
        if (principal == null || principal.id() == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        String reason = request == null || request.reason() == null ? "" : request.reason().trim();
        String confirmation = request == null || request.confirmation() == null ? "" : request.confirmation().trim();
        if (reason.isEmpty() || !"동의".equals(confirmation)) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        StoreEntity store = storeRepository.findById(storeId)
                .orElseThrow(() -> new CustomException(ErrorCode.STORE_ID_NOTFOUND));
        if (!store.isDel()) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }

        AdminEntity actor = adminRepository.findByIdAndDelFalse(principal.id())
                .orElseThrow(() -> new CustomException(ErrorCode.ADMIN_NOT_FOUND));
        storePurgeLogRepository.save(new StorePurgeLogEntity(
                actor.getName(),
                actor.getEmail(),
                actor.getPhone(),
                store.getName(),
                reason
        ));

        weeklyCountRepository.deleteByStoreId(storeId);
        sevenDayCountRepository.deleteByStoreId(storeId);
        monthlyCountRepository.deleteByStoreId(storeId);

        List<String> tagIds = tagRepository.findIdsByStoreIdIncludeDeleted(storeId);
        if (!tagIds.isEmpty()) {
            redirectingRepository.deleteByTagIdIn(tagIds);
        }
        tagRepository.hardDeleteByStoreId(storeId);
        storeRepository.hardDeleteById(storeId);
    }
}

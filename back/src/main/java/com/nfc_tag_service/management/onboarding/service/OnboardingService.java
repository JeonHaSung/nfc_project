package com.nfc_tag_service.management.onboarding.service;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.domain.AdminRole;
import com.nfc_tag_service.domain.StoreEntity;
import com.nfc_tag_service.domain.TagEntity;
import com.nfc_tag_service.domain.TagStatus;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.global.type.StoreCategory;
import com.nfc_tag_service.management.admin.repository.AdminRepository;
import com.nfc_tag_service.management.onboarding.dto.OnboardingDtos.AttachCardRequest;
import com.nfc_tag_service.management.onboarding.dto.OnboardingDtos.OnboardingStoreItem;
import com.nfc_tag_service.management.onboarding.dto.OnboardingDtos.RegisterStoreRequest;
import com.nfc_tag_service.management.onboarding.dto.OnboardingDtos.TagPreview;
import com.nfc_tag_service.management.store.repository.StoreRepository;
import com.nfc_tag_service.management.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final TagRepository tagRepository;
    private final StoreRepository storeRepository;
    private final AdminRepository adminRepository;

    @Transactional(readOnly = true)
    public TagPreview getTagPreview(String tagId) {
        TagEntity tag = requireFactoryOrderedTag(tagId);
        return new TagPreview(tag.getId(), tag.getCategory(), tag.getTagUrl(), tag.getStatus().name());
    }

    @Transactional(readOnly = true)
    public List<OnboardingStoreItem> myStores(AdminPrincipal principal, Long registeredById) {
        Long ownerId = resolveStoreOwnerIdForList(principal, registeredById);
        return storeRepository.findActiveByRegisteredById(ownerId).stream()
                .map(store -> new OnboardingStoreItem(store.getId(), store.getName(), store.getRedirectUrl()))
                .toList();
    }

    @Transactional
    public String registerStore(AdminPrincipal principal, RegisterStoreRequest request) {
        TagEntity tag = requireFactoryOrderedTag(request.tagId());
        AdminEntity owner = resolveStoreOwner(principal, request.registeredById());
        validateRedirectUrl(request.redirectUrl());
        if (!StringUtils.hasText(request.name()) || !StringUtils.hasText(request.cardNickname())) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }

        String categoryName = StringUtils.hasText(request.category()) ? request.category() : StoreCategory.ETC.getName();
        String storeId = makeStoreId(categoryName);
        StoreEntity store = StoreEntity.builder()
                .id(storeId)
                .category(categoryName)
                .name(request.name().trim())
                .description(request.description())
                .redirectUrl(request.redirectUrl().trim())
                .registeredById(owner.getId())
                .registeredByName(owner.getName())
                .build();
        storeRepository.save(store);
        tag.assignToStore(storeId, request.cardNickname().trim());
        return storeId;
    }

    @Transactional
    public String attachCard(AdminPrincipal principal, AttachCardRequest request) {
        TagEntity tag = requireFactoryOrderedTag(request.tagId());
        StoreEntity store = storeRepository.findById(request.storeId())
                .filter(item -> !item.isDel())
                .orElseThrow(() -> new CustomException(ErrorCode.STORE_ID_NOTFOUND));

        if (principal.role() != AdminRole.MASTER
                && !java.util.Objects.equals(store.getRegisteredById(), principal.id())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        if (!StringUtils.hasText(request.cardNickname())) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }

        tag.assignToStore(store.getId(), request.cardNickname().trim());
        return store.getId();
    }

    private Long resolveStoreOwnerIdForList(AdminPrincipal principal, Long registeredById) {
        if (principal.role() != AdminRole.MASTER) {
            return principal.id();
        }
        if (registeredById == null || registeredById.equals(principal.id())) {
            return principal.id();
        }
        return requireProxyTarget(registeredById).getId();
    }

    private AdminEntity resolveStoreOwner(AdminPrincipal principal, Long registeredById) {
        if (principal.role() != AdminRole.MASTER) {
            if (registeredById != null && !registeredById.equals(principal.id())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }
            return adminRepository.findByIdAndDelFalse(principal.id())
                    .orElseThrow(() -> new CustomException(ErrorCode.ADMIN_NOT_FOUND));
        }
        if (registeredById == null || registeredById.equals(principal.id())) {
            return adminRepository.findByIdAndDelFalse(principal.id())
                    .orElseThrow(() -> new CustomException(ErrorCode.ADMIN_NOT_FOUND));
        }
        return requireProxyTarget(registeredById);
    }

    private AdminEntity requireProxyTarget(Long registeredById) {
        AdminEntity owner = adminRepository.findByIdAndDelFalse(registeredById)
                .orElseThrow(() -> new CustomException(ErrorCode.ADMIN_NOT_FOUND));
        if (owner.getRole() != AdminRole.NORMAL || owner.isSuspended()) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        return owner;
    }

    private TagEntity requireFactoryOrderedTag(String tagId) {
        TagEntity tag = tagRepository.findActiveById(tagId)
                .orElseThrow(() -> new CustomException(ErrorCode.TAG_ID_NOTFOUND));
        if (tag.getStatus() == TagStatus.ASSIGNED) {
            throw new CustomException(ErrorCode.TAG_ALREADY_ASSIGNED);
        }
        if (tag.getStatus() != TagStatus.FACTORY_ORDERED) {
            throw new CustomException(ErrorCode.TAG_NOT_READY);
        }
        return tag;
    }

    private void validateRedirectUrl(String redirectUrl) {
        try {
            URI uri = URI.create(redirectUrl);
            String scheme = uri.getScheme();
            if (scheme == null
                    || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
            }
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
    }

    private String makeStoreId(String categoryName) {
        int count = storeRepository.storeCount() + 1;
        String categoryCode = StoreCategory.toCode(categoryName);
        String uuidPrefix = UUID.randomUUID().toString().substring(0, 5);
        return String.format("%s_%s_%05d", uuidPrefix, categoryCode, count);
    }
}

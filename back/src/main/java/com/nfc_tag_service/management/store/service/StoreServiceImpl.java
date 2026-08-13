package com.nfc_tag_service.management.store.service;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.domain.AdminRole;
import com.nfc_tag_service.domain.StoreEntity;
import com.nfc_tag_service.domain.TagExperienceType;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.global.page.PageRequestDTO;
import com.nfc_tag_service.global.page.PageResponseDTO;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.admin.repository.AdminRepository;
import com.nfc_tag_service.management.store.dto.StoreFormRequestDTO;
import com.nfc_tag_service.management.store.dto.StoreResponseDTO;
import com.nfc_tag_service.management.store.repository.StoreRepository;
import com.nfc_tag_service.management.tag.repository.TagRepository;
import com.nfc_tag_service.management.tag.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;
    private final TagService tagService;
    private final TagRepository tagRepository;
    private final AdminRepository adminRepository;

    @Override
    @Transactional
    public String storeUpdate(StoreFormRequestDTO request) {
        if (request == null || request.getId() == null || request.getId().isBlank()) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        if (!StringUtils.hasText(request.getName())) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        if (StringUtils.hasText(request.getRedirectUrl())) {
            validateRedirectUrl(request.getRedirectUrl().trim());
        }

        StoreEntity data = storeRepository.findById(request.getId())
                .filter(store -> !store.isDel())
                .orElseThrow(() -> new CustomException(ErrorCode.STORE_ID_NOTFOUND));
        data.updateStore(
                request.getCategory() != null ? request.getCategory() : data.getCategory(),
                request.getName().trim(),
                request.getDescription(),
                StringUtils.hasText(request.getRedirectUrl())
                        ? request.getRedirectUrl().trim()
                        : data.getRedirectUrl()
        );
        return data.getName();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDTO<StoreResponseDTO> storeList(PageRequestDTO request, AdminPrincipal principal) {
        Pageable pageable = PageRequest.of(
                request.getPage() - 1,
                request.getSize());

        String searchKeyword = StringUtils.hasText(request.getSearchText())
                ? request.getSearchText().trim()
                : "";

        Long registeredById = resolveListFilter(principal, request.getRegisteredById());
        TagExperienceType experienceTypeFilter = parseOptionalExperienceType(request.getExperienceType());
        boolean allExperienceTypes = experienceTypeFilter == null;

        Page<StoreResponseDTO> listData = storeRepository.storeList(
                searchKeyword,
                registeredById,
                allExperienceTypes,
                allExperienceTypes ? TagExperienceType.STANDARD : experienceTypeFilter,
                pageable);

        List<StoreResponseDTO> stores = listData.getContent();
        applyExperienceTypeSummaries(stores);

        if (principal.role() == AdminRole.MASTER) {
            Map<Long, AdminEntity> admins = loadAdminsByIds(
                    stores.stream()
                            .map(StoreResponseDTO::getRegisteredById)
                            .toList()
            );
            stores.forEach(item -> applyRegistrantDetails(item, admins.get(item.getRegisteredById())));
        }

        return PageResponseDTO.<StoreResponseDTO>withAll()
                .dtoList(stores)
                .totalCount((int) listData.getTotalElements())
                .pageRequestDTO(request)
                .build();
    }

    private void applyExperienceTypeSummaries(List<StoreResponseDTO> stores) {
        if (stores == null || stores.isEmpty()) {
            return;
        }
        List<String> storeIds = stores.stream()
                .map(StoreResponseDTO::getId)
                .filter(StringUtils::hasText)
                .toList();
        if (storeIds.isEmpty()) {
            return;
        }

        Map<String, Set<TagExperienceType>> typesByStore = new HashMap<>();
        for (Object[] row : tagRepository.findDistinctExperienceTypesByStoreIds(storeIds)) {
            String storeId = (String) row[0];
            TagExperienceType type = (TagExperienceType) row[1];
            if (!StringUtils.hasText(storeId) || type == null) {
                continue;
            }
            typesByStore.computeIfAbsent(storeId, key -> new LinkedHashSet<>()).add(type);
        }

        for (StoreResponseDTO store : stores) {
            Set<TagExperienceType> types = typesByStore.getOrDefault(store.getId(), Set.of());
            List<String> orderedNames = types.stream()
                    .sorted(Comparator.comparingInt(TagExperienceType::getRank).reversed())
                    .map(Enum::name)
                    .toList();
            store.setExperienceTypes(new ArrayList<>(orderedNames));
            TagExperienceType representative = TagExperienceType.highestOf(types);
            store.setRepresentativeExperienceType(representative != null ? representative.name() : null);
        }
    }

    private TagExperienceType parseOptionalExperienceType(String experienceType) {
        if (!StringUtils.hasText(experienceType) || "ALL".equalsIgnoreCase(experienceType.trim())) {
            return null;
        }
        try {
            return TagExperienceType.valueOf(experienceType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
    }

    @Override
    @Transactional
    public int delStore(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        int delSize = storeRepository.deleteAllByIdIn(ids);
        List<String> tagIds = tagRepository.findIdsByStoreIdIn(ids);
        if (!tagIds.isEmpty()) {
            tagService.delTag(tagIds);
        }
        return delSize;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDTO<StoreResponseDTO> selectSearch(PageRequestDTO request, AdminPrincipal principal) {
        int page = Math.max(request.getPage(), 1);
        int size = request.getSize() < 1 ? 20 : Math.min(request.getSize(), 50);
        String searchKeyword = StringUtils.hasText(request.getSearchText())
                ? request.getSearchText().trim()
                : "";
        Long registeredById = resolveListFilter(principal, request.getRegisteredById());
        if (principal.role() != AdminRole.MASTER) {
            registeredById = principal.id();
        }

        PageRequestDTO normalized = PageRequestDTO.builder()
                .page(page)
                .size(size)
                .searchText(searchKeyword)
                .registeredById(registeredById)
                .build();

        Pageable pageable = PageRequest.of(page - 1, size);
        Page<StoreResponseDTO> listData = storeRepository.searchStoresForSelect(
                searchKeyword,
                registeredById,
                pageable
        );
        enrichSelectItems(listData.getContent(), principal);

        return PageResponseDTO.<StoreResponseDTO>withAll()
                .dtoList(listData.getContent())
                .totalCount((int) listData.getTotalElements())
                .pageRequestDTO(normalized)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StoreResponseDTO selectById(String storeId, AdminPrincipal principal) {
        Long registeredById = principal.role() == AdminRole.MASTER ? null : principal.id();
        StoreResponseDTO store = storeRepository.findSelectById(storeId, registeredById)
                .orElseThrow(() -> new CustomException(ErrorCode.STORE_ID_NOTFOUND));
        enrichSelectItems(List.of(store), principal);
        return store;
    }

    private void enrichSelectItems(List<StoreResponseDTO> stores, AdminPrincipal principal) {
        if (principal.role() == AdminRole.MASTER) {
            Map<Long, AdminEntity> admins = loadAdminsByIds(
                    stores.stream().map(StoreResponseDTO::getRegisteredById).toList()
            );
            stores.forEach(item -> applyRegistrantDetails(item, admins.get(item.getRegisteredById())));
            return;
        }
        stores.forEach(item -> {
            item.setRegisteredById(null);
            item.setRegisteredByName(null);
            item.setRegisteredByLoginId(null);
            item.setRegisteredByPhone(null);
        });
    }

    private Map<Long, AdminEntity> loadAdminsByIds(List<Long> ids) {
        List<Long> distinctIds = ids.stream()
                .filter(id -> id != null)
                .distinct()
                .toList();
        if (distinctIds.isEmpty()) {
            return Map.of();
        }
        return adminRepository.findAllById(distinctIds).stream()
                .collect(Collectors.toMap(AdminEntity::getId, admin -> admin));
    }

    private void applyRegistrantDetails(StoreResponseDTO item, AdminEntity admin) {
        if (admin == null) {
            return;
        }
        item.setRegisteredByLoginId(admin.getLoginId());
        item.setRegisteredByPhone(admin.getPhone());
        if (!StringUtils.hasText(item.getRegisteredByName())) {
            item.setRegisteredByName(admin.getName());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void assertStoreReadable(String storeId, AdminPrincipal principal) {
        StoreEntity store = storeRepository.findById(storeId)
                .filter(item -> !item.isDel())
                .orElseThrow(() -> new CustomException(ErrorCode.STORE_ID_NOTFOUND));
        if (principal.role() == AdminRole.MASTER) {
            return;
        }
        if (!java.util.Objects.equals(store.getRegisteredById(), principal.id())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

    private Long resolveListFilter(AdminPrincipal principal, Long requestedFilter) {
        if (principal.role() == AdminRole.MASTER) {
            return requestedFilter;
        }
        return principal.id();
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
}

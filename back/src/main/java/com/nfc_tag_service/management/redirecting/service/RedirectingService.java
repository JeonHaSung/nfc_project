package com.nfc_tag_service.management.redirecting.service;

import com.nfc_tag_service.domain.RedirectingEntity;
import com.nfc_tag_service.domain.RedirectingTypeEntity;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.management.redirecting.RedirectingLocales;
import com.nfc_tag_service.management.redirecting.dto.RedirectingResponseDTO;
import com.nfc_tag_service.management.redirecting.dto.RedirectingTypeResponseDTO;
import com.nfc_tag_service.management.redirecting.dto.RedirectingUpsertRequest;
import com.nfc_tag_service.management.redirecting.repository.RedirectingRepository;
import com.nfc_tag_service.management.redirecting.repository.RedirectingTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RedirectingService {

    private final RedirectingRepository redirectingRepository;
    private final RedirectingTypeRepository redirectingTypeRepository;

    @Transactional(readOnly = true)
    public List<RedirectingTypeResponseDTO> listTypes() {
        List<RedirectingTypeResponseDTO> types = new ArrayList<>();
        for (RedirectingTypeEntity type : redirectingTypeRepository.findAllByOrderBySortOrderAscIdAsc()) {
            types.add(toTypeResponse(type));
        }
        return types;
    }

    @Transactional(readOnly = true)
    public List<RedirectingResponseDTO> listByTagId(String tagId) {
        Map<Long, RedirectingTypeEntity> catalog = catalogById();
        return redirectingRepository.findByTagIdAndDelFalseOrderByIdAsc(tagId).stream()
                .map(entity -> RedirectingResponseDTO.from(entity, catalog.get(entity.getRedirectingTypeId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, List<RedirectingResponseDTO>> listGroupedByTagIds(List<String> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return Map.of();
        }
        Map<String, List<RedirectingResponseDTO>> grouped = new LinkedHashMap<>();
        for (String tagId : tagIds) {
            grouped.put(tagId, new ArrayList<>());
        }
        Map<Long, RedirectingTypeEntity> catalog = catalogById();
        for (RedirectingEntity entity : redirectingRepository.findByTagIdInAndDelFalseOrderByIdAsc(tagIds)) {
            grouped.computeIfAbsent(entity.getTagId(), key -> new ArrayList<>())
                    .add(RedirectingResponseDTO.from(entity, catalog.get(entity.getRedirectingTypeId())));
        }
        return grouped;
    }

    @Transactional(readOnly = true)
    public boolean existsByTagId(String tagId) {
        return tagId != null && redirectingRepository.existsByTagIdAndDelFalse(tagId);
    }

    @Transactional(readOnly = true)
    public Optional<RedirectingEntity> findQuickByTagId(String tagId) {
        if (!StringUtils.hasText(tagId)) {
            return Optional.empty();
        }
        return redirectingRepository.findFirstByTagIdAndQuickTrueAndDelFalse(tagId);
    }

    @Transactional
    public List<RedirectingResponseDTO> replaceForTag(String tagId, List<RedirectingUpsertRequest> requests) {
        List<RedirectingUpsertRequest> items = normalize(requests);
        long quickCount = items.stream().filter(item -> Boolean.TRUE.equals(item.quick())).count();
        if (quickCount > 1) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        List<RedirectingEntity> existing = redirectingRepository.findByTagIdAndDelFalseOrderByIdAsc(tagId);
        Map<Long, RedirectingEntity> existingById = existing.stream()
                .filter(item -> item.getId() != null)
                .collect(Collectors.toMap(RedirectingEntity::getId, item -> item));

        Set<Long> keepIds = new HashSet<>();
        List<RedirectingEntity> toInsert = new ArrayList<>();
        for (RedirectingUpsertRequest request : items) {
            RedirectingTypeEntity type = requireType(request.type());
            String value = request.value().trim();
            boolean quick = Boolean.TRUE.equals(request.quick());
            if (request.id() != null) {
                RedirectingEntity entity = existingById.get(request.id());
                if (entity == null || !Objects.equals(entity.getTagId(), tagId)) {
                    throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
                }
                if (!Objects.equals(entity.getRedirectingTypeId(), type.getId())
                        && !Objects.equals(entity.getRedirectingType(), type.getCode())) {
                    throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
                }
                if (entity.isQuick() && quick && !Objects.equals(entity.getValue(), value)) {
                    throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
                }
                entity.updateValue(value);
                entity.updateQuick(quick);
                keepIds.add(entity.getId());
            } else {
                toInsert.add(RedirectingEntity.builder()
                        .tagId(tagId)
                        .redirectingType(type.getCode())
                        .redirectingTypeId(type.getId())
                        .value(value)
                        .count(0L)
                        .quick(quick)
                        .build());
            }
        }

        if (keepIds.isEmpty()) {
            redirectingRepository.deleteByTagId(tagId);
        } else {
            redirectingRepository.deleteByTagIdAndIdNotIn(tagId, keepIds);
        }
        redirectingRepository.flush();
        if (!toInsert.isEmpty()) {
            redirectingRepository.saveAll(toInsert);
        }
        return listByTagId(tagId);
    }

    @Transactional
    public RedirectingEntity require(Long redirectingId) {
        if (redirectingId == null) {
            throw new CustomException(ErrorCode.TAG_ID_NOTFOUND);
        }
        return redirectingRepository.findByIdAndDelFalse(redirectingId)
                .orElseThrow(() -> new CustomException(ErrorCode.TAG_ID_NOTFOUND));
    }

    @Transactional
    public void incrementCount(Long redirectingId) {
        if (redirectingRepository.incrementCount(redirectingId) != 1) {
            throw new CustomException(ErrorCode.TAG_ID_NOTFOUND);
        }
    }

    @Transactional
    public void softDeleteByTagIds(Collection<String> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return;
        }
        redirectingRepository.softDeleteByTagIdIn(tagIds);
    }

    @Transactional
    public void restoreByTagId(String tagId) {
        if (!StringUtils.hasText(tagId)) {
            return;
        }
        redirectingRepository.restoreByTagId(tagId);
    }

    public boolean isAllowedRedirectUrl(String redirectUrl) {
        if (!StringUtils.hasText(redirectUrl) || redirectUrl.length() > 2048) {
            return false;
        }
        for (int i = 0; i < redirectUrl.length(); i++) {
            char ch = redirectUrl.charAt(i);
            if (Character.isWhitespace(ch) || ch == '\\') {
                return false;
            }
        }
        try {
            URI uri = URI.create(redirectUrl.trim());
            String scheme = uri.getScheme();
            if (scheme == null
                    || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                return false;
            }
            if (uri.getRawUserInfo() != null) {
                return false;
            }
            return StringUtils.hasText(uri.getHost());
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private List<RedirectingUpsertRequest> normalize(List<RedirectingUpsertRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        Set<Long> seen = new HashSet<>();
        List<RedirectingUpsertRequest> items = new ArrayList<>();
        for (RedirectingUpsertRequest request : requests) {
            if (request == null || !StringUtils.hasText(request.type()) || !StringUtils.hasText(request.value())) {
                throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
            }
            RedirectingTypeEntity type = requireType(request.type());
            if (!seen.add(type.getId())) {
                throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
            }
            validateRedirectUrl(request.value().trim());
            items.add(request);
        }
        return items;
    }

    private RedirectingTypeEntity requireType(String raw) {
        if (!StringUtils.hasText(raw)) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        String key = raw.trim();
        if (key.chars().allMatch(Character::isDigit)) {
            try {
                return redirectingTypeRepository.findById(Long.parseLong(key))
                        .orElseThrow(() -> new CustomException(ErrorCode.INVALID_TAG_INPUT));
            } catch (NumberFormatException e) {
                throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
            }
        }
        return redirectingTypeRepository.findByCode(key.toUpperCase())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_TAG_INPUT));
    }

    private Map<Long, RedirectingTypeEntity> catalogById() {
        Map<Long, RedirectingTypeEntity> catalog = new LinkedHashMap<>();
        for (RedirectingTypeEntity type : redirectingTypeRepository.findAllByOrderBySortOrderAscIdAsc()) {
            catalog.put(type.getId(), type);
        }
        return catalog;
    }

    private RedirectingTypeResponseDTO toTypeResponse(RedirectingTypeEntity type) {
        Map<String, String> labels = RedirectingLocales.copy(type.getLabels());
        return new RedirectingTypeResponseDTO(
                String.valueOf(type.getId()),
                type.getId(),
                RedirectingLocales.pick(labels, RedirectingLocales.KO),
                type.getColor(),
                labels
        );
    }

    private void validateRedirectUrl(String redirectUrl) {
        if (!isAllowedRedirectUrl(redirectUrl)) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
    }
}

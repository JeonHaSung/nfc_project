package com.nfc_tag_service.management.redirecting.service;

import com.nfc_tag_service.domain.RedirectingEntity;
import com.nfc_tag_service.domain.RedirectingType;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.management.redirecting.dto.RedirectingResponseDTO;
import com.nfc_tag_service.management.redirecting.dto.RedirectingTypeResponseDTO;
import com.nfc_tag_service.management.redirecting.dto.RedirectingUpsertRequest;
import com.nfc_tag_service.management.redirecting.repository.RedirectingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RedirectingService {

    private final RedirectingRepository redirectingRepository;

    @Transactional(readOnly = true)
    public List<RedirectingTypeResponseDTO> listTypes() {
        List<RedirectingTypeResponseDTO> types = new ArrayList<>();
        for (RedirectingType type : RedirectingType.values()) {
            types.add(RedirectingTypeResponseDTO.from(type));
        }
        return types;
    }

    @Transactional(readOnly = true)
    public List<RedirectingResponseDTO> listByTagId(String tagId) {
        return redirectingRepository.findByTagIdAndDelFalseOrderByIdAsc(tagId).stream()
                .map(RedirectingResponseDTO::from)
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
        for (RedirectingEntity entity : redirectingRepository.findByTagIdInAndDelFalseOrderByIdAsc(tagIds)) {
            grouped.computeIfAbsent(entity.getTagId(), key -> new ArrayList<>())
                    .add(RedirectingResponseDTO.from(entity));
        }
        return grouped;
    }

    @Transactional(readOnly = true)
    public boolean existsByTagId(String tagId) {
        return tagId != null && redirectingRepository.existsByTagIdAndDelFalse(tagId);
    }

    @Transactional
    public List<RedirectingResponseDTO> replaceForTag(String tagId, List<RedirectingUpsertRequest> requests) {
        List<RedirectingUpsertRequest> items = normalize(requests);
        List<RedirectingEntity> existing = redirectingRepository.findByTagIdAndDelFalseOrderByIdAsc(tagId);
        Map<Long, RedirectingEntity> existingById = existing.stream()
                .filter(item -> item.getId() != null)
                .collect(Collectors.toMap(RedirectingEntity::getId, item -> item));

        Set<Long> keepIds = new HashSet<>();
        List<RedirectingEntity> toInsert = new ArrayList<>();
        for (RedirectingUpsertRequest request : items) {
            RedirectingType type = parseType(request.type());
            String value = request.value().trim();
            if (request.id() != null) {
                RedirectingEntity entity = existingById.get(request.id());
                if (entity == null || !Objects.equals(entity.getTagId(), tagId)) {
                    throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
                }
                if (entity.getRedirectingType() != type) {
                    throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
                }
                entity.updateValue(value);
                keepIds.add(entity.getId());
            } else {
                toInsert.add(RedirectingEntity.builder()
                        .tagId(tagId)
                        .redirectingType(type)
                        .value(value)
                        .count(0L)
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

    private List<RedirectingUpsertRequest> normalize(List<RedirectingUpsertRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        EnumSet<RedirectingType> seen = EnumSet.noneOf(RedirectingType.class);
        List<RedirectingUpsertRequest> items = new ArrayList<>();
        for (RedirectingUpsertRequest request : requests) {
            if (request == null || !StringUtils.hasText(request.type()) || !StringUtils.hasText(request.value())) {
                throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
            }
            RedirectingType type = parseType(request.type());
            if (!seen.add(type)) {
                throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
            }
            validateRedirectUrl(request.value().trim());
            items.add(request);
        }
        return items;
    }

    private RedirectingType parseType(String raw) {
        try {
            return RedirectingType.valueOf(raw.trim().toUpperCase());
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
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

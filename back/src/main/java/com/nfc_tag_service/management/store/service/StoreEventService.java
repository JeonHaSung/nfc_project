package com.nfc_tag_service.management.store.service;

import com.nfc_tag_service.domain.StoreEventEntity;
import com.nfc_tag_service.domain.StoreEventItemEntity;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.store.dto.StoreEventDtos.EventRequest;
import com.nfc_tag_service.management.store.dto.StoreEventDtos.EventResponse;
import com.nfc_tag_service.management.store.dto.StoreEventDtos.ItemRequest;
import com.nfc_tag_service.management.store.dto.StoreEventDtos.ItemResponse;
import com.nfc_tag_service.management.store.dto.StoreEventDtos.ToggleRequest;
import com.nfc_tag_service.management.store.repository.StoreEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StoreEventService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");
    private static final int MAX_NAME = 80;
    private static final int MAX_DESCRIPTION = 1000;
    private static final int MAX_EVENTS_PER_STORE = 100;
    private static final int MAX_ITEMS = 50;
    private static final int MAX_ITEM_NAME = 120;
    private static final int MAX_ITEM_FIELD = 50;
    private static final int MAX_IMAGE_URL = 500;

    private final StoreEventRepository eventRepository;
    private final StoreService storeService;

    @Transactional
    public List<EventResponse> list(String storeId, AdminPrincipal principal) {
        storeService.assertStoreReadable(storeId, principal);
        expireOverdue();
        return eventRepository.findByStoreIdOrdered(storeId.trim()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public EventResponse create(String storeId, EventRequest request, AdminPrincipal principal) {
        storeService.assertStoreReadable(storeId, principal);
        String id = storeId.trim();
        if (eventRepository.countByStoreId(id) >= MAX_EVENTS_PER_STORE) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        ParsedEvent parsed = parse(request, false);
        StoreEventEntity entity = StoreEventEntity.builder()
                .storeId(id)
                .name(parsed.name())
                .nameEn(parsed.nameEn())
                .nameJa(parsed.nameJa())
                .nameZh(parsed.nameZh())
                .nameFr(parsed.nameFr())
                .description(parsed.description())
                .descriptionEn(parsed.descriptionEn())
                .descriptionJa(parsed.descriptionJa())
                .descriptionZh(parsed.descriptionZh())
                .descriptionFr(parsed.descriptionFr())
                .enabled(parsed.enabled())
                .noTimeLimit(parsed.noTimeLimit())
                .showOnReviewRelay(parsed.showOnReviewRelay())
                .startAt(parsed.startAt())
                .endAt(parsed.endAt())
                .build();
        entity.replaceItems(parsed.items() != null ? parsed.items() : List.of());
        return toResponse(eventRepository.save(entity));
    }

    @Transactional
    public EventResponse update(String storeId, Long eventId, EventRequest request, AdminPrincipal principal) {
        storeService.assertStoreReadable(storeId, principal);
        StoreEventEntity entity = eventRepository.findByIdAndStoreId(eventId, storeId.trim())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_STORE_INPUT));
        ParsedEvent parsed = parse(request, false);
        entity.update(
                parsed.name(),
                parsed.nameEn(),
                parsed.nameJa(),
                parsed.nameZh(),
                parsed.nameFr(),
                parsed.description(),
                parsed.descriptionEn(),
                parsed.descriptionJa(),
                parsed.descriptionZh(),
                parsed.descriptionFr(),
                parsed.enabled(),
                parsed.noTimeLimit(),
                parsed.showOnReviewRelay(),
                parsed.startAt(),
                parsed.endAt()
        );
        // items가 요청에 없으면(null) 기존 품목 유지
        if (parsed.items() != null) {
            entity.replaceItems(parsed.items());
        }
        return toResponse(entity);
    }

    @Transactional
    public EventResponse toggle(String storeId, Long eventId, ToggleRequest request, AdminPrincipal principal) {
        storeService.assertStoreReadable(storeId, principal);
        StoreEventEntity entity = eventRepository.findByIdAndStoreId(eventId, storeId.trim())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_STORE_INPUT));
        boolean next = request != null && request.getEnabled() != null
                ? request.getEnabled()
                : !entity.isEnabled();
        if (next && isExpired(entity, now())) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        entity.setEnabled(next);
        return toResponse(entity);
    }

    @Transactional
    public int delete(String storeId, List<Long> ids, AdminPrincipal principal) {
        storeService.assertStoreReadable(storeId, principal);
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        String id = storeId.trim();
        eventRepository.deleteItemsByStoreIdAndEventIdIn(id, ids);
        return eventRepository.deleteByStoreIdAndIdIn(id, ids);
    }

    @Transactional
    public int expireOverdue() {
        return eventRepository.disableExpired(now());
    }

    @Transactional(readOnly = true)
    public Set<String> findLiveStoreIds(Collection<String> storeIds) {
        if (storeIds == null || storeIds.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(eventRepository.findStoreIdsWithLiveEvent(storeIds, now()));
    }

    private ParsedEvent parse(EventRequest request, boolean requirePeriod) {
        // 한국어 이름(name) 필수 — 다른 언어만 있으면 거부
        if (request == null || !StringUtils.hasText(request.getName())) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        String name = limitName(request.getName().trim(), true);
        String nameEn = limitName(blankToNull(request.getNameEn()), false);
        String nameJa = limitName(blankToNull(request.getNameJa()), false);
        String nameZh = limitName(blankToNull(request.getNameZh()), false);
        String nameFr = limitName(blankToNull(request.getNameFr()), false);
        String description = limitDescription(blankToNull(request.getDescription()));
        String descriptionEn = limitDescription(blankToNull(request.getDescriptionEn()));
        String descriptionJa = limitDescription(blankToNull(request.getDescriptionJa()));
        String descriptionZh = limitDescription(blankToNull(request.getDescriptionZh()));
        String descriptionFr = limitDescription(blankToNull(request.getDescriptionFr()));

        boolean noTimeLimit;
        if (requirePeriod) {
            noTimeLimit = false;
        } else if (request.getNoTimeLimit() != null) {
            noTimeLimit = Boolean.TRUE.equals(request.getNoTimeLimit());
        } else {
            // 플래그 생략 시 시작·종료가 있으면 기간 이벤트로 간주
            noTimeLimit = request.getStartAt() == null && request.getEndAt() == null;
        }
        LocalDateTime startAt = null;
        LocalDateTime endAt = null;
        if (!noTimeLimit) {
            startAt = request.getStartAt();
            endAt = request.getEndAt();
            if (startAt == null || endAt == null || !endAt.isAfter(startAt)) {
                throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
            }
        }

        boolean enabled = Boolean.TRUE.equals(request.getEnabled());
        if (enabled && !noTimeLimit && endAt != null && endAt.isBefore(now())) {
            enabled = false;
        }
        boolean showOnReviewRelay = Boolean.TRUE.equals(request.getShowOnReviewRelay());

        List<StoreEventItemEntity> items = null;
        if (request.getItems() != null) {
            items = new ArrayList<>();
            if (request.getItems().size() > MAX_ITEMS) {
                throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
            }
            for (ItemRequest item : request.getItems()) {
                if (item == null) {
                    continue;
                }
                String itemName = blankToNull(item.getName());
                String price = blankToNull(item.getPrice());
                String quantity = blankToNull(item.getQuantity());
                String imageUrl = blankToNull(item.getImageUrl());
                if (itemName == null && price == null && quantity == null && imageUrl == null) {
                    continue;
                }
                if (itemName == null) {
                    throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
                }
                if (itemName.length() > MAX_ITEM_NAME
                        || (price != null && price.length() > MAX_ITEM_FIELD)
                        || (quantity != null && quantity.length() > MAX_ITEM_FIELD)
                        || (imageUrl != null && !isValidImageUrl(imageUrl))) {
                    throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
                }
                items.add(StoreEventItemEntity.builder()
                        .name(itemName)
                        .price(price)
                        .quantity(quantity)
                        .imageUrl(imageUrl)
                        .build());
            }
        }
        return new ParsedEvent(
                name,
                nameEn,
                nameJa,
                nameZh,
                nameFr,
                description,
                descriptionEn,
                descriptionJa,
                descriptionZh,
                descriptionFr,
                enabled,
                noTimeLimit,
                showOnReviewRelay,
                startAt,
                endAt,
                items
        );
    }

    private EventResponse toResponse(StoreEventEntity entity) {
        LocalDateTime now = now();
        boolean expired = isExpired(entity, now);
        boolean live = entity.isEnabled()
                && !expired
                && (entity.isNoTimeLimit()
                || (entity.getStartAt() != null
                && entity.getEndAt() != null
                && !entity.getStartAt().isAfter(now)
                && !entity.getEndAt().isBefore(now)));
        return EventResponse.builder()
                .id(entity.getId())
                .storeId(entity.getStoreId())
                .name(entity.getName())
                .nameEn(entity.getNameEn())
                .nameJa(entity.getNameJa())
                .nameZh(entity.getNameZh())
                .nameFr(entity.getNameFr())
                .description(entity.getDescription())
                .descriptionEn(entity.getDescriptionEn())
                .descriptionJa(entity.getDescriptionJa())
                .descriptionZh(entity.getDescriptionZh())
                .descriptionFr(entity.getDescriptionFr())
                .enabled(entity.isEnabled())
                .noTimeLimit(entity.isNoTimeLimit())
                .showOnReviewRelay(entity.isShowOnReviewRelay())
                .startAt(entity.getStartAt())
                .endAt(entity.getEndAt())
                .expired(expired)
                .live(live)
                .items(entity.getItems() == null ? List.of() : entity.getItems().stream()
                        .map(item -> ItemResponse.builder()
                                .id(item.getId())
                                .name(item.getName())
                                .price(item.getPrice())
                                .quantity(item.getQuantity())
                                .imageUrl(item.getImageUrl())
                                .build())
                        .toList())
                .build();
    }

    private String limitName(String value, boolean required) {
        if (value == null) {
            if (required) {
                throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
            }
            return null;
        }
        if (value.length() > MAX_NAME) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        return value;
    }

    private String limitDescription(String value) {
        if (value != null && value.length() > MAX_DESCRIPTION) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        return value;
    }

    private static boolean isValidImageUrl(String imageUrl) {
        if (imageUrl.length() > MAX_IMAGE_URL) {
            return false;
        }
        String lower = imageUrl.toLowerCase();
        return lower.startsWith("https://") || lower.startsWith("http://");
    }

    private static boolean isExpired(StoreEventEntity entity, LocalDateTime now) {
        return !entity.isNoTimeLimit()
                && entity.getEndAt() != null
                && entity.getEndAt().isBefore(now);
    }

    private static LocalDateTime now() {
        return LocalDateTime.now(SERVICE_ZONE);
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record ParsedEvent(
            String name,
            String nameEn,
            String nameJa,
            String nameZh,
            String nameFr,
            String description,
            String descriptionEn,
            String descriptionJa,
            String descriptionZh,
            String descriptionFr,
            boolean enabled,
            boolean noTimeLimit,
            boolean showOnReviewRelay,
            LocalDateTime startAt,
            LocalDateTime endAt,
            List<StoreEventItemEntity> items
    ) {
    }
}

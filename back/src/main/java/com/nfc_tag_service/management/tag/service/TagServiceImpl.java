package com.nfc_tag_service.management.tag.service;

import com.nfc_tag_service.domain.AdminRole;
import com.nfc_tag_service.domain.StoreEntity;
import com.nfc_tag_service.domain.TagEntity;
import com.nfc_tag_service.domain.TagExperienceType;
import com.nfc_tag_service.domain.TagExcelOrderCounterEntity;
import com.nfc_tag_service.domain.TagExcelOrderEntity;
import com.nfc_tag_service.domain.TagStatus;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.global.storage.SupabaseStorageService;
import com.nfc_tag_service.global.type.TagCategory;
import com.nfc_tag_service.management.redirecting.service.RedirectingService;
import com.nfc_tag_service.management.store.repository.StoreRepository;
import com.nfc_tag_service.management.tag.dto.FactoryBatchProgressDTO;
import com.nfc_tag_service.management.tag.dto.TagChoicesResponse;
import com.nfc_tag_service.management.tag.dto.TagExcelOrderResponseDTO;
import com.nfc_tag_service.management.tag.dto.TagExcelRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagGenerateRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagNicknameUpdateRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagOpenResult;
import com.nfc_tag_service.management.tag.dto.TagOpenView;
import com.nfc_tag_service.management.tag.dto.TagResponseDTO;
import com.nfc_tag_service.management.tag.dto.TagUpdateResponseDTO;
import com.nfc_tag_service.management.tag.repository.TagExcelOrderCounterRepository;
import com.nfc_tag_service.management.tag.repository.TagExcelOrderRepository;
import com.nfc_tag_service.management.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final StoreRepository storeRepository;
    private final TagRepository tagRepository;
    private final TagExcelOrderRepository tagExcelOrderRepository;
    private final TagExcelOrderCounterRepository tagExcelOrderCounterRepository;
    private final SupabaseStorageService supabaseStorageService;
    private final RedirectingService redirectingService;

    private static final int MAX_EXCEL_ORDERS = 10;
    private static final int MAX_TAG_ID_ATTEMPTS = 100;
    private static final String GLOBAL_COUNTER_ID = "GLOBAL";
    private static final DateTimeFormatter TAG_ID_TIMESTAMP =
            DateTimeFormatter.ofPattern("yyyyMMddssmm");

    @Value("${app.server-domain}")
    private String serverDomain;

    /** 온보딩/상태 SPA 리다이렉트 기준. local은 Vite(3000), selfhost/prod는 서버 도메인. */
    @Value("${app.spa-origin:${app.server-domain}}")
    private String spaOrigin;

    @Override
    @Transactional
    public int generateTags(TagGenerateRequestDTO request) {
        if (request == null) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        String category = normalizeCategory(request.getType());
        TagExperienceType experienceType = parseExperienceType(request.getExperienceType());
        int count = request.getCount();
        if (count < 1 || count > 500) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }

        List<TagEntity> tags = new ArrayList<>(count);
        Set<String> generatedIds = new HashSet<>(count);
        for (int i = 0; i < count; i++) {
            String tagId = makeFactoryTagId(experienceType, generatedIds);
            tags.add(TagEntity.builder()
                    .id(tagId)
                    .category(category)
                    .tagUrl(makeTagUrl(tagId))
                    .status(TagStatus.CREATED)
                    .experienceType(experienceType)
                    .hitCount(0L)
                    .build());
        }
        tagRepository.saveAll(tags);
        return tags.size();
    }

    @Override
    @Transactional
    public List<TagResponseDTO> factoryList(String tagType, String status) {
        String category = factoryCategoryFilter(tagType);
        TagStatus tagStatus = parseStatus(status);
        if (tagStatus != TagStatus.CREATED && tagStatus != TagStatus.FACTORY_ORDERED) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        List<TagResponseDTO> list = tagRepository.findFactoryList(category, tagStatus);
        if (tagStatus == TagStatus.FACTORY_ORDERED) {
            Map<Long, Long> remainingBySeq = countBySeq(TagStatus.FACTORY_ORDERED);
            Map<Long, Integer> registeredBySeq = registeredCountBySeq();
            list.forEach(tag -> {
                Long seq = tag.getFactoryOrderSeq();
                boolean recycled = seq != null && seq == TagEntity.RECYCLE_FACTORY_SEQ;
                long remaining = seq == null ? 0L : remainingBySeq.getOrDefault(seq, 0L);
                int registered = seq == null ? 0 : registeredBySeq.getOrDefault(seq, 0);
                tag.setRegistrationInProgress(recycled || (registered > 0 && remaining > 0));
            });
        }
        return list;
    }

    @Override
    @Transactional
    public List<FactoryBatchProgressDTO> factoryBatchProgress(String tagType) {
        Map<Long, Long> remainingCounts = countBySeq(TagStatus.FACTORY_ORDERED);
        Map<Long, Integer> registeredBySeq = registeredCountBySeq();
        Map<Long, Integer> initialCounts = new HashMap<>();
        for (TagExcelOrderEntity order : listExcelOrders()) {
            if (order.getOrderSeq() == null) {
                continue;
            }
            initialCounts.putIfAbsent(order.getOrderSeq(), order.getTagCount() == null ? 0 : order.getTagCount());
        }

        Set<Long> seqs = new HashSet<>();
        seqs.addAll(remainingCounts.keySet());
        seqs.addAll(registeredBySeq.keySet());
        seqs.addAll(initialCounts.keySet());

        return seqs.stream()
                .sorted()
                .map(seq -> {
                    long remaining = remainingCounts.getOrDefault(seq, 0L);
                    int registered = registeredBySeq.getOrDefault(seq, 0);
                    int initial = initialCounts.getOrDefault(seq, (int) remaining + registered);
                    boolean recycled = seq == TagEntity.RECYCLE_FACTORY_SEQ;
                    boolean inProgress = recycled || (registered > 0 && remaining > 0);
                    return new FactoryBatchProgressDTO(
                            seq,
                            remaining,
                            registered,
                            initial,
                            inProgress
                    );
                })
                .filter(progress -> progress.remainingCount() > 0 || progress.inProgress())
                .toList();
    }

    private Map<Long, Long> countBySeq(TagStatus status) {
        Map<Long, Long> result = new HashMap<>();
        for (Object[] row : tagRepository.countGroupedByFactoryOrderSeqAllCategories(status)) {
            if (row[0] == null) {
                continue;
            }
            result.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return result;
    }

    private Map<Long, Integer> registeredCountBySeq() {
        Map<Long, Integer> result = new HashMap<>();
        Map<Long, Long> liveAssigned = countBySeq(TagStatus.ASSIGNED);
        for (TagExcelOrderEntity order : tagExcelOrderRepository.findAll()) {
            if (order.getOrderSeq() == null) {
                continue;
            }
            long seq = order.getOrderSeq();
            int registered = syncRegisteredCount(order, liveAssigned.getOrDefault(seq, 0L));
            result.merge(seq, registered, Math::max);
        }
        return result;
    }

    private int syncRegisteredCount(TagExcelOrderEntity order, long liveAssigned) {
        if (order.registeredCount() == 0 && liveAssigned > 0) {
            order.raiseRegisteredTo((int) liveAssigned);
        }
        return order.registeredCount();
    }

    @Override
    @Transactional
    public byte[] issueExcel(TagExcelRequestDTO request) {
        if (request == null || request.tagIds() == null || request.tagIds().isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        if (!supabaseStorageService.isConfigured()) {
            throw new CustomException(ErrorCode.STORAGE_UPLOAD_FAILED);
        }

        java.util.LinkedHashSet<String> requestedIds = new java.util.LinkedHashSet<>(request.tagIds());
        List<TagEntity> tags = tagRepository.findAllByIdInAndStatus(requestedIds, TagStatus.CREATED);
        if (tags.isEmpty() || tags.size() != requestedIds.size()) {
            throw new CustomException(ErrorCode.TAG_INVALID_STATUS);
        }

        String category = tags.getFirst().getCategory();
        if (category == null || category.isBlank()) {
            category = TagCategory.DEFAULT;
        }

        byte[] excelBytes = buildExcel(tags);
        long orderSeq = nextOrderSeq();
        String displayName = orderSeq + "차 태그카드 URL 발주";
        String fileName = displayName + ".xlsx";
        String storagePath = "orders/" + category + "/" + orderSeq + "-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 6)
                + ".xlsx";

        String storageUrl = supabaseStorageService.upload(
                storagePath,
                excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        tagExcelOrderRepository.save(TagExcelOrderEntity.builder()
                .orderSeq(orderSeq)
                .fileName(fileName)
                .storagePath(storagePath)
                .storageUrl(storageUrl)
                .category(category)
                .tagCount(tags.size())
                .build());

        trimExcelOrdersToLimit();

        for (TagEntity tag : tags) {
            tag.markFactoryOrdered(orderSeq);
        }
        return excelBytes;
    }

    @Override
    @Transactional
    public List<TagExcelOrderResponseDTO> recentExcelOrders(String tagType) {
        Map<Long, Long> remainingCounts = countBySeq(TagStatus.FACTORY_ORDERED);
        Map<Long, Long> liveAssigned = countBySeq(TagStatus.ASSIGNED);
        return listExcelOrders().stream()
                .map(order -> {
                    long seq = order.getOrderSeq() == null ? 0L : order.getOrderSeq();
                    long remaining = remainingCounts.getOrDefault(seq, 0L);
                    int registered = syncRegisteredCount(order, liveAssigned.getOrDefault(seq, 0L));
                    return toExcelOrderDto(order, remaining, registered);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadExcelOrder(Long orderId) {
        TagExcelOrderEntity order = tagExcelOrderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException(ErrorCode.EXCEL_ORDER_NOT_FOUND));
        long seq = order.getOrderSeq() == null ? 0L : order.getOrderSeq();
        long remaining = countBySeq(TagStatus.FACTORY_ORDERED).getOrDefault(seq, 0L);
        long liveAssigned = countBySeq(TagStatus.ASSIGNED).getOrDefault(seq, 0L);
        int registered = Math.max(order.registeredCount(), (int) liveAssigned);
        int tagCount = order.getTagCount() == null ? 0 : order.getTagCount();
        if ("DISCARDED".equals(resolveExcelOrderStatus(tagCount, remaining, registered))) {
            throw new CustomException(ErrorCode.EXCEL_ORDER_DISCARDED);
        }
        return supabaseStorageService.download(order.getStoragePath());
    }

    @Override
    @Transactional(readOnly = true)
    public String excelOrderFileName(Long orderId) {
        return tagExcelOrderRepository.findById(orderId)
                .map(TagExcelOrderEntity::getFileName)
                .orElseThrow(() -> new CustomException(ErrorCode.EXCEL_ORDER_NOT_FOUND));
    }

    @Override
    @Transactional
    public void deleteDiscardedExcelOrder(Long orderId) {
        TagExcelOrderEntity order = tagExcelOrderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException(ErrorCode.EXCEL_ORDER_NOT_FOUND));
        long seq = order.getOrderSeq() == null ? 0L : order.getOrderSeq();
        long remaining = countBySeq(TagStatus.FACTORY_ORDERED).getOrDefault(seq, 0L);
        int registered = order.registeredCount();
        int tagCount = order.getTagCount() == null ? 0 : order.getTagCount();
        if (!"DISCARDED".equals(resolveExcelOrderStatus(tagCount, remaining, registered))) {
            throw new CustomException(ErrorCode.EXCEL_ORDER_NOT_DISCARDED);
        }
        tagExcelOrderRepository.delete(order);
        tagExcelOrderRepository.flush();
        deleteExcelStorageQuietly(order);
        syncGlobalCounterToFloor();
    }

    @Override
    @Transactional
    public void recordExcelRegistration(TagEntity tag) {
        if (tag == null
                || tag.getFactoryOrderSeq() == null
                || tag.getFactoryOrderSeq() == TagEntity.RECYCLE_FACTORY_SEQ) {
            return;
        }
        TagExcelOrderEntity order = tagExcelOrderRepository
                .findFirstByOrderSeqOrderByIdAsc(tag.getFactoryOrderSeq())
                .orElse(null);
        if (order == null) {
            return;
        }
        order.incrementRegistered();
    }

    private long nextOrderSeq() {
        TagExcelOrderCounterEntity counter = tagExcelOrderCounterRepository
                .findById(GLOBAL_COUNTER_ID)
                .orElseGet(() -> tagExcelOrderCounterRepository.save(TagExcelOrderCounterEntity.initial(GLOBAL_COUNTER_ID)));
        counter.syncNextSeq(nextSeqFloor());
        long allocated = counter.allocateNext();
        tagExcelOrderCounterRepository.save(counter);
        return allocated;
    }

    private void syncGlobalCounterToFloor() {
        TagExcelOrderCounterEntity counter = tagExcelOrderCounterRepository
                .findById(GLOBAL_COUNTER_ID)
                .orElse(null);
        if (counter == null) {
            return;
        }
        counter.syncNextSeq(nextSeqFloor());
        tagExcelOrderCounterRepository.save(counter);
    }

    private long nextSeqFloor() {
        long maxSeq = 0L;
        Long maxOrderSeq = tagExcelOrderRepository.findMaxOrderSeq();
        if (maxOrderSeq != null) {
            maxSeq = Math.max(maxSeq, maxOrderSeq);
        }
        Long maxTagSeq = tagRepository.findMaxFactoryOrderSeq();
        if (maxTagSeq != null) {
            maxSeq = Math.max(maxSeq, maxTagSeq);
        }
        return maxSeq + 1;
    }

    private void trimExcelOrdersToLimit() {
        List<TagExcelOrderEntity> all = tagExcelOrderRepository.findAllByOrderByCreatedAtAscIdAsc();
        int overflow = all.size() - MAX_EXCEL_ORDERS;
        if (overflow <= 0) {
            return;
        }
        Map<Long, Long> remainingCounts = countBySeq(TagStatus.FACTORY_ORDERED);
        Map<Long, Long> liveAssigned = countBySeq(TagStatus.ASSIGNED);
        List<TagExcelOrderEntity> removable = new ArrayList<>();
        for (TagExcelOrderEntity order : all) {
            if (removable.size() >= overflow) {
                break;
            }
            long seq = order.getOrderSeq() == null ? 0L : order.getOrderSeq();
            long remaining = remainingCounts.getOrDefault(seq, 0L);
            int registered = syncRegisteredCount(order, liveAssigned.getOrDefault(seq, 0L));
            int tagCount = order.getTagCount() == null ? 0 : order.getTagCount();
            String status = resolveExcelOrderStatus(tagCount, remaining, registered);
            if ("COMPLETED".equals(status) || "DISCARDED".equals(status)) {
                removable.add(order);
            }
        }
        for (TagExcelOrderEntity order : removable) {
            tagExcelOrderRepository.delete(order);
            deleteExcelStorageQuietly(order);
        }
        if (!removable.isEmpty()) {
            tagExcelOrderRepository.flush();
            syncGlobalCounterToFloor();
        }
    }

    private void deleteExcelStorageQuietly(TagExcelOrderEntity order) {
        try {
            supabaseStorageService.delete(order.getStoragePath(), order.getStorageUrl());
        } catch (RuntimeException ignored) {
            // 발주 DB 행 삭제가 우선. 저장소 파일은 남아도 된다.
        }
    }

    private TagExcelOrderResponseDTO toExcelOrderDto(
            TagExcelOrderEntity order,
            long remainingCount,
            long assignedCount
    ) {
        int tagCount = order.getTagCount() == null ? 0 : order.getTagCount();
        long orderSeq = order.getOrderSeq() == null ? 0L : order.getOrderSeq();
        String status = resolveExcelOrderStatus(tagCount, remainingCount, assignedCount);
        return new TagExcelOrderResponseDTO(
                order.getId(),
                orderSeq,
                order.getFileName(),
                order.getStorageUrl(),
                order.getCategory(),
                tagCount,
                order.getCreatedAt() != null
                        ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                        : null,
                remainingCount,
                assignedCount,
                status,
                excelOrderStatusLabel(status)
        );
    }

    /**
     * WAITING: 등록 0, 잔여 > 0
     * IN_PROGRESS: 등록 > 0, 잔여 > 0
     * COMPLETED: 잔여 0, 등록 > 0
     * DISCARDED: 초기 > 0, 등록 0, 잔여 0
     * NEEDS_EDIT: 공장발주 잔여를 삭제해서 초기보다 살아있는 수가 적음
     */
    private String resolveExcelOrderStatus(int initialCount, long remainingCount, long assignedCount) {
        if (remainingCount == 0 && assignedCount > 0) {
            return "COMPLETED";
        }
        if (remainingCount == 0 && assignedCount == 0 && initialCount > 0) {
            return "DISCARDED";
        }
        if (assignedCount > 0 && remainingCount > 0) {
            return "IN_PROGRESS";
        }
        long aliveCount = remainingCount + assignedCount;
        if (aliveCount < initialCount) {
            return "NEEDS_EDIT";
        }
        return "WAITING";
    }

    private String excelOrderStatusLabel(String status) {
        return switch (status) {
            case "COMPLETED" -> "완료됨";
            case "IN_PROGRESS" -> "태그등록 진행중";
            case "NEEDS_EDIT" -> "수정필요";
            case "DISCARDED" -> "폐기된 발주";
            default -> "발주대기";
        };
    }

    @Override
    @Transactional
    public TagUpdateResponseDTO tagUpdate(TagNicknameUpdateRequestDTO request, AdminPrincipal principal) {
        if (request == null || request.getTagId() == null || request.getTagId().isBlank()) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        if (request.getNickname() == null || request.getNickname().isBlank()) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        String nickname = request.getNickname().trim();
        if (nickname.length() > 30) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }

        TagEntity data = tagRepository.findActiveById(request.getTagId())
                .orElseThrow(() -> new CustomException(ErrorCode.TAG_ID_NOTFOUND));
        assertTagNicknameEditable(data, principal);

        boolean nicknameChanged = !Objects.equals(data.getNickname(), nickname);
        if (nicknameChanged) {
            data.updateNickname(nickname);
        }

        boolean redirectingsChanged = false;
        if (request.getRedirectings() != null) {
            if (principal.role() != AdminRole.MASTER) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }
            var before = redirectingService.listByTagId(data.getId());
            var after = redirectingService.replaceForTag(data.getId(), request.getRedirectings());
            redirectingsChanged = !sameRedirectings(before, after);
        }

        if (!nicknameChanged && !redirectingsChanged) {
            throw new CustomException(ErrorCode.TAG_UPDATE_ERROR);
        }

        return TagUpdateResponseDTO.builder()
                .isNicknameChanged(nicknameChanged)
                .isUseTagChanged(redirectingsChanged)
                .build();
    }

    private void assertTagNicknameEditable(TagEntity tag, AdminPrincipal principal) {
        if (principal == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        if (tag.getStatus() != TagStatus.ASSIGNED || tag.getStoreId() == null || tag.getStoreId().isBlank()) {
            throw new CustomException(ErrorCode.TAG_INVALID_STATUS);
        }
        if (principal.role() == AdminRole.MASTER) {
            return;
        }
        StoreEntity store = storeRepository.findById(tag.getStoreId())
                .filter(item -> !item.isDel())
                .orElseThrow(() -> new CustomException(ErrorCode.STORE_ID_NOTFOUND));
        if (!Objects.equals(store.getRegisteredById(), principal.id())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagResponseDTO> tagList(String tagType, String storeId, String experienceType) {
        if (storeId == null || storeId.isBlank()) {
            throw new CustomException(ErrorCode.STORE_ID_NOTFOUND);
        }
        String categoryCode;
        if (tagType == null || tagType.isBlank() || "ALL".equalsIgnoreCase(tagType)) {
            categoryCode = "ALL";
        } else {
            categoryCode = normalizeCategory(tagType);
        }
        TagExperienceType experienceTypeCode = parseOptionalExperienceType(experienceType);
        boolean allExperienceTypes = experienceTypeCode == null;
        List<TagResponseDTO> list = tagRepository.findAssignedByStoreIdAndCategory(
                storeId,
                categoryCode,
                allExperienceTypes,
                allExperienceTypes ? TagExperienceType.STANDARD : experienceTypeCode
        );
        attachRedirectings(list);
        return list;
    }

    @Override
    @Transactional
    public int delTag(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        java.util.LinkedHashSet<String> requestedIds = new java.util.LinkedHashSet<>(ids);
        List<TagEntity> tags = tagRepository.findActiveByIdIn(requestedIds);
        if (tags.isEmpty()) {
            return 0;
        }

        List<String> factoryIds = tags.stream()
                .filter(tag -> tag.getStatus() == TagStatus.CREATED
                        || tag.getStatus() == TagStatus.FACTORY_ORDERED)
                .map(TagEntity::getId)
                .toList();
        List<String> assignedIds = tags.stream()
                .filter(tag -> tag.getStatus() == TagStatus.ASSIGNED)
                .map(TagEntity::getId)
                .toList();

        int deleted = 0;
        if (!factoryIds.isEmpty()) {
            deleted += tagRepository.hardDeleteFactoryByIdIn(factoryIds);
        }
        if (!assignedIds.isEmpty()) {
            deleted += tagRepository.softDeleteAssignedByIdIn(assignedIds);
            redirectingService.softDeleteByTagIds(assignedIds);
        }
        return deleted;
    }

    @Override
    @Transactional
    public TagOpenResult resolveOpen(String tagId) {
        if (tagId == null || tagId.isBlank()) {
            return TagOpenResult.notFound(spaPath("/tag/not-found"));
        }

        TagOpenView view = tagRepository.findOpenViewById(tagId).orElse(null);
        if (view == null || view.status() == null) {
            return TagOpenResult.notFound(spaPath("/tag/not-found"));
        }

        return switch (view.status()) {
            case ASSIGNED -> {
                if (!view.hasUsableStore()) {
                    yield TagOpenResult.notFound(spaPath("/tag/not-found"));
                }
                if (!redirectingService.existsByTagId(tagId)) {
                    yield TagOpenResult.notFound(spaPath("/tag/not-found"));
                }
                var quick = redirectingService.findQuickByTagId(tagId);
                if (quick.isPresent()) {
                    yield resolveGo(quick.get().getId());
                }
                yield TagOpenResult.choose(spaPath("/tag/choose", "ti", tagId));
            }
            case FACTORY_ORDERED -> TagOpenResult.onboarding(spaPath("/onboarding", "ti", tagId));
            case CREATED -> TagOpenResult.notReady(spaPath("/tag/not-ready"));
        };
    }

    @Override
    @Transactional(readOnly = true)
    public TagChoicesResponse listChoices(String tagId) {
        TagOpenView view = tagRepository.findOpenViewById(tagId).orElse(null);
        if (view == null || view.status() != TagStatus.ASSIGNED || !view.hasUsableStore()) {
            throw new CustomException(ErrorCode.TAG_ID_NOTFOUND);
        }
        var items = redirectingService.listByTagId(tagId).stream()
                .map(com.nfc_tag_service.management.redirecting.dto.RedirectingResponseDTO::forPublicChoice)
                .toList();
        return new TagChoicesResponse(view.storeName(), items);
    }

    @Override
    @Transactional
    public TagOpenResult resolveGo(Long redirectingId) {
        var redirecting = redirectingService.require(redirectingId);
        TagOpenView view = tagRepository.findOpenViewById(redirecting.getTagId()).orElse(null);
        if (view == null || view.status() != TagStatus.ASSIGNED || !view.hasUsableStore()) {
            return TagOpenResult.notFound(spaPath("/tag/not-found"));
        }
        if (!redirectingService.isAllowedRedirectUrl(redirecting.getValue())) {
            return TagOpenResult.notFound(spaPath("/tag/not-found"));
        }
        redirectingService.incrementCount(redirecting.getId());
        if (tagRepository.incrementHitCount(redirecting.getTagId()) != 1) {
            throw new CustomException(ErrorCode.TAG_ID_NOTFOUND);
        }
        return TagOpenResult.redirect(redirecting.getValue());
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.nfc_tag_service.management.redirecting.dto.RedirectingTypeResponseDTO> listRedirectingTypes() {
        return redirectingService.listTypes();
    }

    private void attachRedirectings(List<TagResponseDTO> tags) {
        if (tags == null || tags.isEmpty()) {
            return;
        }
        List<String> ids = tags.stream().map(TagResponseDTO::getId).toList();
        var grouped = redirectingService.listGroupedByTagIds(ids);
        for (TagResponseDTO tag : tags) {
            tag.setRedirectings(grouped.getOrDefault(tag.getId(), List.of()));
        }
    }

    private boolean sameRedirectings(
            List<com.nfc_tag_service.management.redirecting.dto.RedirectingResponseDTO> before,
            List<com.nfc_tag_service.management.redirecting.dto.RedirectingResponseDTO> after
    ) {
        if (before.size() != after.size()) {
            return false;
        }
        for (int i = 0; i < before.size(); i++) {
            var left = before.get(i);
            var right = after.get(i);
            if (!Objects.equals(left.getId(), right.getId())
                    || !Objects.equals(left.getType(), right.getType())
                    || !Objects.equals(left.getValue(), right.getValue())
                    || left.isQuick() != right.isQuick()) {
                return false;
            }
        }
        return true;
    }

    private byte[] buildExcel(List<TagEntity> tags) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("tags");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue(tags.getFirst().getCategory());

            int rowIdx = 1;
            for (TagEntity tag : tags) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(tag.getTagUrl());
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new CustomException(ErrorCode.STORAGE_UPLOAD_FAILED);
        }
    }

    private String factoryCategoryFilter(String tagType) {
        if (tagType == null || tagType.isBlank() || "ALL".equalsIgnoreCase(tagType.trim())) {
            return "ALL";
        }
        return normalizeCategory(tagType);
    }

    private List<TagExcelOrderEntity> listExcelOrders() {
        return tagExcelOrderRepository.findAllByOrderByCreatedAtDescIdDesc();
    }

    private String normalizeCategory(String type) {
        if (type == null || type.isBlank()) {
            return TagCategory.DEFAULT;
        }
        String code = TagCategory.toCode(type);
        if (code == null) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        return code;
    }

    private TagStatus parseStatus(String status) {
        try {
            return TagStatus.valueOf(status.trim().toUpperCase());
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
    }

    private TagExperienceType parseExperienceType(String experienceType) {
        try {
            return TagExperienceType.valueOf(experienceType.trim().toUpperCase());
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
    }

    private TagExperienceType parseOptionalExperienceType(String experienceType) {
        if (experienceType == null
                || experienceType.isBlank()
                || "ALL".equalsIgnoreCase(experienceType)) {
            return null;
        }
        return parseExperienceType(experienceType);
    }

    private String makeTagUrl(String tagId) {
        return UriComponentsBuilder
                .fromUriString(this.serverDomain)
                .path("/tag/open")
                .queryParam("ti", tagId)
                .build()
                .encode()
                .toUriString();
    }

    private String spaPath(String path) {
        return spaPath(path, null, null);
    }

    private String spaPath(String path, String queryName, String queryValue) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(this.spaOrigin)
                .path(path.startsWith("/") ? path : "/" + path);
        if (queryName != null && queryValue != null) {
            builder.queryParam(queryName, queryValue);
        }
        return builder.build().encode().toUriString();
    }

    private String makeFactoryTagId(
            TagExperienceType experienceType,
            Set<String> generatedIds
    ) {
        for (int attempt = 0; attempt < MAX_TAG_ID_ATTEMPTS; attempt++) {
            String timestamp = LocalDateTime.now().format(TAG_ID_TIMESTAMP);
            String uuidPrefix = UUID.randomUUID().toString().replace("-", "").substring(0, 5);
            String candidate = timestamp + "_" + experienceType.name() + "_" + uuidPrefix;
            if (generatedIds.add(candidate) && !tagRepository.existsById(candidate)) {
                return candidate;
            }
        }
        throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
}

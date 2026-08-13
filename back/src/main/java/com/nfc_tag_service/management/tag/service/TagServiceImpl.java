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
import com.nfc_tag_service.management.store.repository.StoreRepository;
import com.nfc_tag_service.management.tag.dto.FactoryBatchProgressDTO;
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
import java.net.URI;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final StoreRepository storeRepository;
    private final TagRepository tagRepository;
    private final TagExcelOrderRepository tagExcelOrderRepository;
    private final TagExcelOrderCounterRepository tagExcelOrderCounterRepository;
    private final SupabaseStorageService supabaseStorageService;

    private static final int MAX_EXCEL_ORDERS = 10;
    private static final int MAX_TAG_ID_ATTEMPTS = 100;
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
    @Transactional(readOnly = true)
    public List<TagResponseDTO> factoryList(String tagType, String status) {
        String category = normalizeCategory(tagType);
        TagStatus tagStatus = parseStatus(status);
        if (tagStatus != TagStatus.CREATED && tagStatus != TagStatus.FACTORY_ORDERED) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        List<TagResponseDTO> list = tagRepository.findFactoryList(category, tagStatus);
        if (tagStatus == TagStatus.FACTORY_ORDERED) {
            Map<Long, Long> assignedCounts = countByFactoryOrderSeq(category, TagStatus.ASSIGNED);
            list.forEach(tag -> {
                Long seq = tag.getFactoryOrderSeq();
                long assigned = seq == null ? 0L : assignedCounts.getOrDefault(seq, 0L);
                tag.setRegistrationInProgress(assigned > 0);
            });
        }
        return list;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FactoryBatchProgressDTO> factoryBatchProgress(String tagType) {
        String category = normalizeCategory(tagType);
        Map<Long, Long> remainingCounts = countByFactoryOrderSeq(category, TagStatus.FACTORY_ORDERED);
        Map<Long, Long> assignedCounts = countByFactoryOrderSeq(category, TagStatus.ASSIGNED);
        Map<Long, Integer> initialCounts = tagExcelOrderRepository
                .findTop10ByCategoryOrderByCreatedAtDescIdDesc(category).stream()
                .collect(Collectors.toMap(
                        TagExcelOrderEntity::getOrderSeq,
                        TagExcelOrderEntity::getTagCount,
                        (left, right) -> left
                ));

        Set<Long> seqs = new HashSet<>();
        seqs.addAll(remainingCounts.keySet());
        seqs.addAll(assignedCounts.keySet());
        seqs.addAll(initialCounts.keySet());

        return seqs.stream()
                .sorted()
                .map(seq -> {
                    long remaining = remainingCounts.getOrDefault(seq, 0L);
                    long assigned = assignedCounts.getOrDefault(seq, 0L);
                    int initial = initialCounts.getOrDefault(seq, (int) (remaining + assigned));
                    boolean inProgress = remaining > 0 && assigned > 0;
                    return new FactoryBatchProgressDTO(seq, remaining, assigned, initial, inProgress);
                })
                .filter(progress -> progress.remainingCount() > 0 || progress.inProgress())
                .toList();
    }

    private Map<Long, Long> countByFactoryOrderSeq(String category, TagStatus status) {
        Map<Long, Long> result = new HashMap<>();
        for (Object[] row : tagRepository.countGroupedByFactoryOrderSeq(category, status)) {
            if (row[0] == null) {
                continue;
            }
            result.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return result;
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
        boolean mixed = tags.stream().anyMatch(tag -> !Objects.equals(tag.getCategory(), category));
        if (mixed) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }

        byte[] excelBytes = buildExcel(tags);
        long orderSeq = nextOrderSeq(category);
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

        trimExcelOrdersToLimit(category);

        for (TagEntity tag : tags) {
            tag.markFactoryOrdered(orderSeq);
        }
        return excelBytes;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagExcelOrderResponseDTO> recentExcelOrders(String tagType) {
        String category = normalizeCategory(tagType);
        Map<Long, Long> remainingCounts = countByFactoryOrderSeq(category, TagStatus.FACTORY_ORDERED);
        Map<Long, Long> assignedCounts = countByFactoryOrderSeq(category, TagStatus.ASSIGNED);
        return tagExcelOrderRepository.findTop10ByCategoryOrderByCreatedAtDescIdDesc(category).stream()
                .map(order -> toExcelOrderDto(
                        order,
                        remainingCounts.getOrDefault(order.getOrderSeq(), 0L),
                        assignedCounts.getOrDefault(order.getOrderSeq(), 0L)
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadExcelOrder(Long orderId) {
        TagExcelOrderEntity order = tagExcelOrderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException(ErrorCode.EXCEL_ORDER_NOT_FOUND));
        long remaining = countByFactoryOrderSeq(order.getCategory(), TagStatus.FACTORY_ORDERED)
                .getOrDefault(order.getOrderSeq() == null ? 0L : order.getOrderSeq(), 0L);
        long assigned = countByFactoryOrderSeq(order.getCategory(), TagStatus.ASSIGNED)
                .getOrDefault(order.getOrderSeq() == null ? 0L : order.getOrderSeq(), 0L);
        int tagCount = order.getTagCount() == null ? 0 : order.getTagCount();
        if ("DISCARDED".equals(resolveExcelOrderStatus(tagCount, remaining, assigned))) {
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

    private long nextOrderSeq(String category) {
        TagExcelOrderCounterEntity counter = tagExcelOrderCounterRepository
                .findById(category)
                .orElseGet(() -> tagExcelOrderCounterRepository.save(TagExcelOrderCounterEntity.initial(category)));
        long allocated = counter.allocateNext();
        tagExcelOrderCounterRepository.save(counter);
        return allocated;
    }

    private void trimExcelOrdersToLimit(String category) {
        List<TagExcelOrderEntity> all = tagExcelOrderRepository.findByCategoryOrderByCreatedAtAscIdAsc(category);
        int overflow = all.size() - MAX_EXCEL_ORDERS;
        if (overflow <= 0) {
            return;
        }
        List<TagExcelOrderEntity> removable = all.subList(0, overflow);
        for (TagExcelOrderEntity order : removable) {
            supabaseStorageService.delete(order.getStoragePath());
            tagExcelOrderRepository.delete(order);
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
     * WAITING: 발주 직후 (삭제/등록 없음)
     * IN_PROGRESS: 일부 매장등록 진행중, 삭제 없음
     * NEEDS_EDIT: 완전삭제 발생 → 엑셀 수정필요 (이후 등록이 시작돼도 잔여가 있으면 유지)
     * COMPLETED: 공장발주 잔여 행이 없고 등록된 태그가 있음 (삭제가 있었어도 잔여 없으면 완료)
     * DISCARDED: 초기 수량 있음 + 등록 0 + 잔여 0 (전부 삭제되어 폐기)
     */
    private String resolveExcelOrderStatus(int initialCount, long remainingCount, long assignedCount) {
        long aliveCount = remainingCount + assignedCount;
        boolean hasDeletion = aliveCount < initialCount;

        // 공장발주 목록에 남은 행이 없고 매장등록된 태그가 있으면 완료
        if (remainingCount == 0 && assignedCount > 0) {
            return "COMPLETED";
        }
        // 전부 삭제만 되고 등록이 하나도 없으면 폐기된 발주
        if (remainingCount == 0 && assignedCount == 0 && initialCount > 0) {
            return "DISCARDED";
        }
        // 삭제 이력이 있으면 등록 진행 중이어도 수정필요 유지
        if (hasDeletion) {
            return "NEEDS_EDIT";
        }
        if (assignedCount > 0 && remainingCount > 0) {
            return "IN_PROGRESS";
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

        String oldNickname = data.getNickname();
        if (Objects.equals(oldNickname, nickname)) {
            throw new CustomException(ErrorCode.TAG_UPDATE_ERROR);
        }
        data.updateNickname(nickname);

        return TagUpdateResponseDTO.builder()
                .isNicknameChanged(true)
                .isUseTagChanged(false)
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
        return tagRepository.findAssignedByStoreIdAndCategory(
                storeId,
                categoryCode,
                allExperienceTypes,
                allExperienceTypes ? TagExperienceType.STANDARD : experienceTypeCode
        );
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
                if (!view.hasUsableStore() || !isValidRedirectUrl(view.redirectUrl())) {
                    yield TagOpenResult.notFound(spaPath("/tag/not-found"));
                }
                // 원자적 +1: 동시 요청에서도 count = count + 1 로 정합성 보장
                if (tagRepository.incrementHitCount(tagId) != 1) {
                    yield TagOpenResult.notFound(spaPath("/tag/not-found"));
                }
                yield TagOpenResult.redirect(view.redirectUrl());
            }
            case FACTORY_ORDERED -> TagOpenResult.onboarding(spaPath("/onboarding", "ti", tagId));
            case CREATED -> TagOpenResult.notReady(spaPath("/tag/not-ready"));
        };
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

    private void validateRedirectUrl(String redirectUrl) {
        if (!isValidRedirectUrl(redirectUrl)) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
    }

    private boolean isValidRedirectUrl(String redirectUrl) {
        try {
            URI uri = URI.create(redirectUrl);
            String scheme = uri.getScheme();
            return scheme != null
                    && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"));
        } catch (IllegalArgumentException e) {
            return false;
        }
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

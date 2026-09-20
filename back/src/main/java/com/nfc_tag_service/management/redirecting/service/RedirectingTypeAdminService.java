package com.nfc_tag_service.management.redirecting.service;

import com.nfc_tag_service.domain.RedirectingTypeEntity;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.management.redirecting.RedirectingLocales;
import com.nfc_tag_service.management.redirecting.dto.RedirectingTypeAdminResponse;
import com.nfc_tag_service.management.redirecting.dto.RedirectingTypeUpsertRequest;
import com.nfc_tag_service.management.redirecting.repository.RedirectingRepository;
import com.nfc_tag_service.management.redirecting.repository.RedirectingTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class RedirectingTypeAdminService {

    private static final Pattern COLOR = Pattern.compile("^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$");
    private static final int MAX_LABEL = 80;

    private final RedirectingTypeRepository redirectingTypeRepository;
    private final RedirectingRepository redirectingRepository;

    @Transactional(readOnly = true)
    public List<RedirectingTypeAdminResponse> list() {
        return redirectingTypeRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RedirectingTypeAdminResponse create(RedirectingTypeUpsertRequest request) {
        Map<String, String> labels = normalizeLabels(request);
        String color = normalizeColor(request == null ? null : request.color());
        int sortOrder = request != null && request.sortOrder() != null
                ? request.sortOrder()
                : redirectingTypeRepository.findMaxSortOrder() + 1;
        RedirectingTypeEntity entity = RedirectingTypeEntity.create(newCode(), color, sortOrder, labels);
        return toResponse(redirectingTypeRepository.save(entity));
    }

    @Transactional
    public RedirectingTypeAdminResponse update(Long id, RedirectingTypeUpsertRequest request) {
        RedirectingTypeEntity entity = redirectingTypeRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.REDIRECTING_TYPE_NOT_FOUND));
        Map<String, String> labels = normalizeLabels(request);
        String color = normalizeColor(request == null ? null : request.color());
        int sortOrder = request != null && request.sortOrder() != null
                ? request.sortOrder()
                : entity.getSortOrder();
        entity.update(color, sortOrder, labels);
        return toResponse(entity);
    }

    @Transactional
    public void delete(Long id) {
        RedirectingTypeEntity entity = redirectingTypeRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.REDIRECTING_TYPE_NOT_FOUND));
        if (redirectingRepository.existsByRedirectingTypeId(id)) {
            throw new CustomException(ErrorCode.REDIRECTING_TYPE_IN_USE);
        }
        redirectingTypeRepository.delete(entity);
    }

    private RedirectingTypeAdminResponse toResponse(RedirectingTypeEntity entity) {
        return new RedirectingTypeAdminResponse(
                entity.getId(),
                entity.getCode(),
                entity.getColor(),
                entity.getSortOrder(),
                RedirectingLocales.copy(entity.getLabels()),
                redirectingRepository.existsByRedirectingTypeId(entity.getId())
        );
    }

    private Map<String, String> normalizeLabels(RedirectingTypeUpsertRequest request) {
        Map<String, String> labels = new LinkedHashMap<>();
        Map<String, String> raw = request == null ? Map.of() : request.labels();
        if (raw != null) {
            for (String locale : RedirectingLocales.ALL) {
                String value = firstLabel(raw, locale);
                if (StringUtils.hasText(value)) {
                    String trimmed = value.trim();
                    if (trimmed.length() > MAX_LABEL) {
                        throw new CustomException(ErrorCode.INVALID_REDIRECTING_TYPE_INPUT);
                    }
                    labels.put(locale, trimmed);
                }
            }
        }
        if (!StringUtils.hasText(labels.get(RedirectingLocales.KO))) {
            throw new CustomException(ErrorCode.INVALID_REDIRECTING_TYPE_INPUT);
        }
        return labels;
    }

    private String firstLabel(Map<String, String> raw, String locale) {
        String direct = raw.get(locale);
        if (StringUtils.hasText(direct)) {
            return direct;
        }
        for (Map.Entry<String, String> entry : raw.entrySet()) {
            if (entry.getKey() != null
                    && RedirectingLocales.normalize(entry.getKey()).equals(locale)
                    && StringUtils.hasText(entry.getValue())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String normalizeColor(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "#64748b";
        }
        String color = raw.trim();
        if (!COLOR.matcher(color).matches()) {
            throw new CustomException(ErrorCode.INVALID_REDIRECTING_TYPE_INPUT);
        }
        return color.toLowerCase(Locale.ROOT);
    }

    private String newCode() {
        String code;
        do {
            code = "RT_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        } while (redirectingTypeRepository.existsByCode(code));
        return code;
    }
}

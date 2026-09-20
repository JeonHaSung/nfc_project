package com.nfc_tag_service.global.type;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Arrays;

/**
 * 태그카드 시리즈(물리 제품 라인).
 * 신규 생성은 SERIES2. SERIES1은 기존 카드 호환용이다.
 */
@Getter
@AllArgsConstructor
public enum TagCategory {

    SERIES1("SERIES1"),
    SERIES2("SERIES2");

    @JsonValue
    private final String name;

    public static final String DEFAULT = SERIES2.name();

    public static String toCode(String inputName) {
        if (inputName == null) return null;
        String trimmed = inputName.trim();
        if (trimmed.isEmpty()) return null;

        // 레거시 NFC/QR 값은 SERIES1로 흡수
        if ("NFC".equalsIgnoreCase(trimmed) || "QR".equalsIgnoreCase(trimmed)) {
            return SERIES1.name();
        }

        return Arrays.stream(TagCategory.values())
                .filter(c -> c.getName().equalsIgnoreCase(trimmed)
                        || c.name().equalsIgnoreCase(trimmed))
                .findFirst()
                .map(TagCategory::name)
                .orElse(null);
    }
}

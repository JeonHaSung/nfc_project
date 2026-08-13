package com.nfc_tag_service.global.type;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Arrays;

/**
 * 태그카드 시리즈(물리 제품 라인).
 * QR/NFC를 한 카드로 통합한 이후에는 SERIES1을 기본으로 쓰며,
 * 이후 다른 방식의 카드가 나오면 SERIES2 등으로 확장한다.
 */
@Getter
@AllArgsConstructor
public enum TagCategory {

    SERIES1("SERIES1");

    @JsonValue
    private final String name;

    public static final String DEFAULT = SERIES1.name();

    public static String toCode(String inputName) {
        if (inputName == null) return null;
        String trimmed = inputName.trim();
        if (trimmed.isEmpty()) return null;

        // 레거시 NFC/QR 값은 현재 시리즈로 흡수
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

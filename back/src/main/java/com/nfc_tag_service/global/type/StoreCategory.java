package com.nfc_tag_service.global.type;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Arrays;

@Getter
@AllArgsConstructor
public enum StoreCategory {

    CF("카페"),
    FD("음식점"),
    PC("PC방"),
    PUB("주점/펍"),
    BE("뷰티/미용"),
    ETC("기타");

    @JsonValue
    private final String name;

    public static String toCode(String koreanName) {
        if (koreanName == null) return ETC.name();

        return Arrays.stream(StoreCategory.values())
                .filter(c -> c.getName().equals(koreanName.trim())) // 한글명 일치 여부 확인 (공백 제거 포함)
                .findFirst()
                .map(StoreCategory::name) // Enum 상수명("BE", "CF" 등) 추출
                .orElse(ETC.name()); // 일치하는 한글명이 없으면 기본값으로 "ETC" 반환
    }
}
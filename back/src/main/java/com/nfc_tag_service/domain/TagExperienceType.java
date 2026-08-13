package com.nfc_tag_service.domain;

import java.util.Collection;
import java.util.Comparator;
import java.util.Objects;

/**
 * 태그가 매장에 등록된 뒤 제공하는 사용자 경험 유형.
 * 태그카드 시리즈(category) 및 생성/발주/등록 상태와 독립적으로 관리한다.
 *
 * <p>rank 숫자가 클수록 높은 등급(대표 타입)이다. DB 컬럼 값(이름)과 무관하게
 * 이 숫자만 바꿔도 대표 타입 선정 기준이 바뀐다.</p>
 */
public enum TagExperienceType {
    STANDARD(1),
    PREMIUM(2);

    private final int rank;

    TagExperienceType(int rank) {
        this.rank = rank;
    }

    public int getRank() {
        return rank;
    }

    public static TagExperienceType highestOf(Collection<TagExperienceType> types) {
        if (types == null || types.isEmpty()) {
            return null;
        }
        return types.stream()
                .filter(Objects::nonNull)
                .max(Comparator.comparingInt(TagExperienceType::getRank))
                .orElse(null);
    }
}

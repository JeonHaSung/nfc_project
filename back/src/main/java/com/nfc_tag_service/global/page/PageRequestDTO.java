package com.nfc_tag_service.global.page;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
public class PageRequestDTO {

    @Builder.Default
    private int page = 1;

    @Builder.Default
    private int size = 10;

    private String flag;
    private String searchText;
    private Long registeredById;
    /** 매장 목록 필터: 해당 타입 카드를 1장 이상 보유한 매장. ALL/빈값이면 전체 */
    private String experienceType;
}

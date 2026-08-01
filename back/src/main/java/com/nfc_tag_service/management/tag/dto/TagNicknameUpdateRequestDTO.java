package com.nfc_tag_service.management.tag.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TagNicknameUpdateRequestDTO {
    private String tagId;
    private String nickname;
}

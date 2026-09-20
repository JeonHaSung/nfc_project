package com.nfc_tag_service.management.tag.dto;

import com.nfc_tag_service.management.redirecting.dto.RedirectingUpsertRequest;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class TagNicknameUpdateRequestDTO {
    private String tagId;
    private String nickname;
    private List<RedirectingUpsertRequest> redirectings;
}

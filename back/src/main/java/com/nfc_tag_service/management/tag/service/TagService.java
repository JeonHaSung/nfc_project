package com.nfc_tag_service.management.tag.service;

import com.nfc_tag_service.management.tag.dto.TagFormRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagResponseDTO;
import com.nfc_tag_service.management.tag.dto.TagUpdateResponseDTO;

import java.util.List;

public interface TagService {
    String tagInsert(TagFormRequestDTO request);
    TagUpdateResponseDTO tagUpdate(TagFormRequestDTO request);
    List<TagResponseDTO> tagList(String tagType,String storeId);
    int delTag(List<String> ids);
    String resolveRedirectUrl(String tagId);

}

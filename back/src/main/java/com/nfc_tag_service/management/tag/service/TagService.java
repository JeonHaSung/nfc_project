package com.nfc_tag_service.management.tag.service;

import com.nfc_tag_service.management.tag.dto.FactoryBatchProgressDTO;
import com.nfc_tag_service.management.tag.dto.TagExcelOrderResponseDTO;
import com.nfc_tag_service.management.tag.dto.TagExcelRequestDTO;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.tag.dto.TagGenerateRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagNicknameUpdateRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagOpenResult;
import com.nfc_tag_service.management.tag.dto.TagResponseDTO;
import com.nfc_tag_service.management.tag.dto.TagUpdateResponseDTO;

import java.util.List;

public interface TagService {
    int generateTags(TagGenerateRequestDTO request);

    List<TagResponseDTO> factoryList(String tagType, String status);

    List<FactoryBatchProgressDTO> factoryBatchProgress(String tagType);

    byte[] issueExcel(TagExcelRequestDTO request);

    List<TagExcelOrderResponseDTO> recentExcelOrders(String tagType);

    byte[] downloadExcelOrder(Long orderId);

    String excelOrderFileName(Long orderId);

    TagUpdateResponseDTO tagUpdate(TagNicknameUpdateRequestDTO request, AdminPrincipal principal);

    List<TagResponseDTO> tagList(String tagType, String storeId, String experienceType);

    int delTag(List<String> ids);

    TagOpenResult resolveOpen(String tagId);
}

package com.nfc_tag_service.management.store.service;


import com.nfc_tag_service.global.page.PageRequestDTO;
import com.nfc_tag_service.global.page.PageResponseDTO;
import com.nfc_tag_service.management.store.dto.StoreFormRequestDTO;
import com.nfc_tag_service.management.store.dto.StoreResponseDTO;

import java.util.List;

public interface StoreService {
    String storeInsert(StoreFormRequestDTO request);
    String storeUpdate(StoreFormRequestDTO request);
    PageResponseDTO<StoreResponseDTO> storeList(PageRequestDTO request);
    int delStore(List<String> ids);
    List<StoreResponseDTO> selectList();

}

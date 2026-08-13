package com.nfc_tag_service.management.store.service;

import com.nfc_tag_service.global.page.PageRequestDTO;
import com.nfc_tag_service.global.page.PageResponseDTO;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.store.dto.StoreFormRequestDTO;
import com.nfc_tag_service.management.store.dto.StoreResponseDTO;

import java.util.List;

public interface StoreService {
    String storeUpdate(StoreFormRequestDTO request);

    PageResponseDTO<StoreResponseDTO> storeList(PageRequestDTO request, AdminPrincipal principal);

    int delStore(List<String> ids);

    PageResponseDTO<StoreResponseDTO> selectSearch(PageRequestDTO request, AdminPrincipal principal);

    StoreResponseDTO selectById(String storeId, AdminPrincipal principal);

    void assertStoreReadable(String storeId, AdminPrincipal principal);
}

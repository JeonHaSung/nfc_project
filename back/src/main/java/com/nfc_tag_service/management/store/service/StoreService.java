package com.nfc_tag_service.management.store.service;

import com.nfc_tag_service.global.page.PageRequestDTO;
import com.nfc_tag_service.global.page.PageResponseDTO;
import com.nfc_tag_service.global.security.AdminPrincipal;
import com.nfc_tag_service.management.store.dto.StoreFormRequestDTO;
import com.nfc_tag_service.management.store.dto.StoreResponseDTO;
import com.nfc_tag_service.management.store.dto.StoreWifiDtos;

import java.util.List;

public interface StoreService {
    String storeUpdate(StoreFormRequestDTO request);

    StoreResponseDTO getForEdit(String storeId, AdminPrincipal principal);

    StoreWifiDtos.WifiResponse getWifi(String storeId, AdminPrincipal principal);

    StoreWifiDtos.WifiResponse updateWifi(
            String storeId,
            StoreWifiDtos.WifiUpdateRequest request,
            AdminPrincipal principal
    );

    PageResponseDTO<StoreResponseDTO> storeList(PageRequestDTO request, AdminPrincipal principal);

    int delStore(List<String> ids);

    int delStoresByRegisteredById(Long registeredById);

    PageResponseDTO<StoreResponseDTO> selectSearch(PageRequestDTO request, AdminPrincipal principal);

    StoreResponseDTO selectById(String storeId, AdminPrincipal principal);

    void assertStoreReadable(String storeId, AdminPrincipal principal);
}

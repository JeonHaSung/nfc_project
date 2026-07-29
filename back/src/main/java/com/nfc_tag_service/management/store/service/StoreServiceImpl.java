package com.nfc_tag_service.management.store.service;

import com.nfc_tag_service.domain.StoreEntity;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.global.page.PageRequestDTO;
import com.nfc_tag_service.global.page.PageResponseDTO;
import com.nfc_tag_service.global.type.StoreCategory;
import com.nfc_tag_service.management.store.dto.StoreFormRequestDTO;
import com.nfc_tag_service.management.store.dto.StoreResponseDTO;
import com.nfc_tag_service.management.store.repository.StoreRepository;
import com.nfc_tag_service.management.tag.repository.TagRepository;
import com.nfc_tag_service.management.tag.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;
    private final TagService tagService;
    private final TagRepository tagRepository;

    @Override
    @Transactional
    public String storeInsert(StoreFormRequestDTO request) {
        if (request == null) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }

        String id = makeId(request.getCategory());
        StoreEntity data = buildStore(request, id);

        try {
            storeRepository.save(data);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }

        return data.getName();
    }

    @Override
    @Transactional
    public String storeUpdate(StoreFormRequestDTO request) {
        if (request == null) {
            throw new CustomException(ErrorCode.INVALID_STORE_INPUT);
        }
        StoreEntity data = storeRepository.findById(request.getId())
                .orElseThrow(() -> new CustomException(ErrorCode.STORE_ID_NOTFOUND));
        data.updateStore(request.getCategory(),request.getName(),
                request.getAddress(),request.getDetailAddress(),request.getDescription());

        return data.getName();
    }



    @Override
    @Transactional(readOnly = true)
    public PageResponseDTO<StoreResponseDTO> storeList(PageRequestDTO request) {
        Pageable pageable = (Pageable) PageRequest.of(
                request.getPage() - 1,
                request.getSize(),
                Sort.by("createdAt").descending());

        String searchKeyword = StringUtils.hasText(request.getSearchText())
                ? "%" + request.getSearchText().trim() + "%"
                : "%%";

        Page<StoreResponseDTO> listData = storeRepository.storeList(
                searchKeyword,
                pageable);

        int totalCount = (int)listData.getTotalElements();

        return PageResponseDTO.<StoreResponseDTO>withAll()
                .dtoList(listData.getContent()) //실제객체 리스트
                .totalCount(totalCount)//총 데이터(실제객체)개수
                .pageRequestDTO(request) //요청DTO
                .build();
    }

    @Override
    @Transactional
    public int delStore(List<String> ids) {
        if (ids.isEmpty()){
            throw new CustomException(ErrorCode.TAG_UPDATE_ERROR);
        }
        int delSize = storeRepository.deleteAllByIdIn(ids);
        List<String> tagIds = tagRepository.findIdsByStoreIdIn(ids);
        int delTagSize = tagService.delTag(tagIds);
        return delSize;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StoreResponseDTO> selectList() {
        List<StoreResponseDTO> stores = storeRepository.stores();
        return stores;
    }

    private StoreEntity buildStore(StoreFormRequestDTO request, String id) {
        return StoreEntity.builder()
                .id(id)
                .category(request.getCategory())
                .name(request.getName())
                .address(request.getAddress())
                .detailAddress(request.getDetailAddress())
                .description(request.getDescription())
                .redirectUrl(request.getRedirectUrl())
                .build();
    }

    private String makeId(String categoryName) {
        int count = storeRepository.storeCount() + 1;
        String categoryCode = StoreCategory.toCode(categoryName);
        String uuidPrefix = UUID.randomUUID().toString().substring(0, 5);
        String formattedCount = String.format("%05d", count);

        return String.format("%s_%s_%s", uuidPrefix, categoryCode, formattedCount);
    }
}
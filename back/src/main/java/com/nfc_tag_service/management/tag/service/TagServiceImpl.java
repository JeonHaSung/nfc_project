package com.nfc_tag_service.management.tag.service;

import com.nfc_tag_service.domain.StoreEntity;
import com.nfc_tag_service.domain.TagEntity;
import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import com.nfc_tag_service.global.type.TagCategory;
import com.nfc_tag_service.management.store.repository.StoreRepository;
import com.nfc_tag_service.management.tag.dto.TagFormRequestDTO;
import com.nfc_tag_service.management.tag.dto.TagResponseDTO;
import com.nfc_tag_service.management.tag.dto.TagUpdateResponseDTO;
import com.nfc_tag_service.management.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService{

    private final StoreRepository storeRepository;
    private final TagRepository tagRepository;

    //서버주소
    @Value("${app.server-domain}")
    private String serverDomain;

    @Override
    @Transactional
    public String tagInsert(TagFormRequestDTO request) {
        if (request == null || request.getStoreId().isBlank()){
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        StoreEntity s = storeRepository.findById(request.getStoreId())
                .orElseThrow(()-> new CustomException(ErrorCode.STORE_ID_NOTFOUND));
        String tagId = makeId(s.getId());
        String tagUrl = makeTagUrl(tagId);
        TagEntity data = buildTag(request,tagId,tagUrl);
        try {
            tagRepository.save(data);
        }catch (Exception e){
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
        return tagUrl;
    }

    @Override
    @Transactional
    public TagUpdateResponseDTO tagUpdate(TagFormRequestDTO request) {
        if (request == null) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }

        TagEntity data = tagRepository.findById(request.getTagId())
                .orElseThrow(() -> new CustomException(ErrorCode.TAG_ID_NOTFOUND));

        String oldNickname = data.getNickname();
        boolean oldUseTag = data.isUsed();

        boolean isNicknameChanged = !Objects.equals(oldNickname, request.getNickname());
        boolean isUseTagChanged = (oldUseTag != request.isUseTag());

        if (!isNicknameChanged && !isUseTagChanged){
            throw new CustomException(ErrorCode.TAG_UPDATE_ERROR);
        }

        data.updateTag(request.getNickname(), request.isUseTag());

        return TagUpdateResponseDTO.builder()
                .isNicknameChanged(isNicknameChanged)
                .isUseTagChanged(isUseTagChanged)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagResponseDTO> tagList(String tagType,String storeId) {
        if (storeId == null || storeId.isBlank() || tagType == null || tagType.isBlank()) {
            throw new CustomException(ErrorCode.STORE_ID_NOTFOUND);
        }
        String categoryCode = Objects.requireNonNullElse(TagCategory.toCode(tagType), "ALL");
        return tagRepository.findTagListByStoreIdAndCategory(storeId,categoryCode);
    }

    @Override
    @Transactional
    public int delTag(List<String> ids) {
        if (ids.isEmpty()){
            throw new CustomException(ErrorCode.TAG_UPDATE_ERROR);
        }
        int delSize = tagRepository.deleteAllByIdIn(ids);
        return delSize;
    }

    @Override
    @Transactional
    public String resolveRedirectUrl(String tagId) {
        if (tagId == null || tagId.isBlank()) {
            throw new CustomException(ErrorCode.TAG_ID_NOTFOUND);
        }

        TagEntity tag = tagRepository.findActiveTagById(tagId)
                .orElseThrow(() -> new CustomException(ErrorCode.TAG_ID_NOTFOUND));
        StoreEntity store = storeRepository.findById(tag.getStoreId())
                .filter(data -> !data.isDel())
                .orElseThrow(() -> new CustomException(ErrorCode.STORE_ID_NOTFOUND));

        String redirectUrl = store.getRedirectUrl();
        validateRedirectUrl(redirectUrl);

        if (tagRepository.incrementHitCount(tagId) != 1) {
            throw new CustomException(ErrorCode.TAG_ID_NOTFOUND);
        }
        return redirectUrl;
    }

    private TagEntity buildTag(TagFormRequestDTO request, String tagId, String tagUrl) {
        return TagEntity.builder()
                .id(tagId)
                .storeId(request.getStoreId())
                .category(request.getType())
                .nickname(request.getNickname())
                .tagUrl(tagUrl)
                .isUsed(request.isUseTag())
                .build();
    }

    private String makeTagUrl(String tagId) {
        return UriComponentsBuilder
                .fromUriString(this.serverDomain)
                .path("/tag/open")
                .queryParam("ti", tagId)
                .build()
                .encode()
                .toUriString();
    }

    private void validateRedirectUrl(String redirectUrl) {
        try {
            URI uri = URI.create(redirectUrl);
            String scheme = uri.getScheme();
            if (scheme == null
                    || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
            }
        } catch (IllegalArgumentException e) {
            throw new CustomException(ErrorCode.INVALID_TAG_INPUT);
        }
    }



    private String makeId(String storeId) {
        long count = tagRepository.countByStoreId(storeId) + 1;
        String uuidPrefix = UUID.randomUUID().toString().substring(0, 2);
        return String.format("%s_%s_%02d", storeId, uuidPrefix, count);
    }
}

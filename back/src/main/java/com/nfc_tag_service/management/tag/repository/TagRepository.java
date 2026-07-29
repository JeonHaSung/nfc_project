package com.nfc_tag_service.management.tag.repository;

import com.nfc_tag_service.domain.TagEntity;
import com.nfc_tag_service.management.tag.dto.TagResponseDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<TagEntity, String> {
    //태그아이디만들기재료
    @Query("SELECT COUNT(t) FROM TagEntity t WHERE t.storeId = :storeId")
    int countByStoreId(@Param("storeId") String storeId);
    
    //태그카운트
    @Modifying
    @Query("UPDATE TagEntity t SET t.hitCount = t.hitCount + 1 " +
            "WHERE t.id = :tagId AND t.del = false AND t.isUsed = true")
    int incrementHitCount(@Param("tagId") String tagId);

    @Query("SELECT t FROM TagEntity t " +
            "WHERE t.id = :tagId AND t.del = false AND t.isUsed = true")
    Optional<TagEntity> findActiveTagById(@Param("tagId") String tagId);

    //태그목록 조회
    @Query("SELECT new com.nfc_tag_service.management.tag.dto.TagResponseDTO(" +
            "t.id, t.storeId, t.category, t.nickname, t.tagUrl, t.hitCount, t.isUsed) " +
            "FROM TagEntity t " +
            "WHERE t.storeId = :storeId " +
            "AND t.del = false " +
            "AND (:category = 'ALL' OR t.category = :category) " +
            "ORDER BY t.createdAt DESC, t.id DESC")
    List<TagResponseDTO> findTagListByStoreIdAndCategory(@Param("storeId") String storeId,
                                                         @Param("category") String category);


    //태그삭제
    @Modifying(clearAutomatically = true)
    @Query("UPDATE TagEntity t SET t.del = true, t.isUsed = false WHERE t.id IN :ids AND t.del = false")
    int deleteAllByIdIn(@Param("ids") List<String> ids);

    //여러 스토어 ID(IN :storeIds)에 속한 삭제 안 된 태그 ID 목록 조회
    @Query("SELECT t.id FROM TagEntity t WHERE t.storeId IN :storeIds AND t.del = false")
    List<String> findIdsByStoreIdIn(@Param("storeIds") List<String> storeIds);


    //통계용 스케줄러 모든 카운트 합계
    @Query("SELECT COALESCE(SUM(t.hitCount), 0L) FROM TagEntity t WHERE t.storeId = :storeId AND t.del = false")
    Long sumHitCountByStoreId(@Param("storeId") String storeId);


}

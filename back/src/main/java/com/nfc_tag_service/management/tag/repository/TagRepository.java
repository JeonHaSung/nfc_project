package com.nfc_tag_service.management.tag.repository;

import com.nfc_tag_service.domain.TagEntity;
import com.nfc_tag_service.domain.TagStatus;
import com.nfc_tag_service.management.tag.dto.TagResponseDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<TagEntity, String> {

    @Query("SELECT COUNT(t) FROM TagEntity t")
    long countAllTags();

    @Modifying
    @Query("UPDATE TagEntity t SET t.hitCount = t.hitCount + 1 " +
            "WHERE t.id = :tagId AND t.del = false AND t.status = com.nfc_tag_service.domain.TagStatus.ASSIGNED")
    int incrementHitCount(@Param("tagId") String tagId);

    @Query("SELECT t FROM TagEntity t WHERE t.id = :tagId AND t.del = false")
    Optional<TagEntity> findActiveById(@Param("tagId") String tagId);

    @Query("SELECT new com.nfc_tag_service.management.tag.dto.TagResponseDTO(" +
            "t.id, t.storeId, t.category, t.nickname, t.tagUrl, t.hitCount, t.status, t.factoryOrderSeq) " +
            "FROM TagEntity t " +
            "WHERE t.storeId = :storeId " +
            "AND t.del = false " +
            "AND t.status = com.nfc_tag_service.domain.TagStatus.ASSIGNED " +
            "AND (:category = 'ALL' OR t.category = :category) " +
            "ORDER BY t.createdAt DESC, t.id DESC")
    List<TagResponseDTO> findAssignedByStoreIdAndCategory(
            @Param("storeId") String storeId,
            @Param("category") String category);

    @Query("SELECT new com.nfc_tag_service.management.tag.dto.TagResponseDTO(" +
            "t.id, t.storeId, t.category, t.nickname, t.tagUrl, t.hitCount, t.status, t.factoryOrderSeq) " +
            "FROM TagEntity t " +
            "WHERE t.del = false " +
            "AND t.category = :category " +
            "AND t.status = :status " +
            "ORDER BY COALESCE(t.factoryOrderSeq, 999999999), t.createdAt DESC, t.id DESC")
    List<TagResponseDTO> findFactoryList(
            @Param("category") String category,
            @Param("status") TagStatus status);

    @Query("SELECT t FROM TagEntity t WHERE t.id IN :ids AND t.del = false AND t.status = :status")
    List<TagEntity> findAllByIdInAndStatus(
            @Param("ids") Collection<String> ids,
            @Param("status") TagStatus status);

    @Query("SELECT t FROM TagEntity t WHERE t.id IN :ids AND t.del = false")
    List<TagEntity> findActiveByIdIn(@Param("ids") Collection<String> ids);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE TagEntity t SET t.del = true WHERE t.id IN :ids AND t.del = false " +
            "AND t.status = com.nfc_tag_service.domain.TagStatus.ASSIGNED")
    int softDeleteAssignedByIdIn(@Param("ids") List<String> ids);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM TagEntity t WHERE t.id IN :ids " +
            "AND t.status IN (com.nfc_tag_service.domain.TagStatus.CREATED, " +
            "com.nfc_tag_service.domain.TagStatus.FACTORY_ORDERED)")
    int hardDeleteFactoryByIdIn(@Param("ids") List<String> ids);

    @Query("SELECT t.id FROM TagEntity t WHERE t.storeId IN :storeIds AND t.del = false")
    List<String> findIdsByStoreIdIn(@Param("storeIds") List<String> storeIds);

    @Query("SELECT COALESCE(SUM(t.hitCount), 0L) FROM TagEntity t WHERE t.storeId = :storeId AND t.del = false")
    Long sumHitCountByStoreId(@Param("storeId") String storeId);

    @Query("SELECT t.factoryOrderSeq, COUNT(t) FROM TagEntity t " +
            "WHERE t.del = false " +
            "AND t.category = :category " +
            "AND t.status = :status " +
            "AND t.factoryOrderSeq IS NOT NULL " +
            "GROUP BY t.factoryOrderSeq")
    List<Object[]> countGroupedByFactoryOrderSeq(
            @Param("category") String category,
            @Param("status") TagStatus status);
}

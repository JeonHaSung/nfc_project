package com.nfc_tag_service.management.store.repository;

import com.nfc_tag_service.domain.StoreReviewKeywordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface StoreReviewKeywordRepository extends JpaRepository<StoreReviewKeywordEntity, Long> {

    List<StoreReviewKeywordEntity> findByStoreIdOrderByIdAsc(String storeId);

    long countByStoreId(String storeId);

    Optional<StoreReviewKeywordEntity> findByIdAndStoreId(Long id, String storeId);

    boolean existsByStoreIdAndKeywordIgnoreCase(String storeId, String keyword);

    boolean existsByStoreIdAndKeywordIgnoreCaseAndIdNot(String storeId, String keyword, Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM StoreReviewKeywordEntity k WHERE k.storeId = :storeId")
    int deleteByStoreId(@Param("storeId") String storeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM StoreReviewKeywordEntity k WHERE k.storeId = :storeId AND k.id IN :ids")
    int deleteByStoreIdAndIdIn(@Param("storeId") String storeId, @Param("ids") Collection<Long> ids);
}

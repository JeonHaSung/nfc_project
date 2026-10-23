package com.nfc_tag_service.management.store.repository;

import com.nfc_tag_service.domain.StoreEventEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface StoreEventRepository extends JpaRepository<StoreEventEntity, Long> {

    @EntityGraph(attributePaths = "items")
    @Query("""
            SELECT e FROM StoreEventEntity e
            WHERE e.storeId = :storeId
            ORDER BY CASE WHEN e.startAt IS NULL THEN 1 ELSE 0 END ASC, e.startAt DESC, e.id DESC
            """)
    List<StoreEventEntity> findByStoreIdOrdered(@Param("storeId") String storeId);

    @EntityGraph(attributePaths = "items")
    @Query("""
            SELECT e FROM StoreEventEntity e
            WHERE e.storeId = :storeId
              AND e.enabled = true
              AND e.showOnReviewRelay = true
              AND (
                e.noTimeLimit = true
                OR (e.startAt IS NOT NULL AND e.endAt IS NOT NULL AND e.startAt <= :now AND e.endAt >= :now)
              )
            ORDER BY CASE WHEN e.startAt IS NULL THEN 1 ELSE 0 END ASC, e.startAt DESC, e.id DESC
            """)
    List<StoreEventEntity> findLiveRelayByStoreId(
            @Param("storeId") String storeId,
            @Param("now") LocalDateTime now);

    Optional<StoreEventEntity> findByIdAndStoreId(Long id, String storeId);

    long countByStoreId(String storeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE StoreEventEntity e
            SET e.enabled = false
            WHERE e.enabled = true
              AND e.noTimeLimit = false
              AND e.endAt IS NOT NULL
              AND e.endAt < :now
            """)
    int disableExpired(@Param("now") LocalDateTime now);

    @Query("""
            SELECT DISTINCT e.storeId FROM StoreEventEntity e
            WHERE e.storeId IN :storeIds
              AND e.enabled = true
              AND (
                e.noTimeLimit = true
                OR (e.startAt IS NOT NULL AND e.endAt IS NOT NULL AND e.startAt <= :now AND e.endAt >= :now)
              )
            """)
    List<String> findStoreIdsWithLiveEvent(
            @Param("storeIds") Collection<String> storeIds,
            @Param("now") LocalDateTime now);

    @Query("""
            SELECT e.storeId, COUNT(e.id) FROM StoreEventEntity e
            WHERE e.storeId IN :storeIds
              AND e.enabled = true
              AND (
                e.noTimeLimit = true
                OR (e.startAt IS NOT NULL AND e.endAt IS NOT NULL AND e.startAt <= :now AND e.endAt >= :now)
              )
            GROUP BY e.storeId
            """)
    List<Object[]> countLiveEventsByStoreIds(
            @Param("storeIds") Collection<String> storeIds,
            @Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM StoreEventItemEntity i WHERE i.event.storeId = :storeId")
    int deleteItemsByStoreId(@Param("storeId") String storeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM StoreEventItemEntity i WHERE i.event.storeId = :storeId AND i.event.id IN :ids")
    int deleteItemsByStoreIdAndEventIdIn(
            @Param("storeId") String storeId,
            @Param("ids") Collection<Long> ids);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM StoreEventEntity e WHERE e.storeId = :storeId")
    int deleteByStoreId(@Param("storeId") String storeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM StoreEventEntity e WHERE e.storeId = :storeId AND e.id IN :ids")
    int deleteByStoreIdAndIdIn(@Param("storeId") String storeId, @Param("ids") Collection<Long> ids);
}

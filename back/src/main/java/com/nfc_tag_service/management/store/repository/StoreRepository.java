package com.nfc_tag_service.management.store.repository;

import com.nfc_tag_service.domain.StoreEntity;
import com.nfc_tag_service.management.store.dto.StoreResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<StoreEntity, String> {

    @Query("SELECT COUNT(s) FROM StoreEntity s")
    int storeCount();

    @Query(value = "SELECT new com.nfc_tag_service.management.store.dto.StoreResponseDTO(" +
            "s.id, s.category, s.name, s.description, " +
            "COALESCE(SUM(CASE WHEN t.del = false THEN t.hitCount ELSE 0L END), 0L), " +
            "COALESCE(SUM(CASE WHEN t.del = false AND t.status = com.nfc_tag_service.domain.TagStatus.ASSIGNED THEN 1L ELSE 0L END), 0L), " +
            "s.redirectUrl, s.registeredById, s.registeredByName) " +
            "FROM StoreEntity s " +
            "LEFT JOIN TagEntity t ON s.id = t.storeId " +
            "WHERE s.del = false " +
            "AND (:registeredById IS NULL OR s.registeredById = :registeredById) " +
            "AND (:searchText IS NULL OR :searchText = '' " +
            "     OR s.name LIKE CONCAT('%', :searchText, '%') " +
            "     OR s.id LIKE CONCAT('%', :searchText, '%') " +
            "     OR s.description LIKE CONCAT('%', :searchText, '%') " +
            "     OR s.registeredByName LIKE CONCAT('%', :searchText, '%')) " +
            "GROUP BY s.id, s.category, s.name, s.description, s.redirectUrl, s.registeredById, s.registeredByName, s.createdAt " +
            "ORDER BY s.createdAt DESC",
            countQuery = "SELECT COUNT(s) FROM StoreEntity s " +
                    "WHERE s.del = false " +
                    "AND (:registeredById IS NULL OR s.registeredById = :registeredById) " +
                    "AND (:searchText IS NULL OR :searchText = '' " +
                    "     OR s.name LIKE CONCAT('%', :searchText, '%') " +
                    "     OR s.id LIKE CONCAT('%', :searchText, '%') " +
                    "     OR s.description LIKE CONCAT('%', :searchText, '%') " +
                    "     OR s.registeredByName LIKE CONCAT('%', :searchText, '%'))")
    Page<StoreResponseDTO> storeList(
            @Param("searchText") String searchText,
            @Param("registeredById") Long registeredById,
            Pageable pageable);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE StoreEntity s SET s.del = true WHERE s.id IN :ids AND s.del = false")
    int deleteAllByIdIn(@Param("ids") List<String> ids);

    @Query("SELECT new com.nfc_tag_service.management.store.dto.StoreResponseDTO(" +
            "s.id, s.name, s.registeredById, s.registeredByName) " +
            "FROM StoreEntity s WHERE s.del = false " +
            "AND (:registeredById IS NULL OR s.registeredById = :registeredById) " +
            "ORDER BY s.createdAt DESC")
    List<StoreResponseDTO> stores(@Param("registeredById") Long registeredById);

    @Query("SELECT s FROM StoreEntity s WHERE s.del = false")
    List<StoreEntity> findAllNotDeleted();

    @Query("SELECT s FROM StoreEntity s WHERE s.del = false AND s.registeredById = :registeredById ORDER BY s.createdAt DESC")
    List<StoreEntity> findActiveByRegisteredById(@Param("registeredById") Long registeredById);

    boolean existsByIdAndDelFalseAndRegisteredById(String id, Long registeredById);
}

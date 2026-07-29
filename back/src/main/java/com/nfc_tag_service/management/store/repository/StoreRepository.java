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

    ////스토어ID만들기재료
    @Query("SELECT COUNT(s) FROM StoreEntity s")
    int storeCount();

    //스토어조회
    @Query(value = "SELECT new com.nfc_tag_service.management.store.dto.StoreResponseDTO(" +
            "s.id, s.category, s.name, s.address, s.detailAddress, s.description, " +
            "COALESCE(SUM(t.hitCount), 0L), s.redirectUrl) " +
            "FROM StoreEntity s " +
            "LEFT JOIN TagEntity t ON s.id = t.storeId " +
            "WHERE s.del = false " +
            "AND (:searchText IS NULL OR :searchText = '' " +
            "     OR s.name LIKE CONCAT('%', :searchText, '%') " +
            "     OR s.id LIKE CONCAT('%', :searchText, '%') " +
            "     OR s.description LIKE CONCAT('%', :searchText, '%')) " +
            "GROUP BY s.id, s.category, s.name, s.address, s.detailAddress, s.description, s.redirectUrl",
            countQuery = "SELECT COUNT(s) FROM StoreEntity s " +
                    "WHERE s.del = false " +
                    "AND (:searchText IS NULL OR :searchText = '' " +
                    "     OR s.name LIKE CONCAT('%', :searchText, '%') " +
                    "     OR s.id LIKE CONCAT('%', :searchText, '%') " +
                    "     OR s.description LIKE CONCAT('%', :searchText, '%'))")
    Page<StoreResponseDTO> storeList(
            @Param("searchText") String searchText,
            Pageable pageable);

    //스토어삭제
    @Modifying(clearAutomatically = true)
    @Query("UPDATE StoreEntity s SET s.del = true WHERE s.id IN :ids AND s.del = false")
    int deleteAllByIdIn(@Param("ids") List<String> ids);

    //목록용
    @Query("SELECT new com.nfc_tag_service.management.store.dto.StoreResponseDTO(s.id, s.name) " +
            "FROM StoreEntity s WHERE s.del = false")
    List<StoreResponseDTO> stores();


    //통계용 조회
    @Query("SELECT s FROM StoreEntity s WHERE s.del = false")
    List<StoreEntity> findAllNotDeleted();

}

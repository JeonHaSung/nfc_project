package com.nfc_tag_service.management.tag.repository;

import com.nfc_tag_service.domain.TagExcelOrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TagExcelOrderRepository extends JpaRepository<TagExcelOrderEntity, Long> {
    List<TagExcelOrderEntity> findAllByOrderByCreatedAtDescIdDesc();

    List<TagExcelOrderEntity> findAllByOrderByCreatedAtAscIdAsc();

    Optional<TagExcelOrderEntity> findFirstByOrderSeqOrderByIdAsc(Long orderSeq);

    @Query("SELECT COALESCE(MAX(o.orderSeq), 0) FROM TagExcelOrderEntity o")
    Long findMaxOrderSeq();
}

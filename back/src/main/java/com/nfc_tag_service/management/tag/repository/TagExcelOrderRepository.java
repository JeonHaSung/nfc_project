package com.nfc_tag_service.management.tag.repository;

import com.nfc_tag_service.domain.TagExcelOrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagExcelOrderRepository extends JpaRepository<TagExcelOrderEntity, Long> {
    List<TagExcelOrderEntity> findTop10ByCategoryOrderByCreatedAtDescIdDesc(String category);

    List<TagExcelOrderEntity> findByCategoryOrderByCreatedAtAscIdAsc(String category);
}

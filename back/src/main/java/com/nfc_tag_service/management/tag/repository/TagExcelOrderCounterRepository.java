package com.nfc_tag_service.management.tag.repository;

import com.nfc_tag_service.domain.TagExcelOrderCounterEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagExcelOrderCounterRepository extends JpaRepository<TagExcelOrderCounterEntity, String> {
}

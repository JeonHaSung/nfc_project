package com.nfc_tag_service.management.restore;

import com.nfc_tag_service.domain.StorePurgeLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StorePurgeLogRepository extends JpaRepository<StorePurgeLogEntity, Long> {

    List<StorePurgeLogEntity> findAllByOrderByIdDesc();
}

package com.nfc_tag_service.management.dashBoard.repository;

import com.nfc_tag_service.domain.MonthlyCountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MonthlyCountRepository extends JpaRepository<MonthlyCountEntity, String> {

    long deleteByStoreId(String storeId);
}

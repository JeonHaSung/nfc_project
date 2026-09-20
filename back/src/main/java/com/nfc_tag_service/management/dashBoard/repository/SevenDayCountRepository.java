package com.nfc_tag_service.management.dashBoard.repository;

import com.nfc_tag_service.domain.SevenDayCountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SevenDayCountRepository extends JpaRepository<SevenDayCountEntity, String> {

    long deleteByStoreId(String storeId);
}

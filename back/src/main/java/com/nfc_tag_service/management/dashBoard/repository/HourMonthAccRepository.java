package com.nfc_tag_service.management.dashBoard.repository;

import com.nfc_tag_service.domain.HourMonthAccEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HourMonthAccRepository extends JpaRepository<HourMonthAccEntity, String> {

    Optional<HourMonthAccEntity> findByStoreIdAndDate(String storeId, LocalDate date);

    List<HourMonthAccEntity> findByStoreId(String storeId);

    long deleteByStoreId(String storeId);
}

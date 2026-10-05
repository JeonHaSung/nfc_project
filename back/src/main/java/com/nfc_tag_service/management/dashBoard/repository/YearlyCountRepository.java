package com.nfc_tag_service.management.dashBoard.repository;

import com.nfc_tag_service.domain.YearlyCountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface YearlyCountRepository extends JpaRepository<YearlyCountEntity, String> {

    Optional<YearlyCountEntity> findByStoreIdAndDate(String storeId, LocalDate date);

    boolean existsByStoreIdAndDate(String storeId, LocalDate date);

    List<YearlyCountEntity> findByStoreId(String storeId);
}

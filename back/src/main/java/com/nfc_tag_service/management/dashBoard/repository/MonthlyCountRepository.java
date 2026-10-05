package com.nfc_tag_service.management.dashBoard.repository;

import com.nfc_tag_service.domain.MonthlyCountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyCountRepository extends JpaRepository<MonthlyCountEntity, String> {

    boolean existsByStoreIdAndDate(String storeId, LocalDate date);

    Optional<MonthlyCountEntity> findFirstByStoreIdAndDateOrderByIdDesc(String storeId, LocalDate date);

    List<MonthlyCountEntity> findByStoreIdOrderByDateAscIdAsc(String storeId);

    long deleteByStoreId(String storeId);
}

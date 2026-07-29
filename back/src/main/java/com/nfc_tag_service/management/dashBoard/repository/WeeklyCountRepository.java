package com.nfc_tag_service.management.dashBoard.repository;

import com.nfc_tag_service.domain.WeeklyCountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface WeeklyCountRepository extends JpaRepository<WeeklyCountEntity, String> {

    Optional<WeeklyCountEntity> findTopByStoreIdOrderByDateDescIdDesc(String storeId);

    Optional<WeeklyCountEntity> findTopByStoreIdAndDateLessThanEqualOrderByDateDescIdDesc(
            String storeId, LocalDate date);

    Optional<WeeklyCountEntity> findTopByStoreIdAndDateOrderByIdDesc(
            String storeId, LocalDate date);

    default Optional<WeeklyCountEntity> findTopByStoreIdOrderByIdDesc(String storeId) {
        return findTopByStoreIdOrderByDateDescIdDesc(storeId);
    }

    long deleteByDateBefore(LocalDate cutoffDate);

}

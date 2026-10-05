package com.nfc_tag_service.management.dashBoard.repository;

import com.nfc_tag_service.domain.HourlyCountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HourlyCountRepository extends JpaRepository<HourlyCountEntity, String> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            INSERT INTO hourly_log (id, store_id, date, hour_of_day, count_value)
            VALUES (:id, :storeId, :date, :hour, 1)
            ON CONFLICT (store_id, date, hour_of_day)
            DO UPDATE SET count_value = hourly_log.count_value + 1
            """, nativeQuery = true)
    void increment(
            @Param("id") String id,
            @Param("storeId") String storeId,
            @Param("date") LocalDate date,
            @Param("hour") int hour);

    List<HourlyCountEntity> findByStoreIdAndDateOrderByHourOfDayAsc(String storeId, LocalDate date);

    @Query("SELECT DISTINCT h.date FROM HourlyCountEntity h WHERE h.storeId = :storeId AND h.date < :today ORDER BY h.date ASC")
    List<LocalDate> findDistinctDatesByStoreIdAndDateBefore(
            @Param("storeId") String storeId,
            @Param("today") LocalDate today);

    long deleteByStoreIdAndDate(String storeId, LocalDate date);

    long deleteByDateBefore(LocalDate cutoffDate);

    long deleteByStoreId(String storeId);
}

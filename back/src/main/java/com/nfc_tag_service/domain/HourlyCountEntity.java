package com.nfc_tag_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(
        name = "hourly_log",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_hourly_log_store_date_hour",
                columnNames = {"store_id", "date", "hour_of_day"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HourlyCountEntity {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "store_id", length = 100, nullable = false)
    private String storeId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "hour_of_day", nullable = false)
    private Integer hourOfDay;

    @Column(name = "count_value", nullable = false)
    private Long countValue;

    @Builder
    public HourlyCountEntity(String id, String storeId, LocalDate date, Integer hourOfDay, Long countValue) {
        this.id = id;
        this.storeId = storeId;
        this.date = date;
        this.hourOfDay = hourOfDay;
        this.countValue = countValue == null ? 0L : countValue;
    }
}

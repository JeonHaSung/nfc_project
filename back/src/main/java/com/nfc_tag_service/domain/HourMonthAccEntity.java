package com.nfc_tag_service.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Entity
@Table(
        name = "hourly_month_acc",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_hourly_month_acc_store_date",
                columnNames = {"store_id", "date"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HourMonthAccEntity {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "store_id", length = 100, nullable = false)
    private String storeId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "last_applied_date")
    private LocalDate lastAppliedDate;

    @ElementCollection
    @CollectionTable(name = "hourly_month_acc_hours", joinColumns = @JoinColumn(name = "acc_id"))
    @MapKeyColumn(name = "hour_of_day")
    @Column(name = "hit_count", nullable = false)
    private Map<Integer, Long> hourCounts = new LinkedHashMap<>();

    @Builder
    public HourMonthAccEntity(
            String id,
            String storeId,
            LocalDate date,
            LocalDate lastAppliedDate,
            Map<Integer, Long> hourCounts
    ) {
        this.id = id;
        this.storeId = storeId;
        this.date = date;
        this.lastAppliedDate = lastAppliedDate;
        this.hourCounts = hourCounts == null ? new LinkedHashMap<>() : new LinkedHashMap<>(hourCounts);
    }

    public void applyDay(LocalDate day, Map<Integer, Long> dayHours) {
        if (day == null) {
            return;
        }
        if (this.lastAppliedDate != null && !day.isAfter(this.lastAppliedDate)) {
            return;
        }
        if (this.hourCounts == null) {
            this.hourCounts = new LinkedHashMap<>();
        }
        if (dayHours != null) {
            for (Map.Entry<Integer, Long> entry : dayHours.entrySet()) {
                if (entry.getKey() == null || entry.getValue() == null || entry.getValue() <= 0) {
                    continue;
                }
                this.hourCounts.merge(entry.getKey(), entry.getValue(), Long::sum);
            }
        }
        this.lastAppliedDate = day;
    }

    public Optional<Integer> mostClickedHour() {
        if (hourCounts == null || hourCounts.isEmpty()) {
            return Optional.empty();
        }
        return hourCounts.entrySet().stream()
                .filter(entry -> entry.getKey() != null && entry.getValue() != null && entry.getValue() > 0)
                .max(Comparator.<Map.Entry<Integer, Long>>comparingLong(Map.Entry::getValue)
                        .thenComparing(Map.Entry::getKey, Comparator.reverseOrder()))
                .map(Map.Entry::getKey);
    }
}

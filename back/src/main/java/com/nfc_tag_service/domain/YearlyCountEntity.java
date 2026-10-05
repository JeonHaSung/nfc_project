package com.nfc_tag_service.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
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
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@Entity
@Table(
        name = "yearly_log",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_yearly_log_store_date",
                columnNames = {"store_id", "date"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class YearlyCountEntity {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "store_id", length = 100)
    private String storeId;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
    @Column
    private LocalDate date;

    @Column
    private Long countValue;

    @Column(name = "most_clicked_day_of_week", length = 30)
    private String mostClickedDayOfWeek;

    @Column(name = "most_clicked_hour")
    private Integer mostClickedHour;

    @ElementCollection
    @CollectionTable(name = "yearly_log_weekdays", joinColumns = @JoinColumn(name = "yearly_id"))
    @MapKeyColumn(name = "day_of_week", length = 30)
    @Column(name = "hit_count", nullable = false)
    private Map<String, Long> weekdayCounts = new LinkedHashMap<>();

    @ElementCollection
    @CollectionTable(name = "yearly_log_hours", joinColumns = @JoinColumn(name = "yearly_id"))
    @MapKeyColumn(name = "hour_of_day")
    @Column(name = "hit_count", nullable = false)
    private Map<Integer, Long> hourCounts = new LinkedHashMap<>();

    @ElementCollection
    @CollectionTable(
            name = "yearly_log_applied_months",
            joinColumns = @JoinColumn(name = "yearly_id"),
            uniqueConstraints = @UniqueConstraint(
                    name = "uk_yearly_applied_month",
                    columnNames = {"yearly_id", "month_start"}
            )
    )
    @Column(name = "month_start", nullable = false)
    private Set<LocalDate> appliedMonths = new LinkedHashSet<>();

    @Builder
    public YearlyCountEntity(
            String id,
            String storeId,
            LocalDate date,
            Long countValue,
            String mostClickedDayOfWeek,
            Integer mostClickedHour,
            Map<String, Long> weekdayCounts,
            Map<Integer, Long> hourCounts
    ) {
        this.id = id;
        this.storeId = storeId;
        this.date = date;
        this.countValue = countValue;
        this.mostClickedDayOfWeek = mostClickedDayOfWeek;
        this.mostClickedHour = mostClickedHour;
        this.weekdayCounts = weekdayCounts == null ? new LinkedHashMap<>() : new LinkedHashMap<>(weekdayCounts);
        this.hourCounts = hourCounts == null ? new LinkedHashMap<>() : new LinkedHashMap<>(hourCounts);
        this.appliedMonths = new LinkedHashSet<>();
    }

    public void applyMonthSnapshot(
            LocalDate monthStart,
            long cumulative,
            Map<String, Long> monthWeekdays,
            Map<Integer, Long> monthHours
    ) {
        if (monthStart == null) {
            return;
        }
        if (this.appliedMonths == null) {
            this.appliedMonths = new LinkedHashSet<>();
        }
        if (this.appliedMonths.add(monthStart)) {
            if (this.weekdayCounts == null) {
                this.weekdayCounts = new LinkedHashMap<>();
            }
            if (this.hourCounts == null) {
                this.hourCounts = new LinkedHashMap<>();
            }
            if (monthWeekdays != null) {
                for (Map.Entry<String, Long> entry : monthWeekdays.entrySet()) {
                    if (entry.getKey() == null || entry.getValue() == null) {
                        continue;
                    }
                    this.weekdayCounts.merge(entry.getKey(), entry.getValue(), Long::sum);
                }
            }
            if (monthHours != null) {
                for (Map.Entry<Integer, Long> entry : monthHours.entrySet()) {
                    if (entry.getKey() == null || entry.getValue() == null || entry.getValue() <= 0) {
                        continue;
                    }
                    this.hourCounts.merge(entry.getKey(), entry.getValue(), Long::sum);
                }
            }
        }
        boolean latestMonth = this.appliedMonths.stream().noneMatch(month -> month.isAfter(monthStart));
        if (latestMonth) {
            this.countValue = cumulative;
        }
        refreshMostClickedDay();
        refreshMostClickedHour();
    }

    private void refreshMostClickedDay() {
        if (weekdayCounts == null || weekdayCounts.isEmpty()) {
            return;
        }
        weekdayCounts.entrySet().stream()
                .filter(entry -> entry.getValue() != null && entry.getValue() > 0)
                .max(Comparator.<Map.Entry<String, Long>>comparingLong(Map.Entry::getValue)
                        .thenComparing(Map.Entry::getKey))
                .map(Map.Entry::getKey)
                .ifPresent(day -> this.mostClickedDayOfWeek = day);
    }

    private void refreshMostClickedHour() {
        if (hourCounts == null || hourCounts.isEmpty()) {
            return;
        }
        hourCounts.entrySet().stream()
                .filter(entry -> entry.getKey() != null && entry.getValue() != null && entry.getValue() > 0)
                .max(Comparator.<Map.Entry<Integer, Long>>comparingLong(Map.Entry::getValue)
                        .thenComparing(Map.Entry::getKey, Comparator.reverseOrder()))
                .map(Map.Entry::getKey)
                .ifPresent(hour -> this.mostClickedHour = hour);
    }
}

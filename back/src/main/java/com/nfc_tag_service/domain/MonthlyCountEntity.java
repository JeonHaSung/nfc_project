package com.nfc_tag_service.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "monthly_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MonthlyCountEntity {

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

    @Builder
    public MonthlyCountEntity(String id, String storeId, LocalDate date,
                              Long countValue, String mostClickedDayOfWeek) {
        this.id = id;
        this.storeId = storeId;
        this.date = date;
        this.countValue = countValue;
        this.mostClickedDayOfWeek = mostClickedDayOfWeek;
    }
}

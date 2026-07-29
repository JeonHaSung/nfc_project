package com.nfc_tag_service.domain;


import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "Weekly_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WeeklyCountEntity {

    @Id
    @Column(length = 30)
    private String id;

    @Column(name = "store_id", length = 20, nullable = false)
    private String storeId;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private Long countValue;

    @Column(nullable = false)
    private Long todayCount;

    @Column(nullable = false, length = 10)
    private String dayOfWeek;

    @Builder
    public WeeklyCountEntity(String id,String storeId,LocalDate date, Long countValue,Long todayCount, String dayOfWeek) {
        this.id = id;
        this.storeId = storeId;
        this.date = date;
        this.countValue = countValue;
        this.todayCount = todayCount;
        this.dayOfWeek = dayOfWeek;
    }
}
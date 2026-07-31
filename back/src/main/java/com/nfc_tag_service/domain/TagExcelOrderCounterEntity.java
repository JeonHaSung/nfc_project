package com.nfc_tag_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tag_excel_order_counters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TagExcelOrderCounterEntity {

    @Id
    @Column(name = "category", length = 10)
    private String category;

    @Column(name = "next_seq", nullable = false)
    private long nextSeq = 1L;

    @Version
    private Long version;

    public static TagExcelOrderCounterEntity initial(String category) {
        TagExcelOrderCounterEntity counter = new TagExcelOrderCounterEntity();
        counter.category = category;
        counter.nextSeq = 1L;
        return counter;
    }

    public long allocateNext() {
        long allocated = this.nextSeq;
        this.nextSeq = this.nextSeq + 1;
        return allocated;
    }
}

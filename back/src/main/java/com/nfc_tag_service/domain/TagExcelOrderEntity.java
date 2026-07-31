package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tag_excel_orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TagExcelOrderEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_seq", nullable = false)
    private long orderSeq;

    @Column(name = "file_name", nullable = false, length = 200)
    private String fileName;

    @Column(name = "storage_path", nullable = false, length = 300)
    private String storagePath;

    @Column(name = "storage_url", nullable = false, columnDefinition = "TEXT")
    private String storageUrl;

    @Column(name = "category", nullable = false, length = 10)
    private String category;

    @Column(name = "tag_count", nullable = false)
    private int tagCount;

    @Builder
    public TagExcelOrderEntity(
            long orderSeq,
            String fileName,
            String storagePath,
            String storageUrl,
            String category,
            int tagCount
    ) {
        this.orderSeq = orderSeq;
        this.fileName = fileName;
        this.storagePath = storagePath;
        this.storageUrl = storageUrl;
        this.category = category;
        this.tagCount = tagCount;
    }
}

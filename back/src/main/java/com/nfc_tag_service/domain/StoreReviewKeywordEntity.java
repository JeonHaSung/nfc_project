package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "store_review_keywords",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_store_review_keyword",
                columnNames = {"store_id", "keyword"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoreReviewKeywordEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "store_id", length = 100, nullable = false)
    private String storeId;

    @Column(name = "keyword", length = 100, nullable = false)
    private String keyword;

    @Builder
    public StoreReviewKeywordEntity(String storeId, String keyword) {
        this.storeId = storeId;
        this.keyword = keyword;
    }

    public void updateKeyword(String keyword) {
        this.keyword = keyword;
    }
}

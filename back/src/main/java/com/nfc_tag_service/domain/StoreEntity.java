package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.type.NumericBooleanConverter;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "stores")
@NoArgsConstructor
@Getter
public class StoreEntity extends BaseTimeEntity implements Persistable<String> {

    @Id
    @Column(name = "store_id", length = 20, nullable = false)
    private String id;

    @Column(name = "category", length = 30, nullable = false)
    private String category;

    @Column(name = "store_name", length = 30, nullable = false)
    private String name;

    @Column(name = "address", length = 50, nullable = false)
    private String address;

    @Column(name = "detail_address", length = 40, nullable = false)
    private String detailAddress;

    @Column(name = "description")
    private String description;

    @Column(name = "redirect_url", columnDefinition = "TEXT", nullable = false)
    private String redirectUrl;

    // 소프트딜리트
    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_deleted", columnDefinition = "smallint")
    private boolean del = false;

    public void delete() {
        this.del = true;
    }

    // ==========================================
    // Persistable 구현
    // ==========================================

    @Transient
    private boolean isNewFlag = true;

    @Override
    public String getId() {
        return this.id;
    }
    @Override
    public boolean isNew() {
        return this.isNewFlag;
    }

    @PostPersist
    public void markNotNew() {
        this.isNewFlag = false;
    }
    // ==========================================

    public void updateStore(String category, String name,
                               String address, String detailAddress,
                               String description) {
        this.category = category;
        this.address = address;
        this.detailAddress = detailAddress;
        this.name = name;
        this.description = description;
    }

    @Builder
    public StoreEntity(String category, String id, String name,
                       String address, String detailAddress, String description, String redirectUrl) {
        this.id = id;
        this.category = category;
        this.address = address;
        this.detailAddress = detailAddress;
        this.name = name;
        this.description = description;
        this.redirectUrl = redirectUrl;
    }
}
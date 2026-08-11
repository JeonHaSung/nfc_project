package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
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
    @Column(name = "store_id", length = 100)
    private String id;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "store_name", length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "redirect_url", columnDefinition = "TEXT")
    private String redirectUrl;

    @Column(name = "registered_by_id")
    private Long registeredById;

    @Column(name = "registered_by_name", length = 200)
    private String registeredByName;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_deleted", columnDefinition = "smallint")
    private boolean del = false;

    public void delete() {
        this.del = true;
    }

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

    public void updateStore(String category, String name, String description, String redirectUrl) {
        this.category = category;
        this.name = name;
        this.description = description;
        if (redirectUrl != null && !redirectUrl.isBlank()) {
            this.redirectUrl = redirectUrl;
        }
    }

    @Builder
    public StoreEntity(
            String category,
            String id,
            String name,
            String description,
            String redirectUrl,
            Long registeredById,
            String registeredByName
    ) {
        this.id = id;
        this.category = category;
        this.name = name;
        this.description = description;
        this.redirectUrl = redirectUrl;
        this.registeredById = registeredById;
        this.registeredByName = registeredByName;
    }
}

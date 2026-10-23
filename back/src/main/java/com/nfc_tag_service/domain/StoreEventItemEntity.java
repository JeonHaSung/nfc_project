package com.nfc_tag_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "store_event_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoreEventItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private StoreEventEntity event;

    @Column(name = "item_name", length = 120, nullable = false)
    private String name;

    @Column(name = "price", length = 50)
    private String price;

    @Column(name = "quantity", length = 50)
    private String quantity;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Builder
    public StoreEventItemEntity(String name, String price, String quantity, String imageUrl) {
        this.name = name;
        this.price = price;
        this.quantity = quantity;
        this.imageUrl = imageUrl;
    }

    void attach(StoreEventEntity event) {
        this.event = event;
    }
}

package com.nfc_tag_service.domain;

import com.nfc_tag_service.global.domain.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.type.NumericBooleanConverter;

@Entity
@Table(name = "notices")
@NoArgsConstructor
@Getter
public class NoticeEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notice_id")
    private Long id;

    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "is_selected", columnDefinition = "smallint")
    private Boolean selected = false;

    @Builder
    public NoticeEntity(String title, String body, boolean selected) {
        this.title = title;
        this.body = body;
        this.selected = selected;
    }

    public void update(String title, String body) {
        this.title = title;
        this.body = body;
    }

    public void select() {
        this.selected = true;
    }

    public void clearSelected() {
        this.selected = false;
    }

    public boolean isSelected() {
        return Boolean.TRUE.equals(this.selected);
    }
}

package com.nfc_tag_service.management.notice.repository;

import com.nfc_tag_service.domain.NoticeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface NoticeRepository extends JpaRepository<NoticeEntity, Long> {

    List<NoticeEntity> findAllByOrderByCreatedAtDesc();

    Optional<NoticeEntity> findFirstBySelectedTrue();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE NoticeEntity n SET n.selected = false WHERE n.selected = true")
    int clearAllSelected();
}

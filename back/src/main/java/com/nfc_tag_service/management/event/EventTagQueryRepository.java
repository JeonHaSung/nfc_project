package com.nfc_tag_service.management.event;

import com.nfc_tag_service.domain.TagEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * 이벤트 전용 태그 조회. 끝나면 이 패키지와 함께 삭제한다.
 */
public interface EventTagQueryRepository extends JpaRepository<TagEntity, String> {

    @Query("""
            SELECT t FROM TagEntity t
            WHERE t.id = :tagId
              AND t.del = false
              AND t.status = com.nfc_tag_service.domain.TagStatus.ASSIGNED
            """)
    Optional<TagEntity> findActiveAssignedById(@Param("tagId") String tagId);
}

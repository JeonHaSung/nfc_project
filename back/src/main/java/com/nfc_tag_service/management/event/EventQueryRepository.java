package com.nfc_tag_service.management.event;

import com.nfc_tag_service.domain.StoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * 이벤트 전용 조회. 끝나면 이 패키지와 함께 삭제한다.
 */
public interface EventQueryRepository extends JpaRepository<StoreEntity, String> {

    @Query("SELECT s.redirectUrl FROM StoreEntity s WHERE s.id = :storeId AND s.del = false")
    Optional<String> findStoreRedirectUrl(@Param("storeId") String storeId);
}

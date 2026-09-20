package com.nfc_tag_service.management.redirecting.repository;

import com.nfc_tag_service.domain.RedirectingTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RedirectingTypeRepository extends JpaRepository<RedirectingTypeEntity, Long> {

    List<RedirectingTypeEntity> findAllByOrderBySortOrderAscIdAsc();

    Optional<RedirectingTypeEntity> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT COALESCE(MAX(t.sortOrder), 0) FROM RedirectingTypeEntity t")
    int findMaxSortOrder();
}

package com.nfc_tag_service.management.admin.repository;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.domain.AdminRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminRepository extends JpaRepository<AdminEntity, Long> {
    Optional<AdminEntity> findByLoginIdAndDelFalse(String loginId);

    boolean existsByLoginIdAndDelFalse(String loginId);

    boolean existsByLoginIdAndIdNotAndDelFalse(String loginId, Long id);

    List<AdminEntity> findAllByRoleAndDelFalseOrderByIdAsc(AdminRole role);

    Optional<AdminEntity> findByIdAndDelFalse(Long id);
}

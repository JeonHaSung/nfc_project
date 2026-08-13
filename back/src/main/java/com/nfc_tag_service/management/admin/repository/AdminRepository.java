package com.nfc_tag_service.management.admin.repository;

import com.nfc_tag_service.domain.AdminEntity;
import com.nfc_tag_service.domain.AdminRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AdminRepository extends JpaRepository<AdminEntity, Long> {
    Optional<AdminEntity> findByLoginIdAndDelFalse(String loginId);

    boolean existsByLoginIdAndDelFalse(String loginId);

    boolean existsByLoginIdAndIdNotAndDelFalse(String loginId, Long id);

    boolean existsByEmailAndDelFalse(String email);

    boolean existsByEmailAndIdNotAndDelFalse(String email, Long id);

    boolean existsByLoginIdAndEmailAndDelFalse(String loginId, String email);

    List<AdminEntity> findAllByRoleAndDelFalseOrderByIdAsc(AdminRole role);

    List<AdminEntity> findAllByDelFalseOrderByIdAsc();

    Optional<AdminEntity> findByIdAndDelFalse(Long id);

    Optional<AdminEntity> findFirstByEmailAndDelFalseOrderByIdAsc(String email);

    Optional<AdminEntity> findByLoginIdAndEmailAndDelFalse(String loginId, String email);

    @Query("""
            select a from AdminEntity a
            where a.role = :role
              and a.del = false
              and a.suspended = false
              and (
                :keyword = ''
                or lower(a.loginId) like lower(concat('%', :keyword, '%'))
                or lower(a.name) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(a.phone, '')) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(a.email, '')) like lower(concat('%', :keyword, '%'))
              )
            """)
    Page<AdminEntity> searchActiveByRole(
            @Param("role") AdminRole role,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
            select a from AdminEntity a
            where a.del = false
              and (
                :keyword = ''
                or lower(a.loginId) like lower(concat('%', :keyword, '%'))
                or lower(a.name) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(a.phone, '')) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(a.email, '')) like lower(concat('%', :keyword, '%'))
              )
            """)
    Page<AdminEntity> searchAllActive(
            @Param("keyword") String keyword,
            Pageable pageable
    );
}

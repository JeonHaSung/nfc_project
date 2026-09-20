package com.nfc_tag_service.management.redirecting.repository;

import com.nfc_tag_service.domain.RedirectingEntity;
import com.nfc_tag_service.domain.RedirectingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RedirectingRepository extends JpaRepository<RedirectingEntity, Long> {

    List<RedirectingEntity> findByTagIdAndDelFalseOrderByIdAsc(String tagId);

    List<RedirectingEntity> findByTagIdInAndDelFalseOrderByIdAsc(Collection<String> tagIds);

    boolean existsByTagIdAndDelFalse(String tagId);

    Optional<RedirectingEntity> findByIdAndDelFalse(Long id);

    Optional<RedirectingEntity> findByIdAndTagIdAndDelFalse(Long id, String tagId);

    boolean existsByTagIdAndRedirectingTypeAndDelFalse(String tagId, RedirectingType redirectingType);

    void deleteByTagIdAndIdNotIn(String tagId, Collection<Long> ids);

    void deleteByTagId(String tagId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RedirectingEntity r WHERE r.tagId IN :tagIds")
    int deleteByTagIdIn(@Param("tagIds") Collection<String> tagIds);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE RedirectingEntity r SET r.del = true WHERE r.tagId IN :tagIds AND r.del = false")
    int softDeleteByTagIdIn(@Param("tagIds") Collection<String> tagIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RedirectingEntity r SET r.del = false WHERE r.tagId = :tagId AND r.del = true")
    int restoreByTagId(@Param("tagId") String tagId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RedirectingEntity r SET r.count = r.count + 1 WHERE r.id = :id AND r.del = false")
    int incrementCount(@Param("id") Long id);
}

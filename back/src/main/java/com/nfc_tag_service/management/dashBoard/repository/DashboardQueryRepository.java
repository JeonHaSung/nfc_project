package com.nfc_tag_service.management.dashBoard.repository;

import com.nfc_tag_service.domain.MonthlyCountEntity;
import com.nfc_tag_service.domain.SevenDayCountEntity;
import com.nfc_tag_service.domain.TagStatus;
import com.nfc_tag_service.domain.WeeklyCountEntity;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class DashboardQueryRepository {

    private final EntityManager entityManager;

    public long countActiveStores(Long registeredById) {
        if (registeredById == null) {
            return entityManager.createQuery(
                            "SELECT COUNT(s) FROM StoreEntity s WHERE s.del = false", Long.class)
                    .getSingleResult();
        }
        return entityManager.createQuery(
                        "SELECT COUNT(s) FROM StoreEntity s WHERE s.del = false AND s.registeredById = :registeredById",
                        Long.class)
                .setParameter("registeredById", registeredById)
                .getSingleResult();
    }

    public long countActiveTags(Long registeredById) {
        if (registeredById == null) {
            return entityManager.createQuery(
                            "SELECT COUNT(t) FROM TagEntity t WHERE t.del = false AND t.status = :status",
                            Long.class)
                    .setParameter("status", TagStatus.ASSIGNED)
                    .getSingleResult();
        }
        return entityManager.createQuery(
                        "SELECT COUNT(t) FROM TagEntity t, StoreEntity s " +
                                "WHERE t.storeId = s.id AND t.del = false AND s.del = false " +
                                "AND t.status = :status AND s.registeredById = :registeredById",
                        Long.class)
                .setParameter("status", TagStatus.ASSIGNED)
                .setParameter("registeredById", registeredById)
                .getSingleResult();
    }

    public List<Object[]> countActiveTagsGroupedByExperienceType(Long registeredById) {
        if (registeredById == null) {
            return entityManager.createQuery(
                            "SELECT t.experienceType, COUNT(t) FROM TagEntity t " +
                                    "WHERE t.del = false AND t.status = :status " +
                                    "GROUP BY t.experienceType",
                            Object[].class)
                    .setParameter("status", TagStatus.ASSIGNED)
                    .getResultList();
        }
        return entityManager.createQuery(
                        "SELECT t.experienceType, COUNT(t) FROM TagEntity t, StoreEntity s " +
                                "WHERE t.storeId = s.id AND t.del = false AND s.del = false " +
                                "AND t.status = :status AND s.registeredById = :registeredById " +
                                "GROUP BY t.experienceType",
                        Object[].class)
                .setParameter("status", TagStatus.ASSIGNED)
                .setParameter("registeredById", registeredById)
                .getResultList();
    }

    public boolean existsActiveStore(String storeId) {
        Long count = entityManager.createQuery(
                        "SELECT COUNT(s) FROM StoreEntity s " +
                                "WHERE s.id = :storeId AND s.del = false",
                        Long.class)
                .setParameter("storeId", storeId)
                .getSingleResult();
        return count > 0;
    }

    public long sumActiveTagHitCount(String storeId) {
        return entityManager.createQuery(
                        "SELECT COALESCE(SUM(t.hitCount), 0L) FROM TagEntity t " +
                                "WHERE t.storeId = :storeId AND t.del = false",
                        Long.class)
                .setParameter("storeId", storeId)
                .getSingleResult();
    }

    public List<WeeklyCountEntity> findDailyCounts(
            String storeId, LocalDate startDate, LocalDate endDate) {
        return entityManager.createQuery(
                        "SELECT w FROM WeeklyCountEntity w " +
                                "WHERE w.storeId = :storeId " +
                                "AND w.date BETWEEN :startDate AND :endDate " +
                                "AND w.id = (SELECT MAX(w2.id) FROM WeeklyCountEntity w2 " +
                                "WHERE w2.storeId = w.storeId AND w2.date = w.date) " +
                                "ORDER BY w.date ASC",
                        WeeklyCountEntity.class)
                .setParameter("storeId", storeId)
                .setParameter("startDate", startDate)
                .setParameter("endDate", endDate)
                .getResultList();
    }

    public List<SevenDayCountEntity> findWeeklyCounts(
            String storeId, LocalDate startDate, LocalDate endDate) {
        return entityManager.createQuery(
                        "SELECT s FROM SevenDayCountEntity s " +
                                "WHERE s.storeId = :storeId " +
                                "AND s.date BETWEEN :startDate AND :endDate " +
                                "AND s.id = (SELECT MAX(s2.id) FROM SevenDayCountEntity s2 " +
                                "WHERE s2.storeId = s.storeId AND s2.date = s.date) " +
                                "ORDER BY s.date ASC",
                        SevenDayCountEntity.class)
                .setParameter("storeId", storeId)
                .setParameter("startDate", startDate)
                .setParameter("endDate", endDate)
                .getResultList();
    }

    public List<MonthlyCountEntity> findLatestMonthlyCounts(String storeId, int limit) {
        return entityManager.createQuery(
                        "SELECT m FROM MonthlyCountEntity m " +
                                "WHERE m.storeId = :storeId " +
                                "AND m.id = (SELECT MAX(m2.id) FROM MonthlyCountEntity m2 " +
                                "WHERE m2.storeId = m.storeId AND m2.date = m.date) " +
                                "ORDER BY m.date DESC",
                        MonthlyCountEntity.class)
                .setParameter("storeId", storeId)
                .setMaxResults(limit)
                .getResultList();
    }
}

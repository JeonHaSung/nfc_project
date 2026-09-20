package com.nfc_tag_service.management.redirecting;

import com.nfc_tag_service.domain.RedirectingTypeEntity;
import com.nfc_tag_service.management.redirecting.repository.RedirectingRepository;
import com.nfc_tag_service.management.redirecting.repository.RedirectingTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RedirectingTypeSeedService {

    private final RedirectingTypeRepository redirectingTypeRepository;
    private final RedirectingRepository redirectingRepository;

    @Transactional
    public void seedAndBackfill() {
        seedDefaults();
        backfillRedirectings();
    }

    private void seedDefaults() {
        seed("NAVER_RECEIPT_REVIEW", "#22c55e", 1, Map.of(
                RedirectingLocales.KO, "네이버 영수증 리뷰 남기기",
                RedirectingLocales.EN, "Leave a Naver receipt review",
                RedirectingLocales.JA, "ネイバーレシートレビューを書く",
                RedirectingLocales.ZH, "撰写 Naver 小票评价",
                RedirectingLocales.FR, "Laisser un avis ticket Naver"
        ));
        seed("GOOGLE_MAPS_REVIEW", "#3b82f6", 2, Map.of(
                RedirectingLocales.KO, "구글 지도 (Google Maps) 리뷰",
                RedirectingLocales.EN, "Google Maps review",
                RedirectingLocales.JA, "Google マップのレビュー",
                RedirectingLocales.ZH, "Google 地图评价",
                RedirectingLocales.FR, "Avis Google Maps"
        ));
        seed("KAKAO_MAP_REVIEW", "#facc15", 3, Map.of(
                RedirectingLocales.KO, "카카오맵 (Kakao Map) 리뷰",
                RedirectingLocales.EN, "Kakao Map review",
                RedirectingLocales.JA, "Kakao Map のレビュー",
                RedirectingLocales.ZH, "Kakao Map 评价",
                RedirectingLocales.FR, "Avis Kakao Map"
        ));
        seed("INSTAGRAM_OFFICIAL", "#ec4899", 4, Map.of(
                RedirectingLocales.KO, "인스타그램 공식 계정 방문",
                RedirectingLocales.EN, "Visit official Instagram",
                RedirectingLocales.JA, "公式Instagramを見る",
                RedirectingLocales.ZH, "访问官方 Instagram",
                RedirectingLocales.FR, "Visiter le compte Instagram officiel"
        ));
    }

    private void seed(String code, String color, int sortOrder, Map<String, String> labels) {
        if (redirectingTypeRepository.existsByCode(code)) {
            return;
        }
        redirectingTypeRepository.save(RedirectingTypeEntity.create(
                code,
                color,
                sortOrder,
                new LinkedHashMap<>(labels)
        ));
    }

    private void backfillRedirectings() {
        for (RedirectingTypeEntity type : redirectingTypeRepository.findAll()) {
            redirectingRepository.backfillTypeId(type.getId(), type.getCode());
        }
    }
}

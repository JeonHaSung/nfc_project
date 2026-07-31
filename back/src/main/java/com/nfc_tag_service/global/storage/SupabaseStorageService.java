package com.nfc_tag_service.global.storage;

import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SupabaseStorageService {

    private final String supabaseUrl;
    private final String serviceKey;
    private final String bucketName;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    public SupabaseStorageService(
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.service-key}") String serviceKey,
            @Value("${supabase.bucket-name:tag-images}") String bucketName
    ) {
        this.supabaseUrl = trimTrailingSlash(supabaseUrl);
        this.serviceKey = serviceKey;
        this.bucketName = bucketName;
    }

    public boolean isConfigured() {
        return supabaseUrl != null && !supabaseUrl.isBlank()
                && serviceKey != null && !serviceKey.isBlank()
                && bucketName != null && !bucketName.isBlank();
    }

    public String upload(String objectPath, byte[] content, String contentType) {
        if (!isConfigured()) {
            log.warn("Supabase storage is not configured");
            throw new CustomException(ErrorCode.STORAGE_UPLOAD_FAILED);
        }

        String encodedPath = encodePath(objectPath);
        URI uri = URI.create(supabaseUrl + "/storage/v1/object/" + bucketName + "/" + encodedPath);
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "Bearer " + serviceKey)
                .header("apikey", serviceKey)
                .header("Content-Type", contentType)
                .header("x-upsert", "true")
                .POST(HttpRequest.BodyPublishers.ofByteArray(content))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Supabase upload failed: status={}, bucket={}, path={}, body={}",
                        response.statusCode(), bucketName, objectPath, response.body());
                throw new CustomException(ErrorCode.STORAGE_UPLOAD_FAILED);
            }
            return supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + encodedPath;
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Supabase upload interrupted: bucket={}, path={}", bucketName, objectPath, e);
            throw new CustomException(ErrorCode.STORAGE_UPLOAD_FAILED);
        }
    }

    public void delete(String objectPath) {
        if (!isConfigured() || objectPath == null || objectPath.isBlank()) {
            return;
        }
        String encodedPath = encodePath(objectPath);
        URI uri = URI.create(supabaseUrl + "/storage/v1/object/" + bucketName + "/" + encodedPath);
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(30))
                .header("Authorization", "Bearer " + serviceKey)
                .header("apikey", serviceKey)
                .DELETE()
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Supabase delete failed: status={}, bucket={}, path={}, body={}",
                        response.statusCode(), bucketName, objectPath, response.body());
            }
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Supabase delete interrupted: bucket={}, path={}", bucketName, objectPath, e);
            throw new CustomException(ErrorCode.STORAGE_UPLOAD_FAILED);
        }
    }

    public byte[] download(String objectPath) {
        if (!isConfigured()) {
            throw new CustomException(ErrorCode.STORAGE_UPLOAD_FAILED);
        }
        String encodedPath = encodePath(objectPath);
        URI uri = URI.create(supabaseUrl + "/storage/v1/object/" + bucketName + "/" + encodedPath);
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "Bearer " + serviceKey)
                .header("apikey", serviceKey)
                .GET()
                .build();
        try {
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Supabase download failed: status={}, bucket={}, path={}",
                        response.statusCode(), bucketName, objectPath);
                throw new CustomException(ErrorCode.STORAGE_UPLOAD_FAILED);
            }
            return response.body();
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Supabase download interrupted: bucket={}, path={}", bucketName, objectPath, e);
            throw new CustomException(ErrorCode.STORAGE_UPLOAD_FAILED);
        }
    }

    private static String encodePath(String objectPath) {
        return Arrays.stream(objectPath.split("/"))
                .map(part -> URLEncoder.encode(part, StandardCharsets.UTF_8).replace("+", "%20"))
                .collect(Collectors.joining("/"));
    }

    private static String trimTrailingSlash(String value) {
        if (value == null) {
            return null;
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}

package com.nfc_tag_service.management.admin.service;

import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ResendMailService {

    private static final URI RESEND_EMAILS_URI = URI.create("https://api.resend.com/emails");

    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String fromEmail;
    private final HttpClient httpClient;
    private final String logoBase64;

    public ResendMailService(
            ObjectMapper objectMapper,
            @Value("${resend.api-key:}") String apiKey,
            @Value("${resend.from-email:}") String fromEmail
    ) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.logoBase64 = loadLogoBase64();
    }

    public void sendVerificationCode(String recipient, String code) {
        send(
                recipient,
                "[RETAP] 이메일 인증 코드",
                emailTemplate(
                        "이메일 인증",
                        "RETAP 파트너 계정 요청을 확인하기 위한 인증번호입니다.",
                        "인증번호",
                        html(code),
                        "인증번호는 10분 동안 유효합니다.",
                        "본인이 요청하지 않았다면 이 메일을 무시해 주세요."
                )
        );
    }

    public void sendTemporaryPassword(String recipient, String temporaryPassword) {
        send(
                recipient,
                "[RETAP] 임시 비밀번호",
                emailTemplate(
                        "임시 비밀번호 발급",
                        "요청하신 RETAP 계정의 임시 비밀번호가 발급되었습니다.",
                        "임시 비밀번호",
                        html(temporaryPassword),
                        "임시 비밀번호로 로그인한 뒤 마이페이지에서 새 비밀번호로 변경해 주세요.",
                        "본인이 요청하지 않았다면 관리자에게 문의해 주세요."
                )
        );
    }

    private void send(String recipient, String subject, String htmlContent) {
        if (apiKey.isBlank() || fromEmail.isBlank()) {
            throw new CustomException(ErrorCode.EMAIL_DELIVERY_FAILED);
        }

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("from", fromEmail);
            payload.put("to", List.of(recipient));
            payload.put("subject", subject);
            payload.put("html", htmlContent);
            payload.put("attachments", List.of(Map.of(
                    "filename", "retap-logo.png",
                    "content", logoBase64,
                    "content_type", "image/png",
                    "content_id", "retap-logo"
            )));

            String body = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder(RESEND_EMAILS_URI)
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<Void> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.discarding()
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new CustomException(ErrorCode.EMAIL_DELIVERY_FAILED);
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new CustomException(ErrorCode.EMAIL_DELIVERY_FAILED);
        } catch (CustomException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new CustomException(ErrorCode.EMAIL_DELIVERY_FAILED);
        }
    }

    private String emailTemplate(
            String title,
            String description,
            String valueLabel,
            String value,
            String primaryNotice,
            String securityNotice
    ) {
        return """
                <!doctype html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>%s</title>
                </head>
                <body style="margin:0;padding:0;background:#f5f1f1;font-family:Arial,'Noto Sans KR',sans-serif;color:#2b2021;">
                  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">%s</div>
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f1f1;">
                    <tr>
                      <td align="center" style="padding:36px 16px;">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0"
                               style="max-width:560px;background:#ffffff;border:1px solid #eadfe0;border-radius:18px;overflow:hidden;box-shadow:0 16px 45px rgba(58,22,25,.10);">
                          <tr>
                            <td style="height:6px;background:#a71920;font-size:0;line-height:0;">&nbsp;</td>
                          </tr>
                          <tr>
                            <td style="padding:28px 38px 18px;border-bottom:1px solid #f0e8e8;">
                              <img src="cid:retap-logo" alt="RETAP" width="150"
                                   style="display:block;width:150px;max-width:100%%;height:auto;border:0;">
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:34px 38px 12px;">
                              <div style="margin-bottom:9px;color:#a71920;font-size:11px;font-weight:700;letter-spacing:1.5px;">
                                RETAP ACCOUNT
                              </div>
                              <h1 style="margin:0 0 14px;color:#24191a;font-size:25px;line-height:1.35;letter-spacing:-.6px;">
                                %s
                              </h1>
                              <p style="margin:0;color:#6f6263;font-size:14px;line-height:1.75;">%s</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 38px 24px;">
                              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0"
                                     style="background:#fff6f6;border:1px solid #efd5d7;border-radius:14px;">
                                <tr>
                                  <td align="center" style="padding:22px 18px;">
                                    <div style="margin-bottom:10px;color:#917f80;font-size:11px;font-weight:700;">%s</div>
                                    <div style="color:#a71920;font-family:Consolas,'Courier New',monospace;font-size:28px;font-weight:700;line-height:1.3;letter-spacing:4px;word-break:break-all;">
                                      %s
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 38px 34px;">
                              <p style="margin:0 0 8px;color:#514546;font-size:13px;line-height:1.7;">%s</p>
                              <p style="margin:0;color:#9a8d8e;font-size:12px;line-height:1.65;">%s</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 38px;background:#2b2021;color:#cbbfc0;font-size:11px;line-height:1.7;">
                              이 메일은 RETAP 계정 보안을 위해 자동 발송되었습니다.<br>
                              회신하지 마시고, 인증 정보는 다른 사람과 공유하지 마세요.
                            </td>
                          </tr>
                        </table>
                        <p style="margin:18px 0 0;color:#a99d9e;font-size:10px;">© 2026 RETAP. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                html(title),
                html(description),
                html(title),
                html(description),
                html(valueLabel),
                value,
                html(primaryNotice),
                html(securityNotice)
        );
    }

    private String loadLogoBase64() {
        try {
            ClassPathResource logo = new ClassPathResource("static/retap-email-logo.png");
            return Base64.getEncoder().encodeToString(logo.getContentAsByteArray());
        } catch (IOException ex) {
            throw new IllegalStateException("RETAP email logo could not be loaded.", ex);
        }
    }

    private String html(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}

package com.nfc_tag_service.management.admin.service;

import com.nfc_tag_service.global.exception.CustomException;
import com.nfc_tag_service.global.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.imageio.ImageIO;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class LoginCaptchaService {

    private static final int CODE_LENGTH = 6;
    private static final Duration TTL = Duration.ofMinutes(5);
    private static final int WIDTH = 168;
    private static final int HEIGHT = 52;

    private final ConcurrentHashMap<String, CaptchaEntry> store = new ConcurrentHashMap<>();

    public CaptchaIssue issue() {
        cleanupExpired();
        String id = UUID.randomUUID().toString();
        String code = randomDigits(CODE_LENGTH);
        store.put(id, new CaptchaEntry(code, Instant.now().plus(TTL)));
        return new CaptchaIssue(id, "data:image/png;base64," + Base64.getEncoder().encodeToString(renderPng(code)));
    }

    public void verifyAndConsume(String captchaId, String captchaCode) {
        if (!StringUtils.hasText(captchaId) || !StringUtils.hasText(captchaCode)) {
            throw new CustomException(ErrorCode.INVALID_CAPTCHA);
        }
        CaptchaEntry entry = store.remove(captchaId.trim());
        if (entry == null || entry.expiresAt().isBefore(Instant.now())) {
            throw new CustomException(ErrorCode.INVALID_CAPTCHA);
        }
        String answer = captchaCode.trim().replaceAll("\\s+", "");
        if (!entry.code().equals(answer)) {
            throw new CustomException(ErrorCode.INVALID_CAPTCHA);
        }
    }

    private void cleanupExpired() {
        Instant now = Instant.now();
        Iterator<Map.Entry<String, CaptchaEntry>> iterator = store.entrySet().iterator();
        while (iterator.hasNext()) {
            if (iterator.next().getValue().expiresAt().isBefore(now)) {
                iterator.remove();
            }
        }
    }

    private static String randomDigits(int length) {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            builder.append(random.nextInt(10));
        }
        return builder.toString();
    }

    private static byte[] renderPng(String code) {
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.setColor(new Color(248, 249, 252));
            graphics.fillRect(0, 0, WIDTH, HEIGHT);

            ThreadLocalRandom random = ThreadLocalRandom.current();
            for (int i = 0; i < 48; i++) {
                graphics.setColor(new Color(random.nextInt(70, 140), random.nextInt(70, 140), random.nextInt(70, 140), 90));
                graphics.fillOval(random.nextInt(WIDTH), random.nextInt(HEIGHT), 2, 2);
            }
            for (int i = 0; i < 5; i++) {
                graphics.setStroke(new BasicStroke(1.1f));
                graphics.setColor(new Color(random.nextInt(90, 160), random.nextInt(90, 160), random.nextInt(90, 160), 110));
                graphics.drawLine(
                        random.nextInt(WIDTH),
                        random.nextInt(HEIGHT),
                        random.nextInt(WIDTH),
                        random.nextInt(HEIGHT)
                );
            }

            graphics.setFont(new Font("SansSerif", Font.BOLD, 28));
            int x = 14;
            for (int i = 0; i < code.length(); i++) {
                AffineTransform original = graphics.getTransform();
                double angle = Math.toRadians(random.nextInt(-22, 23));
                int y = 34 + random.nextInt(-4, 5);
                graphics.rotate(angle, x + 8, y);
                graphics.setColor(new Color(random.nextInt(20, 70), random.nextInt(20, 70), random.nextInt(20, 70)));
                graphics.drawString(String.valueOf(code.charAt(i)), x, y);
                graphics.setTransform(original);
                x += 24;
            }
        } finally {
            graphics.dispose();
        }

        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", output);
            return output.toByteArray();
        } catch (Exception exception) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public record CaptchaIssue(String captchaId, String imageDataUrl) {
    }

    private record CaptchaEntry(String code, Instant expiresAt) {
    }
}

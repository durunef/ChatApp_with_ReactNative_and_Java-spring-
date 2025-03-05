package com.example.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class FriendTokenUtil {
    private static final long REQUEST_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days
    private static final Key REQUEST_SECRET_KEY = new SecretKeySpec(
        System.getenv("FRIEND_TOKEN_SECRET").getBytes(),
        SignatureAlgorithm.HS256.getJcaName()
);

    public String generateRequestToken(String senderId, String receiverId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("senderId", senderId);
        claims.put("receiverId", receiverId);
        claims.put("requestTime", new Date().getTime());
        
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REQUEST_EXPIRATION))
                .signWith(REQUEST_SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims validateRequestToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(REQUEST_SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractSenderId(String token) {
        Claims claims = validateRequestToken(token);
        return claims.get("senderId", String.class);
    }

    public String extractReceiverId(String token) {
        Claims claims = validateRequestToken(token);
        return claims.get("receiverId", String.class);
    }
} 
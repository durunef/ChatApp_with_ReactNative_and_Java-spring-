package com.example.security;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class EncryptionUtil {
    // Use a 16, 24, or 32 byte key for AES-128, AES-192, or AES-256
private static final String SECRET_KEY = "${ENCRYPTION_KEY}"; // exactly 16 characters    private static final String ALGORITHM = "AES/ECB/PKCS5Padding";
    private final SecretKeySpec secretKeySpec;

    public EncryptionUtil() {
        byte[] key = SECRET_KEY.getBytes(StandardCharsets.UTF_8);
        this.secretKeySpec = new SecretKeySpec(key, "AES");
    }

    public String encrypt(String data) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec);
            
            byte[] encryptedBytes = cipher.doFinal(data.getBytes());
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            e.printStackTrace(); // Log the full stack trace
            System.out.println("Encryption error: " + e.getMessage());
            throw new RuntimeException("Failed to encrypt data", e);
        }
    }

    public String decrypt(String encryptedData) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
            
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedData));
            return new String(decryptedBytes);
        } catch (Exception e) {
            e.printStackTrace(); // Log the full stack trace
            System.out.println("Decryption error: " + e.getMessage());
            throw new RuntimeException("Failed to decrypt data", e);
        }
    }
}
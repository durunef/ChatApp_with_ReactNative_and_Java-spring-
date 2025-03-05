package com.example.security;

import org.springframework.stereotype.Component;
import java.util.Base64;

@Component
public class PasswordUtil {
    
    public String encrypt(String password) {
        return Base64.getEncoder().encodeToString(password.getBytes());
    }
    
    public String decrypt(String encodedPassword) {
        byte[] decodedBytes = Base64.getDecoder().decode(encodedPassword);
        return new String(decodedBytes);
    }
} 
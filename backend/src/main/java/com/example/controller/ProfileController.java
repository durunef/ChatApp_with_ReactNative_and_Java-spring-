package com.example.controller;

import com.example.model.User;
import com.example.repository.UserRepository;
import com.example.security.PasswordUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/profile")
@CrossOrigin
public class ProfileController {

    private final UserRepository userRepository;
    private final PasswordUtil passwordUtil;

    public ProfileController(UserRepository userRepository, PasswordUtil passwordUtil) {
        this.userRepository = userRepository;
        this.passwordUtil = passwordUtil;
    }

    @GetMapping
    public ResponseEntity<?> getUserProfile(@RequestParam String userId) {
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User not found"));
            }

            User user = userOptional.get();
            return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "email", user.getEmail(),
                "friendCount", user.getFriendIds().size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> updates) {
        try {
            String userId = updates.get("userId");
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User not found"));
            }

            User user = userOptional.get();

            // Update basic info if provided
            if (updates.containsKey("username")) {
                // Check if username is already taken
                if (!user.getUsername().equals(updates.get("username")) && 
                    userRepository.findByUsername(updates.get("username")).isPresent()) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Username already taken"));
                }
                user.setUsername(updates.get("username"));
            }
            if (updates.containsKey("firstName")) {
                user.setFirstName(updates.get("firstName"));
            }
            if (updates.containsKey("lastName")) {
                user.setLastName(updates.get("lastName"));
            }
            if (updates.containsKey("email")) {
                // Check if email is already taken
                if (!user.getEmail().equals(updates.get("email")) && 
                    userRepository.findByEmail(updates.get("email")).isPresent()) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email already taken"));
                }
                user.setEmail(updates.get("email"));
            }

            // Save updated user
            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully",
                "username", user.getUsername(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "email", user.getEmail(),
                "friendCount", user.getFriendIds().size()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> passwordUpdate) {
        try {
            String userId = passwordUpdate.get("userId");
            String currentPassword = passwordUpdate.get("currentPassword");
            String newPassword = passwordUpdate.get("newPassword");

            if (userId == null || currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing required fields"));
            }

            Optional<User> userOptional = userRepository.findById(userId);
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User not found"));
            }

            User user = userOptional.get();

            // Verify current password
            if (!passwordUtil.decrypt(user.getPassword()).equals(currentPassword)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Current password is incorrect"));
            }

            // Update password
            user.setPassword(passwordUtil.encrypt(newPassword));
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
} 
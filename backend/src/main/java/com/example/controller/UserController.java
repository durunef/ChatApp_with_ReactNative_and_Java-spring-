package com.example.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.model.User;
import com.example.repository.UserRepository;
import com.example.security.EncryptionUtil;
import com.example.security.JwtUtil;

@RestController
public class UserController {
    
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final EncryptionUtil encryptionUtil;

    public UserController(
        UserRepository userRepository, 
        JwtUtil jwtUtil,
        EncryptionUtil encryptionUtil
    ) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.encryptionUtil = encryptionUtil;
    }

    @PostMapping("/login")
    @CrossOrigin
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            String email = loginRequest.get("email");
            String rawPassword = loginRequest.get("password");
            
            System.out.println("Login attempt for email: " + email);

            Optional<User> storedUser = userRepository.findByEmail(email);
            
            if (storedUser.isEmpty()) {
                System.out.println("User not found with email: " + email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
            }

            User user = storedUser.get();
            String encryptedAttempt = encryptionUtil.encrypt(rawPassword);
            
            System.out.println("Password comparison:");
            System.out.println("Raw password provided: " + rawPassword);
            System.out.println("Encrypted attempt: " + encryptedAttempt);
            System.out.println("Stored encrypted: " + user.getPassword());
            
            if (encryptedAttempt.equals(user.getPassword())) {
                System.out.println("Password match successful!");
                String token = jwtUtil.generateToken(email);
                
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("email", user.getEmail());
                userMap.put("username", user.getUsername());
                userMap.put("firstName", user.getFirstName());
                userMap.put("lastName", user.getLastName());
                userMap.put("friendIds", user.getFriendIds());

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("token", token);
                response.put("user", userMap);
                
                return ResponseEntity.ok(response);
            } else {
                System.out.println("Password match failed!");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
            }
                
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Login error: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    @CrossOrigin
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            System.out.println("Registration attempt for email: " + user.getEmail());

            // Check if email already exists
            if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("status", "error", 
                                "message", "Email already exists"));
            }

            // Check if username already exists
            if (userRepository.findByUsername(user.getUsername()).isPresent()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("status", "error", 
                                "message", "Username already exists"));
            }

            // Encrypt password before saving
            String encryptedPassword = encryptionUtil.encrypt(user.getPassword());
            System.out.println("Original password: " + user.getPassword());
            System.out.println("Encrypted password: " + encryptedPassword);
            user.setPassword(encryptedPassword);

            // Initialize friendIds if null
            if (user.getFriendIds() == null) {
                user.setFriendIds(new ArrayList<>());
            }

            User savedUser = userRepository.save(user);
            String token = jwtUtil.generateToken(user.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "User registered successfully");
            response.put("token", token);
            response.put("user", Map.of(
                "id", savedUser.getId(),
                "email", savedUser.getEmail(),
                "username", savedUser.getUsername(),
                "firstName", savedUser.getFirstName(),
                "lastName", savedUser.getLastName(),
                "friendIds", savedUser.getFriendIds()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Registration error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(Map.of("status", "error", 
                            "message", e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        System.out.println("\n=== Token Validation ===");
        System.out.println("Token: " + token);
        
        boolean isValid = jwtUtil.validateToken(token);
        if (isValid) {
            String email = jwtUtil.extractUsername(token);
            System.out.println("Validation Status: VALID");
            System.out.println("Email: " + email);
            return ResponseEntity.ok("Token is valid for user: " + email);
        }
        
        System.out.println("Validation Status: INVALID");
        return ResponseEntity.badRequest().body("Invalid token");
    }

    @GetMapping("/users")
    @CrossOrigin
    public ResponseEntity<?> getAllUsers(@RequestParam String currentUserId) {
        try {
            System.out.println("Fetching all non-friend users for user: " + currentUserId);
            
            Optional<User> currentUser = userRepository.findById(currentUserId);
            if (currentUser.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Current user not found"
                ));
            }

            List<String> friendIds = currentUser.get().getFriendIds();
            System.out.println("Current user's friends: " + friendIds);

            List<Map<String, Object>> users = userRepository.findAll().stream()
                .filter(user -> !user.getId().equals(currentUserId)) // Exclude current user
                .filter(user -> !friendIds.contains(user.getId())) // Exclude friends
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getId());
                    userMap.put("username", user.getUsername());
                    userMap.put("email", user.getEmail());
                    userMap.put("firstName", user.getFirstName());
                    userMap.put("lastName", user.getLastName());
                    return userMap;
                })
                .collect(Collectors.toList());

            System.out.println("Found " + users.size() + " non-friend users");

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "users", users
            ));
        } catch (Exception e) {
            System.err.println("Error fetching users: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to fetch users: " + e.getMessage()
            ));
        }
    }
}


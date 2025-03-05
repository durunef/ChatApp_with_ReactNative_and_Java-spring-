package com.example.controller;

import com.example.model.FriendRequest;
import com.example.model.User;
import com.example.repository.FriendRequestRepository;
import com.example.repository.UserRepository;
import com.example.security.FriendTokenUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Objects;


@RestController
@RequestMapping("/friends")
public class FriendController {

    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final FriendTokenUtil friendTokenUtil;

    public FriendController(
        UserRepository userRepository,
        FriendRequestRepository friendRequestRepository,
        FriendTokenUtil friendTokenUtil
    ) {
        this.userRepository = userRepository;
        this.friendRequestRepository = friendRequestRepository;
        this.friendTokenUtil = friendTokenUtil;
    }

    @PostMapping("/add")
    @CrossOrigin
    public ResponseEntity<?> sendFriendRequest(@RequestBody Map<String, String> request) {
        try {
            String senderId = request.get("senderId");
            String receiverId = request.get("receiverId");
            
            System.out.println("Received friend request: senderId=" + senderId + ", receiverId=" + receiverId);

            if (senderId == null || receiverId == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "senderId and receiverId are required"));
            }

            // Check if users exist
            Optional<User> sender = userRepository.findById(senderId);
            Optional<User> receiver = userRepository.findById(receiverId);

            if (sender.isEmpty() || receiver.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid sender or receiver ID"));
            }

            // Check if they're already friends
            if (sender.get().getFriendIds().contains(receiverId)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Users are already friends"));
            }

            // Check for existing pending request
            List<FriendRequest> existingRequests = friendRequestRepository
                .findBySenderIdAndReceiverId(senderId, receiverId);
            
            if (!existingRequests.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Friend request already sent"));
            }

            // Create and save friend request ONLY to friend_requests collection
            FriendRequest friendRequest = new FriendRequest(senderId, receiverId);
            friendRequest.setStatus("PENDING");
            friendRequest.setRequestToken(friendTokenUtil.generateRequestToken(senderId, receiverId));
            friendRequestRepository.save(friendRequest);

            return ResponseEntity.ok(Map.of("message", "Friend request sent successfully"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to send friend request: " + e.getMessage()));
        }
    }

    @PostMapping("/accept")
    @CrossOrigin
    public ResponseEntity<?> acceptFriendRequest(@RequestBody Map<String, String> request) {
        try {
            String requestToken = request.get("requestToken");
            String userId = request.get("userId");
            
            System.out.println("Accepting friend request: token=" + requestToken + ", userId=" + userId);

            if (requestToken == null || userId == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "requestToken and userId are required"));
            }

            Optional<FriendRequest> friendRequest = friendRequestRepository.findByRequestToken(requestToken);
            
            if (friendRequest.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Friend request not found"));
            }

            FriendRequest fr = friendRequest.get();
            
            // Verify request hasn't been processed
            if (!"PENDING".equals(fr.getStatus())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Request already processed"));
            }

            // Add users as friends
            Optional<User> receiver = userRepository.findById(userId);
            Optional<User> sender = userRepository.findById(fr.getSenderId());

            if (receiver.isEmpty() || sender.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User not found"));
            }

            User receiverUser = receiver.get();
            User senderUser = sender.get();

            // Add to friends lists
            if (!receiverUser.getFriendIds().contains(senderUser.getId())) {
                receiverUser.getFriendIds().add(senderUser.getId());
            }
            if (!senderUser.getFriendIds().contains(receiverUser.getId())) {
                senderUser.getFriendIds().add(receiverUser.getId());
            }

            // Save users with updated friend lists
            userRepository.save(receiverUser);
            userRepository.save(senderUser);

            // Delete only the friend request
            friendRequestRepository.deleteById(fr.getId());

            return ResponseEntity.ok(Map.of(
                "message", "Friend request accepted",
                "requestToken", requestToken  // Return the token so frontend knows which request was processed
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reject")
    @CrossOrigin
    public ResponseEntity<?> rejectFriendRequest(@RequestBody Map<String, String> request) {
        try {
            String requestToken = request.get("requestToken");
            
            System.out.println("Rejecting friend request: token=" + requestToken);

            if (requestToken == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "requestToken is required"));
            }

            Optional<FriendRequest> friendRequest = friendRequestRepository.findByRequestToken(requestToken);
            
            if (friendRequest.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Friend request not found"));
            }

            FriendRequest fr = friendRequest.get();
            
            // Verify request hasn't been processed
            if (!"PENDING".equals(fr.getStatus())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Request already processed"));
            }

            // Delete only the friend request
            friendRequestRepository.deleteById(fr.getId());

            return ResponseEntity.ok(Map.of(
                "message", "Friend request rejected",
                "requestToken", requestToken  // Return the token so frontend knows which request was processed
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @CrossOrigin
    public ResponseEntity<?> getFriendList(@RequestParam String userId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            List<Map<String, String>> friends = user.getFriendIds().stream()
                .map(friendId -> userRepository.findById(friendId))
                .filter(Optional::isPresent)
                .map(friend -> Map.of(
                    "id", friend.get().getId(),
                    "username", friend.get().getUsername(),
                    "email", friend.get().getEmail()
                ))
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("friends", friends));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/pending")
    @CrossOrigin
    public ResponseEntity<?> getPendingRequests(@RequestParam String userId) {
        try {
            System.out.println("Received request for pending friends. UserId: " + userId);
            
            // Log the user lookup attempt
            Optional<User> userOptional = userRepository.findById(userId);
            System.out.println("User found: " + userOptional.isPresent());
            
            if (userOptional.isEmpty()) {
                String error = "User not found with ID: " + userId;
                System.err.println(error);
                return ResponseEntity.badRequest().body(Map.of("error", error));
            }

            // Log the friend requests lookup
            List<FriendRequest> pendingRequests = friendRequestRepository
                .findByStatusAndSenderIdOrReceiverId("PENDING", userId, userId);
            System.out.println("Found " + pendingRequests.size() + " pending requests");
            
            // Log each request for debugging
            pendingRequests.forEach(request -> 
                System.out.println("Request: " + request.getId() + 
                                 " from: " + request.getSenderId() + 
                                 " to: " + request.getReceiverId()));

            // Create the response
            Map<String, Object> response = Map.of("requests", 
                pendingRequests.stream()
                    .map(request -> {
                        boolean isUserSender = request.getSenderId().equals(userId);
                        String otherUserId = isUserSender ? request.getReceiverId() : request.getSenderId();
                        User otherUser = userRepository.findById(otherUserId).orElse(null);
                        
                        if (otherUser == null) {
                            System.err.println("Could not find other user with ID: " + otherUserId);
                            return null;
                        }
                        
                        return Map.of(
                            "requestToken", request.getRequestToken(),
                            "type", isUserSender ? "sent" : "received",
                            "otherUser", Map.of(
                                "id", otherUser.getId(),
                                "username", otherUser.getUsername(),
                                "firstName", otherUser.getFirstName(),
                                "lastName", otherUser.getLastName()
                            ),
                            "requestDate", request.getRequestDate().toString()
                        );
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList())
            );
            
            System.out.println("Sending response: " + response);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error processing request: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error processing request: " + e.getMessage()));
        }
    }
} 
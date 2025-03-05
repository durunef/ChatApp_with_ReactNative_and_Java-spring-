package com.example.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import com.example.model.Conversation;
import com.example.model.User;
import com.example.repository.ConversationRepository;
import com.example.repository.UserRepository;
import com.example.security.EncryptionUtil;

@RestController
@RequestMapping("/messages")
public class MessageController {

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final EncryptionUtil encryptionUtil;

    public MessageController(UserRepository userRepository, 
                           ConversationRepository conversationRepository, 
                           EncryptionUtil encryptionUtil) {
        this.userRepository = userRepository;
        this.conversationRepository = conversationRepository;
        this.encryptionUtil = encryptionUtil;
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> request) {
        try {
            System.out.println("Received message request: " + request);

            String senderId = request.get("senderId");
            String receiverId = request.get("receiverId");
            String messageText = request.get("text");
            boolean isInitial = Boolean.parseBoolean(request.get("isInitial"));

            // Validate users exist
            var sender = userRepository.findById(senderId);
            var receiver = userRepository.findById(receiverId);

            if (sender.isEmpty() || receiver.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid sender or receiver ID"));
            }

            // Check if users are friends
            User senderUser = sender.get();
            if (!senderUser.getFriendIds().contains(receiverId)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Users must be friends to exchange messages"));
            }

            // Find or create conversation
            List<String> participants = Arrays.asList(senderId, receiverId);
            Collections.sort(participants);

            Optional<Conversation> existingConv = conversationRepository
                .findByParticipantsContainingAll(participants);

            Conversation conversation;
            if (existingConv.isEmpty()) {
                conversation = new Conversation();
                conversation.setParticipants(participants);
                conversation.setMessages(new ArrayList<>());
                System.out.println("Creating new conversation");
            } else {
                conversation = existingConv.get();
                System.out.println("Using existing conversation: " + conversation.getConversationId());
            }

            // Only add message if it's not an initial conversation creation
            if (!isInitial && messageText != null && !messageText.trim().isEmpty()) {
                Conversation.Message message = new Conversation.Message(
                    senderId,
                    encryptionUtil.encrypt(messageText),
                    LocalDateTime.now(),
                    "sent"
                );
                conversation.getMessages().add(message);
            }

            conversation = conversationRepository.save(conversation);

            return ResponseEntity.ok(Map.of(
                "message", "Message sent successfully",
                "conversationId", conversation.getConversationId()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getConversationHistory(@RequestParam String userId) {
        try {
            // Validate user exists
            Optional<User> user = userRepository.findById(userId);
            if (user.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User not found"));
            }

            // Get all conversations for the user
            List<Conversation> conversations = conversationRepository.findByParticipantsContaining(userId);

            // Process and format conversations
            List<Map<String, Object>> formattedConversations = conversations.stream()
                .map(conv -> {
                    Map<String, Object> conversationMap = new HashMap<>();
                    conversationMap.put("conversationId", conv.getConversationId());
                    conversationMap.put("participants", conv.getParticipants());

                    // Decrypt and format messages
                    List<Map<String, Object>> messages = conv.getMessages().stream()
                        .map(msg -> {
                            Map<String, Object> messageMap = new HashMap<>();
                            messageMap.put("senderId", msg.getSenderId());
                            messageMap.put("text", encryptionUtil.decrypt(msg.getText()));
                            messageMap.put("timestamp", msg.getTimestamp());
                            messageMap.put("status", msg.getStatus());
                            return messageMap;
                        })
                        .collect(Collectors.toList());

                    conversationMap.put("messages", messages);
                    return conversationMap;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("conversations", formattedConversations));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to retrieve conversations: " + e.getMessage()));
        }
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<?> getConversationMessages(@PathVariable String conversationId) {
        try {
            Optional<Conversation> conversation = conversationRepository.findById(conversationId);
            
            if (conversation.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Conversation not found"));
            }

            Conversation conv = conversation.get();
            
            // Decrypt and format messages
            List<Map<String, Object>> messages = conv.getMessages().stream()
                .map(msg -> {
                    Map<String, Object> messageMap = new HashMap<>();
                    messageMap.put("senderId", msg.getSenderId());
                    messageMap.put("text", encryptionUtil.decrypt(msg.getText()));
                    messageMap.put("timestamp", msg.getTimestamp());
                    messageMap.put("status", msg.getStatus());
                    return messageMap;
                })
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("conversationId", conv.getConversationId());
            response.put("participants", conv.getParticipants());
            response.put("messages", messages);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to retrieve messages: " + e.getMessage()));
        }
    }
} 
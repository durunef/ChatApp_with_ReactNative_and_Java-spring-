package com.example.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.model.Group;
import com.example.model.User;
import com.example.repository.GroupRepository;
import com.example.repository.UserRepository;
import com.example.security.EncryptionUtil;

@RestController
@RequestMapping("/groups")
public class GroupController {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EncryptionUtil encryptionUtil;

    @PostMapping("/create")
    public ResponseEntity<?> createGroup(@RequestBody Map<String, Object> request) {
        try {
            String creatorId = (String) request.get("creatorId");
            String groupName = (String) request.get("name");
            
            // Add type check before casting
            Object memberIdsObj = request.get("memberIds");
            if (!(memberIdsObj instanceof List<?>)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid memberIds format"));
            }
            @SuppressWarnings("unchecked")
            List<String> memberIds = (List<String>) memberIdsObj;

            // Validate creator exists
            Optional<User> creator = userRepository.findById(creatorId);
            if (creator.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Creator not found"));
            }

            // Validate all members exist
            for (String memberId : memberIds) {
                if (userRepository.findById(memberId).isEmpty()) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid member ID: " + memberId));
                }
            }

            // Create new group
            Group group = new Group();
            group.setName(groupName);
            group.setCreatorId(creatorId);
            group.setMemberIds(new ArrayList<>(memberIds));
            if (!group.getMemberIds().contains(creatorId)) {
                group.getMemberIds().add(creatorId);
            }

            group = groupRepository.save(group);

            return ResponseEntity.ok(Map.of(
                "message", "Group created successfully",
                "groupId", group.getGroupId()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/add-member")
    public ResponseEntity<?> addMember(@PathVariable String groupId, 
                                     @RequestBody Map<String, List<String>> request) {
        try {
            List<String> newMemberIds = request.get("memberIds");
            if (newMemberIds == null || newMemberIds.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "No member IDs provided"));
            }

            // Validate group exists
            Optional<Group> groupOpt = groupRepository.findById(groupId);
            if (groupOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Group not found"));
            }

            Group group = groupOpt.get();
            boolean anyNewMembersAdded = false;

            // Validate and add each new member
            for (String newMemberId : newMemberIds) {
                // Validate new member exists
                if (userRepository.findById(newMemberId).isEmpty()) {
                    continue; // Skip invalid users
                }

                // Add member if not already in group
                if (!group.getMemberIds().contains(newMemberId)) {
                    group.getMemberIds().add(newMemberId);
                    anyNewMembersAdded = true;
                }
            }

            if (!anyNewMembersAdded) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "No new members were added"));
            }

            groupRepository.save(group);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Members added successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/send")
    public ResponseEntity<?> sendGroupMessage(@PathVariable String groupId, 
                                            @RequestBody Map<String, String> request) {
        try {
            String senderId = request.get("senderId");
            String messageText = request.get("text");

            // Validate group exists
            Optional<Group> groupOpt = groupRepository.findById(groupId);
            if (groupOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Group not found"));
            }

            Group group = groupOpt.get();

            // Validate sender is a member
            if (!group.getMemberIds().contains(senderId)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Sender is not a member of this group"));
            }

            // Create and add new message
            Group.GroupMessage message = new Group.GroupMessage(
                senderId,
                encryptionUtil.encrypt(messageText),
                LocalDateTime.now(),
                "sent"
            );

            group.getMessages().add(message);
            groupRepository.save(group);

            return ResponseEntity.ok(Map.of("message", "Message sent successfully"));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<?> getGroupMessages(@PathVariable String groupId) {
        try {
            Optional<Group> groupOpt = groupRepository.findById(groupId);
            if (groupOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Group not found"));
            }

            Group group = groupOpt.get();

            List<Map<String, Object>> messages = group.getMessages().stream()
                .map(msg -> {
                    Map<String, Object> messageMap = new HashMap<>();
                    messageMap.put("senderId", msg.getSenderId());
                    messageMap.put("text", encryptionUtil.decrypt(msg.getText()));
                    messageMap.put("timestamp", msg.getTimestamp().toString());
                    messageMap.put("status", msg.getStatus());
                    
                    Optional<User> sender = userRepository.findById(msg.getSenderId());
                    messageMap.put("senderUsername", sender.map(User::getUsername).orElse("Unknown User"));
                    
                    return messageMap;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("messages", messages));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getGroupMembers(@PathVariable String groupId) {
        try {
            Optional<Group> groupOpt = groupRepository.findById(groupId);
            if (groupOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Group not found"));
            }

            Group group = groupOpt.get();
            List<Map<String, String>> members = group.getMemberIds().stream()
                .map(memberId -> userRepository.findById(memberId))
                .filter(Optional::isPresent)
                .map(member -> Map.of(
                    "id", member.get().getId(),
                    "username", member.get().getUsername(),
                    "email", member.get().getEmail()
                ))
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("members", members));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserGroups(@RequestParam String userId) {
        try {
            // Validate user exists
            Optional<User> user = userRepository.findById(userId);
            if (user.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User not found"));
            }

            // Find all groups where user is a member
            List<Group> userGroups = groupRepository.findByMemberIdsContaining(userId);
            
            // Convert groups to response format
            List<Map<String, Object>> groupsResponse = userGroups.stream()
                .map(group -> {
                    Map<String, Object> groupMap = new HashMap<>();
                    groupMap.put("groupId", group.getGroupId());
                    groupMap.put("name", group.getName());
                    groupMap.put("creatorId", group.getCreatorId());
                    groupMap.put("memberIds", group.getMemberIds());
                    return groupMap;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("groups", groupsResponse));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroupById(@PathVariable String groupId) {
        try {
            Optional<Group> groupOpt = groupRepository.findById(groupId);
            if (groupOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Group not found"));
            }

            Group group = groupOpt.get();
            Map<String, Object> groupResponse = new HashMap<>();
            groupResponse.put("groupId", group.getGroupId());
            groupResponse.put("name", group.getName());
            groupResponse.put("creatorId", group.getCreatorId());
            groupResponse.put("memberIds", group.getMemberIds());
            groupResponse.put("createdAt", group.getCreatedAt().toString());

            return ResponseEntity.ok(groupResponse);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
} 
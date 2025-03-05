package com.example.repository;

import com.example.model.FriendRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends MongoRepository<FriendRequest, String> {
    List<FriendRequest> findBySenderIdAndReceiverId(String senderId, String receiverId);
    List<FriendRequest> findByReceiverIdAndStatus(String receiverId, String status);
    List<FriendRequest> findByStatusAndSenderIdOrReceiverId(String status, String userId, String userId2);
    Optional<FriendRequest> findByRequestToken(String requestToken);
    
    // Add this method to find all pending requests for a user
    @Query("{ 'receiverId': ?0, 'status': 'PENDING' }")
    List<FriendRequest> findPendingRequestsForUser(String userId);
} 
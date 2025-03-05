package com.example.repository;

import com.example.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    
    @Query("{ 'participants': { $all: ?0 } }")
    Optional<Conversation> findByParticipantsContainingAll(List<String> participants);
    
    List<Conversation> findByParticipantsContaining(String userId);
} 
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API } from '../constants/api';
import { authenticatedFetch } from '../utils/api';
import { theme } from '../styles/theme';
import { useRouter } from 'expo-router';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  participants: string[];
  messages: Message[];
}

const formatLastMessageTime = (timestamp: string) => {
  try {
    const messageDate = new Date(timestamp);
    if (isNaN(messageDate.getTime())) {
      return '';
    }

    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    const isThisYear = messageDate.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (isThisYear) {
      return messageDate.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return messageDate.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};

const styles = StyleSheet.create({
  conversationItem: {
    // ... existing styles ...
  },
  conversationContent: {
    // ... existing styles ...
  },
  conversationName: {
    // ... existing styles ...
  },
  lastMessage: {
    // ... existing styles ...
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 8,
  },
});

export default function ConversationsScreen() {
  const { currentUser, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();

  const fetchConversations = async () => {
    try {
      if (!currentUser?.id) {
        console.log('No user logged in');
        return;
      }

      console.log('Fetching conversations for:', currentUser.id);
      const data = await authenticatedFetch(
        API.MESSAGES.GET_CONVERSATIONS(currentUser.id),
        token
      );

      if (data && data.conversations) {
        setConversations(data.conversations);
      } else {
        console.log('No conversations in response:', data);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [currentUser]);

  const renderConversation = ({ item }: { item: Conversation }) => {
    const lastMessage = item.messages[item.messages.length - 1];
    const formattedTime = lastMessage ? formatLastMessageTime(lastMessage.timestamp) : '';

    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={styles.conversationContent}>
          <Text style={styles.conversationName}>
            {/* Your conversation name logic */}
          </Text>
          <Text style={styles.lastMessage}>
            {lastMessage?.text || 'No messages yet'}
          </Text>
        </View>
        {formattedTime && (
          <Text style={styles.timestamp}>{formattedTime}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {/* Your JSX here */}
    </View>
  );
} 
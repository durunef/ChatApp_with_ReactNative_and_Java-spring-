import React, { useState, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme, sharedStyles } from '../styles/theme';
import { API } from '../constants/api';
import { useAuth } from '../context/AuthContext';
import { authenticatedFetch } from '../utils/api';
import { getUserColor } from '../utils/colors';

interface Message {
  senderId: string;
  text: string;
  timestamp: string;
  status: string;
}

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { currentUser, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [friendName, setFriendName] = useState<string>('');

  console.log('ChatScreen mounted with conversationId:', conversationId);

  useEffect(() => {
    if (conversationId) {
      console.log('Fetching initial messages for conversation:', conversationId);
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  useEffect(() => {
    const fetchFriendName = async () => {
      if (!conversationId || !currentUser?.id) return;

      try {
        const data = await authenticatedFetch(
          API.MESSAGES.GET_MESSAGES(conversationId),
          token
        );
        
        if (data && data.participants) {
          const otherUserId = data.participants.find((id: string) => id !== currentUser.id);
          
          if (otherUserId) {
            const friendsResponse = await authenticatedFetch(
              `/friends?userId=${currentUser.id}`,
              token
            );
            
            if (friendsResponse && friendsResponse.friends) {
              const friend = friendsResponse.friends.find((f: any) => f.id === otherUserId);
              if (friend) {
                setFriendName(friend.username);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching friend name:', error);
      }
    };

    fetchFriendName();
  }, [conversationId, currentUser?.id]);

  const fetchMessages = async () => {
    try {
      if (!conversationId || typeof conversationId !== 'string') return;
      
      const data = await authenticatedFetch(
        API.MESSAGES.GET_MESSAGES(conversationId),
        token
      );
      
      if (data && !data.error) {
        setMessages(data.messages || []);
        setParticipants(data.participants || []);
      } else {
        console.error('Error in response:', data.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser?.id || !conversationId) return;

    try {
      const recipientId = participants.find(id => id !== currentUser.id);
      if (!recipientId) {
        console.error('No recipient found in participants:', participants);
        return;
      }

      console.log('Sending message:', {
        senderId: currentUser.id,
        receiverId: recipientId,
        text: newMessage.trim()
      });

      const response = await authenticatedFetch(
        API.MESSAGES.SEND_MESSAGE,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: recipientId,
            text: newMessage.trim()
          })
        }
      );

      if (response.conversationId) {
        setNewMessage('');
        await fetchMessages();
      } else {
        console.error('Failed to send message:', response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      } else {
        return date.toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUser?.id;
    const formattedTime = formatMessageTime(item.timestamp);

    return (
      <View style={[
        styles.messageWrapper,
        isOwnMessage ? styles.ownMessageWrapper : styles.otherMessageWrapper
      ]}>
        <View style={styles.messageContentWrapper}>
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
            { backgroundColor: isOwnMessage ? '#4CAF50' : '#f0f0f0' }
          ]}>
            <Text style={[
              styles.messageText,
              { color: isOwnMessage ? '#fff' : '#000' }
            ]}>
              {item.text}
            </Text>
          </View>
          <Text style={[
            styles.timestamp,
            isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
          ]}>
            {formattedTime}
          </Text>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    messageWrapper: {
      marginVertical: 4,
      maxWidth: '80%',
    },
    messageContentWrapper: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      maxWidth: '100%',
    },
    ownMessageWrapper: {
      alignSelf: 'flex-end',
      alignItems: 'flex-end',
    },
    otherMessageWrapper: {
      alignSelf: 'flex-start',
      alignItems: 'flex-start',
    },
    messageBubble: {
      borderRadius: 16,
      padding: 12,
      maxWidth: '100%',
    },
    ownMessage: {
      borderBottomRightRadius: 4,
    },
    otherMessage: {
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 16,
    },
    timestamp: {
      fontSize: 11,
      color: '#FF0000',
      marginTop: 2,
      marginBottom: 8,
    },
    ownTimestamp: {
      alignSelf: 'flex-end',
    },
    otherTimestamp: {
      alignSelf: 'flex-start',
    },
  });

  return (
    <KeyboardAvoidingView
      style={sharedStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen 
        options={{
          headerTitle: friendName || 'Chat',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#007AFF',
          headerTitleStyle: {
            color: '#000',
            fontSize: 17,
          },
        }}
      />
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `message-${index}-${item.timestamp}`}
        contentContainerStyle={sharedStyles.messagesList}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={sharedStyles.inputContainer}>
        <TextInput
          style={sharedStyles.chatInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.text.secondary}
          multiline
        />
        <TouchableOpacity
          style={sharedStyles.sendButton}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons
            name="send"
            size={24}
            color={newMessage.trim() ? theme.colors.text.light : theme.colors.text.secondary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
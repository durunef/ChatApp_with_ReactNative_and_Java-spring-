import React, { useState, useEffect, useRef } from 'react';
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme, sharedStyles } from '../styles/theme';
import { API } from '../constants/api';
import { useAuth } from '../context/AuthContext';
import { authenticatedFetch } from '../utils/api';

interface Message {
  senderId: string;
  text: string;
  timestamp: string;
  status: string;
  senderUsername: string;
}

interface Group {
  groupId: string;
  name: string;
  creatorId: string;
  memberIds: string[];
  messages: Message[];
  createdAt: string;
}

export default function GroupChatScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { currentUser, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    if (groupId) {
      fetchGroupInfo();
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [groupId]);

  useEffect(() => {
    const debugGroupFetch = async () => {
      if (!groupId) {
        console.log('Missing groupId');
        return;
      }

      // Log the full URL being called
      const fullUrl = `${API.BASE_URL}${API.GROUPS.GET(groupId)}`;
      console.log('Attempting to fetch group at URL:', fullUrl);
      
      try {
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Make sure you have the token
          }
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
      } catch (error) {
        console.error('Detailed fetch error:', error);
      }
    };

    debugGroupFetch();
  }, [groupId]);

  const fetchGroupInfo = async () => {
    try {
      if (!groupId) {
        console.error('No groupId provided');
        return;
      }
      
      const response = await fetch(`${API.BASE_URL}${API.GROUPS.GET(groupId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Make sure you have the token
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGroupInfo(data);
      
    } catch (error) {
      console.error('Error fetching group info:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      if (!groupId) return;
      
      const data = await authenticatedFetch(
        API.GROUPS.MESSAGES(groupId),
        token
      );
      
      if (data && !data.error) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser?.id || !groupId) return;

    try {
      const response = await authenticatedFetch(
        API.GROUPS.SEND_MESSAGE(groupId),
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            senderId: currentUser.id,
            text: newMessage.trim(),
            groupId: groupId
          })
        }
      );

      if (response.success) {
        setNewMessage('');
        await fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUser?.id;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && (
          <Text style={styles.senderUsername}>
            {item.senderUsername || 'Unknown User'}
          </Text>
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
        </View>
        {item.timestamp && (
          <Text style={styles.timestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        )}
      </View>
    );
  };

  const navigateToGroupInfo = () => {
    if (groupInfo) {
      router.push({
        pathname: '/groupinfo/[id]',
        params: { id: groupInfo.groupId }
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return ''; // Return empty string if date is invalid
      }
      
      // Check if it's today
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        // If it's today, just show time
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      } else {
        // If it's another day, show date and time
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

  const formatCreatedDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date not available';
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: "Groups",
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 'bold',
          },
          headerTintColor: '#000000', // iOS blue color
          headerStyle: {
            backgroundColor: '#fff',
          },
        }} 
      />
      
      <KeyboardAvoidingView
        style={sharedStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableOpacity 
          style={styles.header} 
          onPress={navigateToGroupInfo}
        >
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{groupInfo?.name}</Text>
            <Text style={styles.createdDate}>
              Created {groupInfo?.createdAt ? formatCreatedDate(groupInfo.createdAt) : 'Date not available'}
            </Text>
          </View>
          <Text style={styles.memberCount}>
            {groupInfo?.memberIds.length || 0} members
          </Text>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>

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
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  memberCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  senderUsername: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
    marginLeft: 12,
    fontWeight: '500',
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    marginRight: 12,
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
  },
  otherMessageBubble: {
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: theme.colors.text.primary,
  },
  timestamp: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: 2,
    marginHorizontal: 8,
    alignSelf: 'flex-end',
  },
  groupHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  createdDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
}); 
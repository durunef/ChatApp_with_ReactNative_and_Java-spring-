import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Alert, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API } from '../constants/api';
import { theme, sharedStyles } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { authenticatedFetch } from '../utils/api';
import { getUserColor } from '../utils/colors';

interface Friend {
  id: string;
  username: string;
}

interface Message {
  senderId: string;
  text: string;
  timestamp: string;
  status: string;
}

interface Participant {
  id: string;
  username: string;
}

interface Conversation {
  conversationId: string;
  messages: Message[];
  participants: string[];
}

type ListItem = Friend | Conversation;

export default function ChatsScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'friends'
  const { currentUser, token } = useAuth();
  const router = useRouter();

  const fetchConversations = async () => {
    if (!currentUser?.id || !token) {
      console.log('No user ID or token available');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching conversations for:', currentUser.id);
      
      const response = await authenticatedFetch(
        `/messages?userId=${currentUser.id}`,
        token
      );

      console.log('Conversations response:', response);

      if (response && response.conversations) {
        setConversations(response.conversations);
      } else {
        console.log('No conversations found in response');
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    if (!currentUser?.id || !token) return;

    try {
      const response = await authenticatedFetch(
        `/friends?userId=${currentUser.id}`,
        token
      );

      console.log('Friends response:', response);

      if (response && response.friends) {
        setFriends(response.friends);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    }
  };

  const startChat = async (friendId: string) => {
    try {
      if (!currentUser?.id) return;
      
      console.log('Creating new conversation between:', currentUser.id, 'and', friendId);
      
      const response = await authenticatedFetch(
        '/messages/send',
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: friendId,
            text: "",
            isInitial: true  // This flag tells the backend we're just creating a conversation
          })
        }
      );

      console.log('Start chat response:', response);

      if (response && response.conversationId) {
        await fetchConversations(); // Refresh conversations list
        setActiveTab('chats'); // Switch to chats tab
        router.push(`/chat/${response.conversationId}`);
      } else {
        console.error('Failed to create conversation:', response);
        Alert.alert('Error', 'Unable to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Unable to start conversation');
    }
  };

  useEffect(() => {
    if (currentUser?.id && token) {
      fetchConversations();
      fetchFriends();
    }
  }, [currentUser?.id, token]);

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
        onPress={() => setActiveTab('chats')}
      >
        <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>Chats</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
        onPress={() => setActiveTab('friends')}
      >
        <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>Friends</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (activeTab === 'chats') {
      return conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No conversations yet. Start a chat with a friend!
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversationId}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => router.push(`/chat/${item.conversationId}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchConversations}
            />
          }
        />
      );
    } else {
      return (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendItem
              friend={item}
              onStartChat={() => startChat(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchFriends}
            />
          }
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {renderTabs()}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        renderContent()
      )}
    </View>
  );
}

const ConversationItem = ({ conversation, onPress }: { 
  conversation: Conversation; 
  onPress: () => void; 
}) => {
  const { currentUser, token } = useAuth();
  const [friendName, setFriendName] = useState('Loading...');
  
  const otherParticipantId = currentUser?.id ? 
    conversation.participants?.find(id => id !== currentUser.id) : 
    null;

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return null;
      }

      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h`;
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays}d`;
      } else {
        return date.toLocaleDateString([], {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchParticipantName = async () => {
      if (!otherParticipantId || !token || !currentUser?.id) return;

      try {
        // Fetch friends list to get the username
        const response = await authenticatedFetch(
          `/friends?userId=${currentUser.id}`,
          token
        );

        if (response && response.friends) {
          const friend = response.friends.find((f: Friend) => f.id === otherParticipantId);
          if (friend) {
            setFriendName(friend.username);
          }
        }
      } catch (error) {
        console.error('Error fetching participant name:', error);
        setFriendName('Unknown');
      }
    };

    fetchParticipantName();
  }, [otherParticipantId, currentUser, token]);

  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
  const timestamp = lastMessage?.timestamp ? formatTimestamp(lastMessage.timestamp) : null;

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={[
        styles.avatarContainer,
        { backgroundColor: otherParticipantId ? getUserColor(otherParticipantId) : '#4CAF50' }
      ]}>
        <Text style={styles.avatarText}>
          {friendName[0]?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.username}>{friendName}</Text>
            {timestamp && (
              <Text style={styles.timestamp}>{timestamp}</Text>
            )}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessage?.text || 'No messages yet'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FriendItem = ({ friend, onStartChat }: { 
  friend: Friend; 
  onStartChat: () => void; 
}) => (
  <View style={styles.itemContainer}>
    <View style={[
      styles.avatarContainer,
      { backgroundColor: getUserColor(friend.id) }
    ]}>
      <Text style={styles.avatarText}>
        {friend.username?.[0]?.toUpperCase() || '?'}
      </Text>
    </View>
    <View style={styles.contentContainer}>
      <Text style={styles.username}>{friend.username}</Text>
      <TouchableOpacity 
        style={styles.startChatButton} 
        onPress={onStartChat}
      >
        <Text style={styles.startChatButtonText}>Start Chat</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  startChatButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startChatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});
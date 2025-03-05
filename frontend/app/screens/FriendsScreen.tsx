import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { API } from '../constants/api';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { authenticatedFetch } from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface FriendRequest {
  requestToken: string;
  type: 'sent' | 'received';
  otherUser: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  requestDate: string;
}

type ListItem = User | FriendRequest;

interface ToastMessage {
  text: string;
  type: 'success' | 'error';
}

export default function FriendsScreen() {
  const { currentUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchPendingRequests();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      if (!currentUser?.id) return;
      setLoading(true);
      
      const data = await authenticatedFetch(
        `/users?currentUserId=${currentUser.id}`,
        token
      );

      if (data.status === 'success') {
        setUsers(data.users || []);
      } else {
        setError(data.message || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      if (!currentUser?.id) return;
      setLoading(true);
      const data = await authenticatedFetch(
        `/friends/pending?userId=${currentUser.id}`,
        token
      );
      
      if (data.requests) {
        setPendingRequests(data.requests);
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setError('Failed to load pending requests');
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ text: message, type });
    
    // Animate in
    Animated.sequence([
      Animated.timing(toastAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Hold for 4.4 seconds (total 5 seconds with animations)
      Animated.delay(4400),
      // Animate out
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  };

  const sendFriendRequest = async (receiverId: string) => {
    try {
      if (!currentUser?.id) return;
      
      const response = await authenticatedFetch(
        '/friends/add',
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: receiverId
          })
        }
      );

      if (response.error === 'Friend request already sent') {
        showToast('Friend request already sent to this user', 'error');
        return;
      }

      if (response.message && response.message.includes('success')) {
        showToast('Friend request sent successfully!', 'success');
        fetchUsers(); // Refresh the users list
      } else {
        showToast(response.error || 'Failed to send friend request', 'error');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      showToast('Failed to send friend request', 'error');
    }
  };

  const handleRequest = async (requestToken: string, action: 'accept' | 'reject') => {
    try {
      if (!currentUser?.id) return;
      console.log(`Handling ${action} request:`, { requestToken, userId: currentUser.id });
      
      const response = await authenticatedFetch(
        `/friends/${action}`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            userId: currentUser.id,
            requestToken: requestToken
          })
        }
      );

      console.log(`${action} response:`, response);

      if (response.message && 
         (response.message.includes('success') || response.message.includes('accepted') || response.message.includes('rejected'))) {
        showToast(
          action === 'accept' 
            ? 'Friend request accepted!' 
            : 'Friend request rejected',
          'success'
        );
        
        setPendingRequests(prev => 
          prev.filter(req => req.requestToken !== requestToken)
        );

        await Promise.all([
          fetchPendingRequests(),
          action === 'accept' ? fetchUsers() : Promise.resolve()
        ]);

      } else {
        if (response.error === 'Friend request not found') {
          showToast('This friend request no longer exists', 'error');
          setPendingRequests(prev => 
            prev.filter(req => req.requestToken !== requestToken)
          );
        } else {
          showToast(
            response.error || `Failed to ${action} request`, 
            'error'
          );
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          showToast('This friend request no longer exists', 'error');
          setPendingRequests(prev => 
            prev.filter(req => req.requestToken !== requestToken)
          );
        } else {
          showToast(`Failed to ${action} request`, 'error');
        }
      } else {
        showToast(`Failed to ${action} request`, 'error');
      }
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    if (item.id === currentUser?.id) {
      return null;
    }

    const requestSent = pendingRequests.some(
      request => request.type === 'sent' && request.otherUser.id === item.id
    );

    return (
      <View style={styles.itemContainer}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.name}>{`${item.firstName} ${item.lastName}`}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.actionButton,
            requestSent && styles.disabledButton
          ]}
          onPress={() => sendFriendRequest(item.id)}
          disabled={requestSent}
        >
          <Text style={[
            styles.buttonText,
            requestSent && styles.disabledButtonText
          ]}>
            {requestSent ? 'Request Sent' : 'Add Friend'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestItem = ({ item }: { item: FriendRequest }) => {
    const isSender = item.type === 'sent';
    const otherUser = item.otherUser;

    return (
      <View style={styles.itemContainer}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{otherUser.username}</Text>
          <Text style={styles.name}>
            {`${otherUser.firstName} ${otherUser.lastName}`}
          </Text>
          <Text style={styles.requestInfo}>
            {isSender ? 'Request sent' : 'Sent you a request'}
          </Text>
        </View>
        {!isSender && (
          <View style={styles.requestButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleRequest(item.requestToken, 'accept')}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRequest(item.requestToken, 'reject')}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Find Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Friend Requests
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'users' && (
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList<ListItem>
          data={activeTab === 'users' 
            ? users.filter(user => 
                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : pendingRequests
          }
          renderItem={({ item }) => (
            activeTab === 'users' 
              ? renderUserItem({ item: item as User }) 
              : renderRequestItem({ item: item as FriendRequest })
          )}
          keyExtractor={item => 
            'id' in item ? item.id : item.requestToken
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            toast.type === 'success' ? styles.successToast : styles.errorToast,
            {
              opacity: toastAnimation,
              transform: [{
                translateY: toastAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.toastText}>{toast.text}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.secondary,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    margin: 16,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  requestInfo: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  requestButtons: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: theme.colors.success || '#4CAF50',
  },
  rejectButton: {
    backgroundColor: theme.colors.error || '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successToast: {
    backgroundColor: theme.colors.success || '#4CAF50',
  },
  errorToast: {
    backgroundColor: theme.colors.error || '#F44336',
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#666',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { authenticatedFetch } from '../utils/api';
import { API } from '../constants/api';
import { theme } from '../styles/theme';
import { getUserColor } from '../utils/colors';
import { Ionicons } from '@expo/vector-icons';

interface Friend {
  id: string;
  username: string;
  email: string;
}

export default function AddMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { token, currentUser } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  useEffect(() => {
    fetchFriends();
    fetchGroupMembers();
  }, []);

  const fetchFriends = async () => {
    try {
      const data = await authenticatedFetch(
        API.FRIENDS.GET_FRIENDS(currentUser?.id || ''),
        token
      );
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      const data = await authenticatedFetch(
        API.GROUPS.MEMBERS(groupId),
        token
      );
      setGroupMembers(data.members.map((member: Friend) => member.id));
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select at least one friend to add');
      return;
    }

    try {
      const response = await authenticatedFetch(
        API.GROUPS.ADD_MEMBER(groupId),
        token,
        {
          method: 'POST',
          body: JSON.stringify({ memberIds: selectedFriends }),
        }
      );

      if (response.success) {
        Alert.alert('Success', 'Members added successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Error', 'Failed to add members');
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => {
    const isAlreadyMember = groupMembers.includes(item.id);
    const isSelected = selectedFriends.includes(item.id);

    if (isAlreadyMember) return null;

    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          isSelected && styles.selectedFriend
        ]}
        onPress={() => toggleFriendSelection(item.id)}
        disabled={isAlreadyMember}
      >
        <View style={[styles.avatar, { backgroundColor: getUserColor(item.id) }]}>
          <Text style={styles.avatarText}>
            {item.username[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Add Members',
          headerRight: () => (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddMembers}
              disabled={selectedFriends.length === 0}
            >
              <Text style={[
                styles.addButtonText,
                selectedFriends.length === 0 && styles.disabledText
              ]}>
                Add
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No friends available to add</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedFriend: {
    backgroundColor: '#f0f8ff',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  email: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  addButton: {
    marginRight: 16,
  },
  addButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  disabledText: {
    opacity: 0.5,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginTop: 20,
  },
}); 
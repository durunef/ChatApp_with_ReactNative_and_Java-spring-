import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authenticatedFetch } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { API } from '../constants/api';
import { useRouter } from 'expo-router';

interface Group {
  groupId: string;
  name: string;
  creatorId: string;
  memberIds: string[];
}

interface Friend {
  id: string;
  username: string;
  email: string;
}

export default function GroupsScreen() {
  const { currentUser, token } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const router = useRouter();

  const fetchGroups = async () => {
    try {
      if (!currentUser?.id) {
        console.error('No user ID available');
        return;
      }

      const response = await authenticatedFetch(
        API.GROUPS.LIST(currentUser.id),
        token
      );
      console.log('Groups fetched:', response.groups);
      setGroups(response.groups || []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    }
  };

  const fetchFriends = async () => {
    try {
      if (!currentUser?.id) {
        console.error('No user ID available');
        return;
      }

      const response = await authenticatedFetch(
        API.FRIENDS.GET_FRIENDS(currentUser.id),
        token
      );
      console.log('Friends fetched:', response.friends);
      setFriends(response.friends || []);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchGroups();
      fetchFriends();
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <Text>Please log in to view groups</Text>
      </View>
    );
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedFriends.length === 0) {
      Alert.alert('Error', 'Please enter a group name and select at least one friend');
      return;
    }

    try {
      const response = await authenticatedFetch(
        API.GROUPS.CREATE,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: newGroupName,
            creatorId: currentUser?.id,
            memberIds: [...selectedFriends, currentUser?.id]
          }),
        }
      );

      console.log('Group created:', response);
      setCreateModalVisible(false);
      setNewGroupName('');
      setSelectedFriends([]);
      fetchGroups();
      Alert.alert('Success', 'Group created successfully');
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const navigateToGroupChat = (group: Group) => {
    router.push({
      pathname: '/groupchat/[id]',
      params: { id: group.groupId }
    });
  };

  const handleAddMember = async (group: Group) => {
    try {
      const availableFriends = friends.filter(
        friend => !group.memberIds.includes(friend.id)
      );

      if (availableFriends.length === 0) {
        Alert.alert('No Friends Available', 'All your friends are already in this group.');
        return;
      }

      setSelectedGroup(group);
      setSelectedFriends([]);
      setIsAddMemberModalVisible(true);
    } catch (error) {
      console.error('Error handling add member:', error);
      Alert.alert('Error', 'Failed to add member to group');
    }
  };

  const addMembersToGroup = async (groupId: string, memberIds: string[]) => {
    try {
      const response = await authenticatedFetch(
        API.GROUPS.ADD_MEMBER(groupId),
        token,
        {
          method: 'POST',
          body: JSON.stringify({ memberIds }),
        }
      );

      if (response.success) {
        fetchGroups();
        Alert.alert('Success', 'Members added to group successfully');
      }
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Error', 'Failed to add members to group');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setCreateModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.buttonText}>Create New Group</Text>
      </TouchableOpacity>

      <ScrollView style={styles.groupsList}>
        {groups.map(group => (
          <TouchableOpacity
            key={group.groupId}
            style={styles.groupItem}
            onPress={() => navigateToGroupChat(group)}
          >
            <View>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.memberCount}>
                {group.memberIds.length} members
              </Text>
            </View>
            {group.creatorId === currentUser?.id && (
              <TouchableOpacity 
                style={styles.addMemberButton}
                onPress={() => handleAddMember(group)}
              >
                <Ionicons name="person-add-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <Text style={styles.sectionTitle}>Select Friends</Text>
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.friendItem,
                    selectedFriends.includes(item.id) && styles.selectedFriend
                  ]}
                  onPress={() => toggleFriendSelection(item.id)}
                >
                  <Text style={styles.friendName}>{item.username}</Text>
                  {selectedFriends.includes(item.id) && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CD964" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.friendsList}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setCreateModalVisible(false);
                  setNewGroupName('');
                  setSelectedFriends([]);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleCreateGroup}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isAddMemberModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Members</Text>
            
            <FlatList
              data={friends.filter(friend => 
                !selectedGroup?.memberIds.includes(friend.id)
              )}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.friendItem,
                    selectedFriends.includes(item.id) && styles.selectedFriend
                  ]}
                  onPress={() => toggleFriendSelection(item.id)}
                >
                  <Text style={styles.friendName}>{item.username}</Text>
                  {selectedFriends.includes(item.id) && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CD964" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.friendsList}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsAddMemberModalVisible(false);
                  setSelectedFriends([]);
                  setSelectedGroup(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={() => {
                  if (selectedGroup && selectedFriends.length > 0) {
                    addMembersToGroup(selectedGroup.groupId, selectedFriends);
                    setIsAddMemberModalVisible(false);
                    setSelectedFriends([]);
                    setSelectedGroup(null);
                  }
                }}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  createButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  groupsList: {
    flex: 1,
  },
  groupItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  friendsList: {
    maxHeight: 300,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedFriend: {
    backgroundColor: '#e8f0fe',
  },
  friendName: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  addMemberButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
}); 
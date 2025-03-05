import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { authenticatedFetch } from '../utils/api';
import { API } from '../constants/api';
import { theme } from '../styles/theme';
import { getUserColor } from '../utils/colors';
import { Ionicons } from '@expo/vector-icons';

interface Member {
  id: string;
  username: string;
  email: string;
}

interface GroupInfo {
  groupId: string;
  name: string;
  creatorId: string;
  memberIds: string[];
  createdAt: string;
}

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, currentUser } = useAuth();
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchGroupInfo();
      fetchMembers();
    }
  }, [id]);

  const fetchGroupInfo = async () => {
    try {
      const data = await authenticatedFetch(
        API.GROUPS.GET(id),
        token
      );
      setGroupInfo(data);
    } catch (error) {
      console.error('Error fetching group info:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await authenticatedFetch(
        API.GROUPS.MEMBERS(id),
        token
      );
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isGroupCreator = groupInfo?.creatorId === currentUser?.id;

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.memberItem}>
      <View style={[styles.memberAvatar, { backgroundColor: getUserColor(item.id) }]}>
        <Text style={styles.avatarText}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {item.username}
          {item.id === groupInfo?.creatorId && (
            <Text style={styles.creatorBadge}> (Creator)</Text>
          )}
        </Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: groupInfo?.name || 'Group Info',
          headerShown: true,
        }}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.infoSection}>
            <Text style={styles.groupName}>{groupInfo?.name}</Text>
            <Text style={styles.createdAt}>
              Created {groupInfo?.createdAt ? formatDate(groupInfo.createdAt) : 'Unknown'}
            </Text>
          </View>

          <View style={styles.membersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Members ({members.length})</Text>
              {isGroupCreator && (
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => router.push({
                    pathname: '/groupinfo/add-members',
                    params: { groupId: id }
                  })}
                >
                  <Ionicons name="person-add" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={members}
              renderItem={renderMember}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.membersList}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  createdAt: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  membersSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  membersList: {
    paddingHorizontal: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberAvatar: {
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
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  memberEmail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  creatorBadge: {
    color: theme.colors.primary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  addButton: {
    padding: 8,
  },
});
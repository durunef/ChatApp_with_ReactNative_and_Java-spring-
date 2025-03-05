import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API } from '../constants/api';
import { useRouter } from 'expo-router';
import { authenticatedFetch } from '../utils/fetch';

interface ProfileData {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  friendCount: number;
}

export default function ProfileScreen() {
  const { currentUser, setCurrentUser, token } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData>({
    email: '',
    firstName: '',
    lastName: '',
    username: '',
    friendCount: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ProfileData | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (!currentUser?.id || !token) return;

        const response = await authenticatedFetch(
          API.PROFILE.GET(currentUser.id),
          token
        );

        if (response) {
          setProfileData({
            email: response.email || '',
            firstName: response.firstName || '',
            lastName: response.lastName || '',
            username: response.username || '',
            friendCount: response.friendCount || 0
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfileData();
  }, [currentUser?.id, token]);

  const handleSaveProfile = async () => {
    try {
      if (!editedData) return;

      const response = await fetch(`${API.BASE_URL}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          ...editedData,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfileData(data);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        Alert.alert('Error', 'New passwords do not match');
        return;
      }

      const response = await fetch(`${API.BASE_URL}/profile/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      Alert.alert('Success', 'Password updated successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update password');
    }
  };

  const handleLogout = async () => {
    try {
      await setCurrentUser(null, null);
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  if (!profileData) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {!isEditing ? (
          <>
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Username:</Text>
              <Text style={styles.value}>{profileData.username}</Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.label}>First Name:</Text>
              <Text style={styles.value}>{profileData.firstName}</Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Last Name:</Text>
              <Text style={styles.value}>{profileData.lastName}</Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{profileData.email}</Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Friends:</Text>
              <Text style={styles.value}>{profileData.friendCount}</Text>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.passwordButton]}
              onPress={() => setIsChangingPassword(true)}
            >
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Log Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={editedData?.username}
              onChangeText={(text) => setEditedData({ ...editedData!, username: text })}
              placeholder="Username"
            />
            <TextInput
              style={styles.input}
              value={editedData?.firstName}
              onChangeText={(text) => setEditedData({ ...editedData!, firstName: text })}
              placeholder="First Name"
            />
            <TextInput
              style={styles.input}
              value={editedData?.lastName}
              onChangeText={(text) => setEditedData({ ...editedData!, lastName: text })}
              placeholder="Last Name"
            />
            <TextInput
              style={styles.input}
              value={editedData?.email}
              onChangeText={(text) => setEditedData({ ...editedData!, email: text })}
              placeholder="Email"
              keyboardType="email-address"
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setEditedData(profileData);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {isChangingPassword && (
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
              placeholder="Current Password"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
              placeholder="New Password"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
              placeholder="Confirm New Password"
              secureTextEntry
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.buttonText}>Update Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsChangingPassword(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    width: 100,
    fontSize: 16,
  },
  value: {
    flex: 1,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  saveButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: '#4CD964',
  },
  cancelButton: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: '#FF3B30',
  },
  passwordButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTop: 20,
  },
}); 
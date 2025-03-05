import { Platform } from 'react-native';

// Define base URL based on platform
const BASE_URL = Platform.OS === 'android' 
  ? 'http://your-computer-ip'   // Your computer's IP address for Android
  : 'http://localhost:8080';     // Keep localhost for iOS simulator

// Export API endpoints
export const API = {
  BASE_URL,
  MESSAGES: {
    GET_CONVERSATIONS: (userId: string) => `/conversations/${userId}`,
    GET_MESSAGES: (conversationId: string) => `/messages/${conversationId}`,
    SEND_MESSAGE: '/messages/send',
    CREATE_CONVERSATION: '/messages/create'
  },
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    USERS: '/users',
  },
  PROFILE: {
    GET: (userId: string) => `/profile?userId=${userId}`,
    UPDATE: '/profile/update',
    UPDATE_PASSWORD: '/profile/update-password',
  },
  FRIENDS: {
    ADD: '/friends/add',
    ACCEPT: (requestToken: string) => `/friends/accept/${requestToken}`,
    REJECT: (requestToken: string) => `/friends/reject/${requestToken}`,
    PENDING: (userId: string) => `/friends/pending?userId=${userId}`,
    GET_FRIENDS: (userId: string) => `/friends?userId=${userId}`,
  },
  GROUPS: {
    LIST: (userId: string) => `/groups?userId=${userId}`,
    CREATE: '/groups/create',
    GET: (groupId: string) => `/groups/${groupId}`,
    MESSAGES: (groupId: string) => `/groups/${groupId}/messages`,
    SEND_MESSAGE: (groupId: string) => `/groups/${groupId}/send`,
    ADD_MEMBER: (groupId: string) => `/groups/${groupId}/add-member`,
    MEMBERS: (groupId: string) => `/groups/${groupId}/members`,
  }
};

export const getDevelopmentUrl = () => {
  if (__DEV__) {
    console.log('Platform:', Platform.OS);
    console.log('Development URL:', BASE_URL);
  }
  return BASE_URL;
};

import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ChatScreen from '../screens/ChatScreen';
import { theme } from '../styles/theme';

export default function ChatRoute() {
  const { id } = useLocalSearchParams();
  console.log('Chat Route ID:', id);

  return (
    <View style={{ 
      flex: 1,
      backgroundColor: theme.colors.background 
    }}>
      <ChatScreen />
    </View>
  );
} 
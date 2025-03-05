import { Stack } from "expo-router";
import { AuthProvider } from './context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="navigation" options={{ headerShown: false }} />
        <Stack.Screen name="friends" options={{ headerShown: true, headerTitle: "Friends" }} />
        <Stack.Screen name="chats" options={{ headerShown: true, headerTitle: "Messages" }} />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: true,
            headerTitle: "Chat",
            headerBackTitle: "Back",
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
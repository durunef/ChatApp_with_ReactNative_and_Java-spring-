import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme, sharedStyles } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

function GradientText({ style, children }: { style?: any, children: React.ReactNode }) {
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.gradientText, style]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={['#00ff87', '#ff69b4', '#60a5fa']}  // green, pink, blue
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </MaskedView>
  );
}

export default function NavigationScreen() {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return (
      <View style={styles.container}>
        <Text>Please log in to continue</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['#00ff87', '#ff69b4', '#60a5fa']}  // green, pink, blue
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <Text style={styles.logoText}>howudoin</Text>
        </LinearGradient>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => router.push('/chats')}
        >
          <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.text.light} />
          <Text style={styles.buttonText}>Chats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/friends')}
        >
          <Ionicons name="people-outline" size={24} color={theme.colors.text.light} />
          <Text style={styles.buttonText}>Friends</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.tertiary }]}
          onPress={() => router.push('/groups')}
        >
          <Ionicons name="people-circle-outline" size={24} color={theme.colors.text.light} />
          <Text style={styles.buttonText}>Groups</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.accentButton]}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person-outline" size={24} color={theme.colors.text.light} />
          <Text style={styles.buttonText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  logoContainer: ViewStyle;
  gradientContainer: ViewStyle;
  logoText: TextStyle;
  gradientText: TextStyle;
  buttonContainer: ViewStyle;
  button: ViewStyle;
  primaryButton: ViewStyle;
  secondaryButton: ViewStyle;
  groupButton: ViewStyle;
  accentButton: ViewStyle;
  buttonText: TextStyle;
}>({
  container: {
    ...(sharedStyles.container as ViewStyle),
    justifyContent: 'center',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  gradientContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: theme.layout.maxWidth,
    alignSelf: 'center',
    gap: theme.spacing.md,
  },
  button: {
    ...(sharedStyles.button as ViewStyle),
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
  },
  groupButton: {
    backgroundColor: theme.colors.secondary || '#FF9500',
  },
  accentButton: {
    backgroundColor: theme.colors.text.secondary,
  },
  buttonText: {
    ...(sharedStyles.buttonText as TextStyle),
  },
  gradientText: {
    fontSize: 48,
    fontWeight: '800',
  },
});

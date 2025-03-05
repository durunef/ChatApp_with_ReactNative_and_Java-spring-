import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme, sharedStyles } from '../styles/theme';
import { API } from '../constants/api';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { setCurrentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate email format
      const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!email.match(emailRegex)) {
        setError('Please enter a valid email address');
        return;
      }

      const response = await fetch(`${API.BASE_URL}${API.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.token && data.user) {
        await setCurrentUser(data.user, data.token);
        router.replace('/navigation');
      } else {
        // More specific error handling
        if (data.error?.includes('Connection refused') || data.error?.includes('timed out')) {
          setError('Unable to connect to the server. Please check your internet connection or try again later.');
        } else {
          setError(data.error || 'Login failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={styles.inputField}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={styles.inputField}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push('/register')}
          disabled={loading}
        >
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  content: ViewStyle;
  title: TextStyle;
  inputContainer: ViewStyle;
  inputField: TextStyle;
  button: ViewStyle;
  buttonDisabled: ViewStyle;
  buttonText: TextStyle;
  link: TextStyle;
  errorText: TextStyle;
}>({
  container: {
    ...(sharedStyles.container as ViewStyle),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: theme.layout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    ...(sharedStyles.title as TextStyle),
  },
  inputContainer: {
    ...(sharedStyles.input as ViewStyle),
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.primary,
  },
  button: {
    ...(sharedStyles.button as ViewStyle),
    backgroundColor: theme.colors.primary,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.border,
  },
  buttonText: {
    ...(sharedStyles.buttonText as TextStyle),
    fontWeight: 600,
  },
  link: {
    color: theme.colors.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '400',
  },
}); 
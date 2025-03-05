import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const theme = {
  colors: {
    primary: '#4CAF50',
    secondary: '#FF69B4',
    tertiary: '#4B7BFF',
    background: '#FAFAFA',
    text: {
      primary: '#333333',
      secondary: '#666666',
      light: '#FFFFFF',
    },
    border: '#ddd',
    error: '#dc3545',
    success: '#28a745',
    card: '#FFFFFF',
    textSecondary: '#666666',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 15,
  },
  typography: {
    h1: {
      fontSize: 48,
      fontWeight: '800' as const,
      letterSpacing: 1,
    },
    h2: {
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    button: {
      fontSize: 18,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
    },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
  },
  layout: {
    maxWidth: width * 0.85,
    containerPadding: 20,
  },
};

export const sharedStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.layout.containerPadding,
  },
  input: {
    backgroundColor: '#FFF',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  button: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.small,
  },
  buttonText: {
    color: theme.colors.text.light,
    ...theme.typography.button,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  // Add these new shared styles for the chat screens
  tabContainer: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center' as const,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.secondary,
  },
  tabText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  activeTabText: {
    color: theme.colors.secondary,
    fontWeight: '600' as const,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  conversationItem: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  conversationHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.xs,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  friendItem: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    ...theme.shadows.small,
  },
  friendInfo: {
    flex: 1,
  },
  startChatButton: {
    backgroundColor: theme.colors.secondary,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  startChatText: {
    color: theme.colors.text.light,
    marginLeft: theme.spacing.xs,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.small,
  } as const,
  ownMessage: {
    alignSelf: 'flex-end' as const,
    backgroundColor: theme.colors.primary,
  } as const,
  otherMessage: {
    alignSelf: 'flex-start' as const,
    backgroundColor: theme.colors.card,
  } as const,
  messageText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  ownMessageText: {
    color: theme.colors.text.light,
  },
  otherMessageText: {
    color: theme.colors.text.primary,
  },
  messageTimestamp: {
    fontSize: 12,
    marginTop: 4,
    color: theme.colors.text.secondary,
  },
  messagesList: {
    padding: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center' as const,
  },
};
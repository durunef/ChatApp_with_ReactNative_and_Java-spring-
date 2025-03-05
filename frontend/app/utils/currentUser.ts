export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  friendIds?: string[];
}

export let currentUser: CurrentUser | null = null;

export const setCurrentUser = (user: CurrentUser | null) => {
  currentUser = user;
}; 
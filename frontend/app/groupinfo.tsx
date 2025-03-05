import { Redirect, useLocalSearchParams } from 'expo-router';

export default function GroupInfo() {
  const { id } = useLocalSearchParams();
  
  // If there's an ID parameter, redirect to the dynamic route
  if (id) {
    return <Redirect href={`/groupinfo/${id}`} />;
  }
  
  // Otherwise, redirect to groups screen
  return <Redirect href="/groups" />;
}
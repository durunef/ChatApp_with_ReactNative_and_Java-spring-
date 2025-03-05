// Function to generate a random color
export const generateRandomColor = (seed: string) => {
  // Use the seed (userId) to generate consistent colors for each user
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate vibrant colors but avoid too light or too dark
  const r = 50 + (hash & 155); // red between 50-205
  const g = 50 + ((hash >> 4) & 155); // green between 50-205
  const b = 50 + ((hash >> 8) & 155); // blue between 50-205

  return `rgb(${r}, ${g}, ${b})`;
};

// Cache to store generated colors
const colorCache: { [key: string]: string } = {};

// Function to get or generate color for a user
export const getUserColor = (userId: string) => {
  if (!colorCache[userId]) {
    colorCache[userId] = generateRandomColor(userId);
  }
  return colorCache[userId];
}; 
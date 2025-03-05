# HowUDoin - Real-time Chat Application

A modern chat application built using React Native (Expo) for the frontend and Spring Boot for the backend, featuring real-time messaging, friend management, and group conversations.

## Tech Stack

### Frontend
- React Native (Expo)
- TypeScript
- React Navigation
- Expo Router
- AsyncStorage for local storage
- Various Expo modules for enhanced functionality

### Backend
- Java 17
- Spring Boot 3.2.0
- MongoDB for database
- JWT for authentication
- WebSocket for real-time messaging
- Docker for containerization

## Features

- Real-time messaging (direct and group chats)
- User authentication and authorization (JWT-based authentication)
- Friend system (add friends, accept/reject requests)
- User profiles with customizable information
- Group chat management (create and manage groups)
- Secure communication with JWT
- Cross-platform support (iOS and Android)
- Data persistence with MongoDB

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (LTS version)
- Java Development Kit (JDK) 17+
- MongoDB
- Docker and Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Setup Instructions

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo-url.git
   cd backend
   ```
2. Build the project:
   ```bash
   ./gradlew build
   ```
3. Start MongoDB and backend services using Docker:
   ```bash
   docker-compose up -d
   ```
4. Run the Spring Boot application:
   ```bash
   ./gradlew bootRun
   ```
5. The backend server will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npm start
   ```
4. Choose your platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical devices

## Environment Configuration

### Backend Configuration
Create an `application.properties` file in `backend/src/main/resources/`:
```properties
spring.data.mongodb.uri=mongodb://localhost:27017/chatapp
jwt.secret=your_jwt_secret_key
jwt.expiration=86400000
```

### Frontend Configuration
Create a `.env` file in the frontend directory:
```env
API_URL=http://localhost:8080
```

## Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/
│   │   │       ├── controllers/
│   │   │       ├── models/
│   │   │       ├── repositories/
│   │   │       ├── services/
│   │   │       ├── security/
│   │   │       └── config/
│   │   └── resources/
│   └── test/
├── build.gradle
└── docker-compose.yml
```

### Frontend Structure
```
frontend/
├── app/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   ├── context/
│   ├── constants/
│   └── utils/
├── assets/
└── package.json
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login

### Profile
- GET `/api/profile` - Get user profile
- PUT `/api/profile/update` - Update profile
- PUT `/api/profile/update-password` - Update password

### Friends
- POST `/api/friends/add` - Send friend request
- POST `/api/friends/accept/{requestToken}` - Accept friend request
- POST `/api/friends/reject/{requestToken}` - Reject friend request
- GET `/api/friends/pending` - Get pending friend requests
- GET `/api/friends` - Get friend list

### Messages
- GET `/api/conversations/{userId}` - Get user conversations
- GET `/api/messages/{conversationId}` - Get conversation messages
- POST `/api/messages/send` - Send message
- POST `/api/messages/create` - Create new conversation

### Groups
- GET `/api/groups` - Get user groups
- POST `/api/groups/create` - Create new group
- GET `/api/groups/{groupId}` - Get group details
- POST `/api/groups/{groupId}/send` - Send group message
- POST `/api/groups/{groupId}/add-member` - Add member to group

## Security Notes

Current implementation includes:
- Basic encryption and authentication (JWT-based authentication)
- Secure WebSocket connections for real-time messaging

For production:
- Implement proper password hashing
- Add HTTPS
- Set up CORS properly
- Use secure WebSocket connections
- Implement proper session management

## Deployment

### Backend Deployment

1. Build the JAR file:
   ```bash
   ./gradlew bootJar
   ```
2. Build and push Docker image:
   ```bash
   docker build -t chatapp-backend .
   ```

### Frontend Deployment

1. Build the Expo app:
   ```bash
   expo build:android  # For Android
   expo build:ios      # For iOS
   ```
2. Follow the Expo deployment guides for publishing to app stores.

## Demo Video

[Download and Watch the Demo](video.mp4)

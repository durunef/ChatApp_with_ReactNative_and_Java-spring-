db = db.getSiblingDB('userdb');

// Create collections if they don't exist
db.createCollection('groups');
db.createCollection('users');
db.createCollection('conversations');
db.createCollection('friend_requests');

// Create indexes for groups collection
db.groups.createIndex({ "name": 1 });
db.groups.createIndex({ "creatorId": 1 });
db.groups.createIndex({ "memberIds": 1 });

// Create indexes for users collection
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 });

// Create indexes for conversations
db.conversations.createIndex({ "participants": 1 });

// Create indexes for friend requests
db.friend_requests.createIndex({ "receiverId": 1, "status": 1 });
db.friend_requests.createIndex({ "senderId": 1, "receiverId": 1 }, { unique: true });
db.friend_requests.createIndex({ "requestToken": 1 });

// Remove _class field from all collections
db.users.updateMany({}, { $unset: { _class: "" } });
db.friend_requests.updateMany({}, { $unset: { _class: "" } });
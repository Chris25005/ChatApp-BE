
Project Overview
This backend provides:
•	User authentication (register & login)
•	Secure password hashing
•	Real-time messaging using Socket.IO
•	Online/offline user tracking
•	Typing indicators
•	Message delivery & read receipts
•	MongoDB data persistence
•	CORS-enabled access for deployed frontend (Netlify)
It is designed to support both local development and production deployment on Render.
________________________________________
🛠️ Tech Stack
•	Node.js
•	Express.js
•	MongoDB
•	Mongoose
•	Socket.IO
•	JWT (JSON Web Tokens)
•	bcryptjs
•	dotenv
•	Render (Deployment)

Prerequisites
Ensure you have the following installed:
•	Node.js (v18 or higher)
•	npm (v9 or higher)
•	MongoDB
o	Local MongoDB OR
o	MongoDB Atlas (recommended for production)
Socket.IO Events
Client → Server
•	user-online
•	sendMessage
•	messageDelivered
•	messageSeen
•	typing
•	stopTyping
Server → Client
•	online-users
•	receiveMessage
•	messageDelivered
•	messageSeen
•	typing
•	stopTyping
________________________________________
🗄️ Database Models
👤 User Model
•	name
•	phone (unique)
•	password (hashed)
•	lastSeen
•	timestamps
________________________________________
💬 Message Model
•	senderId
•	receiverId
•	text
•	status (sent / delivered / seen)
•	timestamps

uture Enhancements
•	JWT-secured Socket.IO connections
•	Group chats
•	Media messages
•	Message deletion/editing
•	Rate limiting
•	Logging & monitoring


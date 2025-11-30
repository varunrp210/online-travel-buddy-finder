# Travel Buddy - Online Travel Buddy Finder for Students

A full-stack web application that helps students find travel companions for their adventures.

## Features

- **User Authentication**: Login, Signup, and Logout functionality
- **Dashboard**: Overview of plans, packages, requests, and chats
- **Travel Plans**: Create and manage travel plans
- **Travel Packages**: Share and browse travel packages
- **Find Buddy**: Search for travel buddies by name, university, interests, or location
- **Buddy Requests**: Send, receive, accept, or reject buddy requests
- **Transport Planner**: Choose bike/car/bus/train with curated schedules
- **Quick Packages**: One-click packages for Goa, Hampi, Mumbai, Chennai
- **Real-time Chat**: Chat with your travel buddies using Socket.io
- **Profile Management**: Update your profile, interests, and location

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io for real-time chat
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React
- React Router for navigation
- Axios for API calls
- Socket.io-client for real-time chat
- CSS for styling

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd travelbuddy
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `server` directory (you can copy from `server/.env.template`):
   ```
   MONGODB_URI=mongodb://localhost:27017/travelbuddy
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```
   
   **Important Notes:**
   - `MONGODB_URI` and `JWT_SECRET` are **required**
   - `GOOGLE_MAPS_API_KEY` is **optional** - needed only for Google Maps recommendations in Nearby Places
   - If Google Maps API key is not set, the app will use custom places from the database
   
   **To get Google Maps API Key (Optional):**
   1. Go to [Google Cloud Console](https://console.cloud.google.com/)
   2. Create a new project or select existing one
   3. Enable "Places API" (required) and optionally "Maps JavaScript API"
   4. Go to "Credentials" and create an API key
   5. Copy the API key to your `.env` file
   6. See `SETUP_GOOGLE_MAPS.md` for detailed instructions

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system. If using MongoDB Atlas, update the `MONGODB_URI` in the `.env` file.

5. **Run the application**
   
   For development (runs both server and client):
   ```bash
   npm run dev
   ```
   
   Or run separately:
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend
   npm run client
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
travelbuddy/
├── server/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── index.js         # Server entry point
│   └── package.json
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # React context (Auth)
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user by ID

### Plans
- `GET /api/plans` - Get all plans
- `POST /api/plans` - Create plan
- `GET /api/plans/:id` - Get plan by ID
- `PUT /api/plans/:id` - Update plan
- `DELETE /api/plans/:id` - Delete plan

### Packages
- `GET /api/packages` - Get all packages
- `POST /api/packages` - Create package
- `GET /api/packages/:id` - Get package by ID
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package

### Buddies
- `POST /api/buddies/request` - Send buddy request
- `GET /api/buddies/requests` - Get buddy requests
- `PUT /api/buddies/requests/:id` - Accept/Reject request
- `GET /api/buddies/nearby` - Find nearby buddies

### Places
- `GET /api/places` - Get all places
- `POST /api/places` - Add place
- `GET /api/places/nearby` - Find nearby places
- `GET /api/places/:id` - Get place by ID

### Chat
- `GET /api/chat` - Get all chats
- `GET /api/chat/:userId` - Get or create chat with user
- `POST /api/chat/:chatId/message` - Send message

## Database Models

- **User**: User accounts with profile information
- **Plan**: Travel plans created by users
- **Package**: Travel packages shared by users
- **BuddyRequest**: Buddy requests between users
- **Chat**: Chat conversations between users
- **Place**: Lodges, restaurants, and tourist spots

## Features in Detail

### Authentication
- Secure password hashing with bcryptjs
- JWT token-based authentication
- Protected routes on frontend

### Find Buddy
- Search by name, email, university, or interests
- Find nearby buddies using geolocation
- View user profiles and send requests

### Real-time Chat
- Socket.io for instant messaging
- Online/offline status
- Message history

### Nearby Places
- Add lodges, restaurants, and tourist spots
- Find places near your location
- Filter by place type

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Admin Setup

To create the first admin/owner account:

1. **Using npm script (Recommended):**
   ```bash
   cd server
   npm run create-admin
   ```
   
   Or with custom credentials:
   ```bash
   npm run create-admin your-email@example.com your-password "Your Name"
   ```

2. **Using environment variables:**
   Add to `server/.env`:
   ```
   ADMIN_EMAIL=admin@travelbuddy.com
   ADMIN_PASSWORD=admin123
   ```
   Then run: `npm run create-admin`

3. **Login with admin credentials:**
   - Go to the login page
   - Use the email and password you set
   - You'll see an "Admin" button in the navbar
   - Click it to access the admin dashboard

### Admin Features

- **Owner Role**: Only one owner can exist. Owner has full control including:
  - Delete any user (except other owners)
  - Change user roles
  - Access all admin features
  
- **Admin Role**: Can be assigned to multiple users. Admins can:
  - View all data (users, plans, packages, etc.)
  - Delete plans, packages, places
  - View statistics
  - Cannot delete users or change roles (only owner can)

### Admin Dashboard Features

- View overall statistics
- Manage all users
- View and delete all plans
- View and delete all packages
- View all buddy requests
- View all chats
- View and delete all places

## Support

For issues and questions, please open an issue on GitHub.


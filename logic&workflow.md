# SnipStash Backend - Logic & Workflow Documentation

## Overview
SnipStash is a modern code snippet management system built with Node.js, Express.js, and PostgreSQL. The backend provides RESTful APIs for user authentication, snippet management, folder organization, and auto-tagging functionality.

## 🏗️ Architecture Overview
- **Framework**: Express.js with Node.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT-based with email OTP verification
- **Email Service**: Nodemailer/Mailjet integration
- **Auto-tagging**: Rule-based pattern matching system

---

## 📋 Phase 1: Application Initialization & Configuration

### 1.1 Server Setup (`server.js`)
The application starts by initializing the Express server with essential middleware and configurations.

**Key Components:**
- **Environment Configuration**: Loads environment variables using `dotenv`
- **Database Connection**: Establishes PostgreSQL connection via Sequelize
- **CORS Configuration**: Enables cross-origin requests with specific headers
- **Request Logging**: Comprehensive logging middleware for debugging
- **Route Registration**: Mounts API routes with proper prefixes

**Initialization Flow:**
```javascript
1. Load environment variables
2. Initialize Express app
3. Set up middleware (CORS, JSON parser, logging)
4. Register API routes (/api/auth, /api/snippets, /api/tags, /api/folders)
5. Connect to PostgreSQL database
6. Sync database models
7. Start server on specified port
```

**Key Configuration:**
- **Port**: Environment variable `PORT` or default 5000
- **Database**: PostgreSQL with SSL configuration
- **CORS**: Allows all origins with specific methods and headers

### 1.2 Database Configuration (`config/database.js`)
Establishes PostgreSQL connection with production-ready SSL settings.

**Configuration Details:**
- **Dialect**: PostgreSQL
- **SSL**: Required with `rejectUnauthorized: false`
- **Connection Pooling**: Managed by Sequelize
- **Environment Variables**: Host, port, username, password, database name

---

## 📊 Phase 2: Data Models & Database Schema

### 2.1 Core Models Structure

**User Model (`models/User.js`)**
```javascript
Fields:
- id: Primary key (auto-increment)
- email: Unique, validated email address
- password: Hashed using bcrypt (salt rounds: 10)
- name: User's display name
- createdAt/updatedAt: Timestamps

Features:
- Password hashing on create/update
- comparePassword method for authentication
- Validation for email format
```

**Snippet Model (`models/Snippet.js`)**
```javascript
Fields:
- id: Primary key
- title: Snippet title (required)
- code: Snippet content (TEXT field)
- language: Programming language
- description: Optional description
- userId: Foreign key to User
- copyCount: Usage tracking (default: 0)
- lastCopiedAt: Last usage timestamp

Features:
- Belongs to User
- Many-to-many with Tags and Folders
- Usage tracking capabilities
```

**Tag Model (`models/Tag.js`)**
```javascript
Fields:
- id: Primary key
- name: Unique tag name

Features:
- Many-to-many with Snippets
- Automatic creation during snippet tagging
```

**Folder Model (`models/Folder.js`)**
```javascript
Fields:
- id: Primary key
- name: Folder name
- userId: Foreign key to User

Features:
- Belongs to User
- Many-to-many with Snippets
- Unique name per user
```

### 2.2 Association Models

**SnippetTag (`models/SnippetTag.js`)**
- Junction table for Snippet-Tag many-to-many relationship

**SnippetFolder (`models/SnippetFolder.js`)**
- Junction table for Snippet-Folder many-to-many relationship

**UsageLog (`models/UsageLog.js`)**
- Tracks snippet usage analytics
- Fields: userId, snippetId, action, timestamp

**OTPToken (`models/OTPToken.js`)**
- Stores email verification tokens
- Fields: email, token, expiresAt, purpose

### 2.3 Database Relationships (`models/index.js`)
```javascript
User Relationships:
- hasMany: Snippets, Folders, UsageLogs

Snippet Relationships:
- belongsTo: User
- belongsToMany: Tags (through SnippetTag)
- belongsToMany: Folders (through SnippetFolder)
- hasMany: UsageLogs

Tag/Folder Relationships:
- belongsToMany: Snippets (through respective junction tables)
```

---

## 🔐 Phase 3: Authentication & Authorization System

### 3.1 Traditional Authentication (`controllers/authController.js`)

**Registration Process:**
1. Validate required fields (name, email, password)
2. Check if user already exists
3. Hash password using bcrypt
4. Create user record
5. Generate JWT token
6. Return user data with token

**Login Process:**
1. Validate email and password
2. Find user by email
3. Compare provided password with hashed password
4. Generate JWT token
5. Return user data with token

**User Profile (`/api/auth/me`):**
- Protected route requiring JWT token
- Returns current user information (excluding password)

### 3.2 Email-Based Authentication (`controllers/emailAuthController.js`)

**Email Verification for Signup:**
1. **Request OTP** (`/api/auth/email/request-verification`):
   - Validate email and name
   - Check if user already exists
   - Generate 6-digit OTP
   - Store OTP with 10-minute expiration
   - Send verification email
   - Return success status

2. **Verify Signup OTP** (`/api/auth/email/verify-signup`):
   - Validate OTP against stored token
   - Create new user account
   - Generate JWT token
   - Return user data with token

**Passwordless Login:**
1. **Request Login OTP** (`/api/auth/email/request-login`):
   - Validate email
   - Check if user exists
   - Generate 6-digit OTP
   - Store OTP with expiration
   - Send login email
   - Return success status

2. **Verify Login OTP** (`/api/auth/email/verify-login`):
   - Validate OTP
   - Find existing user
   - Generate JWT token
   - Return user data with token

### 3.3 Authentication Middleware (`middleware/auth.js`)

**JWT Protection (`protect` middleware):**
1. Extract token from Authorization header
2. Verify JWT token signature
3. Decode user information
4. Fetch user from database
5. Attach user to request object
6. Allow request to continue or reject with 401

**Security Features:**
- Bearer token validation
- Token expiration handling
- User existence verification
- Comprehensive error logging

### 3.4 Utility Functions (`utils/authUtils.js`)

**OTP Management:**
- `generateOTP()`: Creates 6-digit random code
- `storeOTP()`: Saves OTP with expiration
- `verifyOTP()`: Validates OTP and removes if valid
- `generateJWT()`: Creates JWT tokens with user data

---

## 🚀 Phase 4: Core Business Logic - Snippet Management

### 4.1 Snippet Creation (`snippetController.js - createSnippet`)

**Creation Flow:**
1. **Input Validation**: Verify title, code, and language are provided
2. **Auto-tagging**: Apply rule-based tagging to code content
3. **Database Transaction**: Ensure data consistency
4. **Snippet Creation**: Create main snippet record
5. **Tag Processing**: Find or create tags, associate with snippet
6. **Response**: Return created snippet with associated tags

**Auto-tagging Integration:**
- Combines manual tags with auto-detected tags
- Uses pattern matching for common code structures
- Deduplicates tags (case-insensitive)

### 4.2 Snippet Retrieval (`snippetController.js - getSnippets`)

**Advanced Filtering System:**
1. **Base Query**: Filter by user ID
2. **Language Filter**: Support for specific languages or 'all'
3. **Tag Filter**: Multiple tag filtering (comma-separated)
4. **Search Query**: Full-text search across title, code, description
5. **Folder Filter**: Filter by specific folder ID
6. **Sorting Options**:
   - Default: Creation date (newest first)
   - Most used: By copy count
   - Recently used: By last copied date

**Query Building Process:**
```javascript
1. Start with user-scoped WHERE clause
2. Apply language filter (if not 'all')
3. Add search conditions (OR across multiple fields)
4. Include tag associations with filtering
5. Include folder associations
6. Apply sorting based on sortBy parameter
7. Execute query and return results
```

### 4.3 Snippet Operations

**Individual Snippet Retrieval (`getSnippetById`):**
- Fetch snippet by ID and user ownership
- Include associated tags and folders
- Return 404 if not found or not owned by user

**Snippet Update (`updateSnippet`):**
- Validate ownership
- Support partial updates
- Re-apply auto-tagging if code changes
- Update tag associations in transaction
- Maintain data consistency

**Snippet Deletion (`deleteSnippet`):**
- Verify ownership
- Use database transaction
- Remove all associations (tags, folders, usage logs)
- Delete snippet record
- Ensure referential integrity

### 4.4 Usage Tracking

**Copy Tracking (`copySnippet`):**
- Increment copy count
- Update last copied timestamp
- Log usage for analytics
- Return updated snippet data

**Usage Logging (`logSnippetUsage`):**
- Record user actions (copy, view, edit)
- Store timestamp and action type
- Support analytics and insights

---

## 📁 Phase 5: Organization Features - Folders & Tags

### 5.1 Folder Management (`controllers/folderController.js`)

**Folder Creation:**
1. Validate folder name
2. Check for duplicate names per user
3. Create folder record
4. Return created folder

**Folder Operations:**
- **List Folders**: Get all user folders with snippet counts
- **Get Folder**: Retrieve specific folder with snippets and tags
- **Update Folder**: Rename with duplicate checking
- **Delete Folder**: Remove folder and all snippet associations

**Folder-Snippet Associations:**
- **Add Snippets to Folders**: Bulk association with validation
- **Remove Snippet from Folder**: Individual association removal
- **Transaction Safety**: Ensure data consistency

### 5.2 Tag Management (`controllers/tagController.js`)

**Tag Operations:**
- **List Tags**: Get all tags used by user
- **Auto-creation**: Tags created automatically during snippet operations
- **Association Management**: Handle many-to-many relationships

### 5.3 Auto-tagging System (`utils/autoTagger.js`)

**Rule-based Pattern Matching:**
```javascript
Tag Rules:
- 'loop': /\b(for|while|forEach|do\s+while)\b/i
- 'API': /\b(fetch|axios|XMLHttpRequest|http\.get|\.ajax|\.post|api\.)\b/i
- 'error handling': /\b(try|catch|throw|finally|Error\()\b/i
- 'debugging': /\b(console\.log|console\.debug|debugger)\b/i
- 'async': /\b(async|await|Promise|then)\b/i
- 'DOM': /\b(document\.|querySelector|getElementById)\b/i
- 'timing': /\b(setTimeout|setInterval)\b/i
- 'OOP': /\b(class|constructor|extends|super|this\.)\b/i
- 'module': /\b(import|export|require|from)\b/i
- 'SQL': /\b(SELECT|INSERT|UPDATE|DELETE|JOIN|WHERE)\b/i
- 'auth': /\b(token|JWT|authenticate|authorization)\b/i
```

**Auto-tagging Process:**
1. Analyze code content and description
2. Apply regex patterns to detect code features
3. Combine with manually provided tags
4. Remove duplicates (case-insensitive)
5. Return final tag list

---

## 🌐 Phase 6: API Routes & Endpoints

### 6.1 Authentication Routes (`routes/authRoutes.js`)

**Traditional Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

**Email-based Authentication:**
- `POST /api/auth/email/request-verification` - Request signup OTP
- `POST /api/auth/email/verify-signup` - Verify signup OTP
- `POST /api/auth/email/request-login` - Request login OTP
- `POST /api/auth/email/verify-login` - Verify login OTP

### 6.2 Snippet Routes (`routes/snippetRoutes.js`)

**All routes protected by JWT middleware**

**Core CRUD Operations:**
- `POST /api/snippets` - Create snippet
- `GET /api/snippets` - List snippets with filtering
- `GET /api/snippets/:id` - Get specific snippet
- `PUT /api/snippets/:id` - Update snippet
- `DELETE /api/snippets/:id` - Delete snippet

**Usage Tracking:**
- `POST /api/snippets/:id/log-usage` - Log snippet usage
- `POST /api/snippets/:id/copy` - Track snippet copy

**Folder Management:**
- `POST /api/snippets/:id/folders` - Add snippet to folders
- `DELETE /api/snippets/:id/folders/:folderId` - Remove from folder

### 6.3 Folder Routes (`routes/folderRoutes.js`)

**Folder Operations:**
- `POST /api/folders` - Create folder
- `GET /api/folders` - List user folders
- `GET /api/folders/:id` - Get specific folder
- `PATCH /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

### 6.4 Tag Routes (`routes/tagRoutes.js`)

**Tag Operations:**
- `GET /api/tags` - List all user tags

### 6.5 Query Parameters & Filtering

**Snippet Filtering (`GET /api/snippets`):**
- `language`: Filter by programming language
- `tag`: Filter by single tag
- `tags`: Filter by multiple tags (comma-separated)
- `query`: Search in title, code, description
- `sortBy`: Sort order (newest, most-used, recently-used)
- `folderId`: Filter by folder

---

## 🔧 Phase 7: Utility Systems & Error Handling

### 7.1 Email System (`config/email.js`)

**Email Configuration:**
- Multiple provider support (Nodemailer, Mailjet)
- Template-based email generation
- HTML and text email formats

**Email Templates:**
- **Verification Email**: Welcome message with OTP
- **Login Email**: Passwordless login with OTP
- **Custom Styling**: Professional email templates

### 7.2 Error Handling Strategy

**Consistent Error Response Format:**
```javascript
{
  "message": "Error description",
  "error": "Error code (in development)",
  "statusCode": 400/401/404/500
}
```

**Error Types:**
- **400 Bad Request**: Invalid input, validation errors
- **401 Unauthorized**: Authentication failures
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

**Error Handling Patterns:**
1. **Input Validation**: Check required fields and formats
2. **Database Errors**: Handle constraint violations, connection issues
3. **Authentication Errors**: Invalid tokens, expired sessions
4. **Authorization Errors**: Access to resources not owned by user
5. **Transaction Rollback**: Ensure data consistency on failures

### 7.3 Logging & Debugging

**Request Logging:**
- HTTP method and URL
- Request headers and body
- Response status and body (truncated)
- Timestamp for each request

**Error Logging:**
- Stack traces for debugging
- Database operation errors
- Authentication failures
- Email sending failures

### 7.4 Security Measures

**Authentication Security:**
- JWT token expiration (30 days)
- Password hashing with bcrypt (10 salt rounds)
- OTP expiration (10 minutes)
- Bearer token validation

**Data Protection:**
- User data isolation (userId filtering)
- SQL injection prevention (Sequelize ORM)
- Input validation and sanitization
- CORS configuration

**API Security:**
- Rate limiting considerations
- Input validation middleware
- Error message sanitization
- Secure headers configuration

---

## 📈 Performance Considerations

### Database Optimization:
- Proper indexing on foreign keys
- Efficient queries with minimal N+1 problems
- Transaction usage for data consistency
- Connection pooling via Sequelize

### Memory Management:
- Efficient JSON parsing
- Limited response sizes
- Proper error handling to prevent memory leaks

### Scalability Features:
- Stateless JWT authentication
- Database-agnostic ORM usage
- Modular controller structure
- Environment-based configuration

---

## 🔄 Request-Response Flow Summary

**Typical API Request Flow:**
1. **Request Reception**: Express receives HTTP request
2. **Logging**: Request details logged for debugging
3. **CORS Check**: Cross-origin validation
4. **Authentication**: JWT token validation (if protected route)
5. **Route Matching**: Express router matches URL to controller
6. **Controller Logic**: Business logic execution
7. **Database Operations**: Data retrieval/manipulation via Sequelize
8. **Response Generation**: JSON response creation
9. **Response Logging**: Response details logged
10. **Client Response**: HTTP response sent to client

This comprehensive workflow ensures robust, scalable, and maintainable code snippet management with advanced features like auto-tagging, folder organization, and multiple authentication methods. 
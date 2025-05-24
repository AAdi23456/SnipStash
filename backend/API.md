# SnipStash API Documentation

This document provides detailed information about the SnipStash API endpoints, including request/response examples.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints except authentication endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Authentication Endpoints

### Register User
- **URL**: `/auth/register`
- **Method**: `POST`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```
- **Response**:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```
- **Response**:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### Get Current User
- **URL**: `/auth/me`
- **Method**: `GET`
- **Headers**: Required JWT token
- **Response**:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "user@example.com"
}
```

### Email Verification (Signup)
- **URL**: `/auth/email/request-verification`
- **Method**: `POST`
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### Verify Signup OTP
- **URL**: `/auth/email/verify-signup`
- **Method**: `POST`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Request Login OTP
- **URL**: `/auth/email/request-login`
- **Method**: `POST`
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Login OTP sent successfully"
}
```

### Verify Login OTP
- **URL**: `/auth/email/verify-login`
- **Method**: `POST`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
- **Response**:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

## Snippet Endpoints

### Create Snippet
- **URL**: `/snippets`
- **Method**: `POST`
- **Headers**: Required JWT token
- **Request Body**:
```json
{
  "title": "My Snippet",
  "content": "console.log('Hello World');",
  "language": "javascript",
  "description": "A simple logging example",
  "tags": ["logging", "javascript", "example"]
}
```
- **Response**:
```json
{
  "id": 1,
  "title": "My Snippet",
  "content": "console.log('Hello World');",
  "language": "javascript",
  "description": "A simple logging example",
  "tags": ["logging", "javascript", "example"],
  "userId": 1,
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get All Snippets
- **URL**: `/snippets`
- **Method**: `GET`
- **Headers**: Required JWT token
- **Query Parameters**:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `search` (optional): Search term
  - `language` (optional): Filter by language
  - `tags` (optional): Filter by tags (comma-separated)
- **Response**:
```json
{
  "snippets": [
    {
      "id": 1,
      "title": "My Snippet",
      "content": "console.log('Hello World');",
      "language": "javascript",
      "description": "A simple logging example",
      "tags": ["logging", "javascript", "example"],
      "userId": 1,
      "createdAt": "2024-01-20T12:00:00Z",
      "updatedAt": "2024-01-20T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "pages": 1
  }
}
```

### Get Snippet by ID
- **URL**: `/snippets/:id`
- **Method**: `GET`
- **Headers**: Required JWT token
- **Response**:
```json
{
  "id": 1,
  "title": "My Snippet",
  "content": "console.log('Hello World');",
  "language": "javascript",
  "description": "A simple logging example",
  "tags": ["logging", "javascript", "example"],
  "userId": 1,
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Update Snippet
- **URL**: `/snippets/:id`
- **Method**: `PUT`
- **Headers**: Required JWT token
- **Request Body**:
```json
{
  "title": "Updated Snippet",
  "content": "console.log('Updated!');",
  "language": "javascript",
  "description": "An updated example",
  "tags": ["updated", "javascript", "example"]
}
```
- **Response**:
```json
{
  "id": 1,
  "title": "Updated Snippet",
  "content": "console.log('Updated!');",
  "language": "javascript",
  "description": "An updated example",
  "tags": ["updated", "javascript", "example"],
  "userId": 1,
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Delete Snippet
- **URL**: `/snippets/:id`
- **Method**: `DELETE`
- **Headers**: Required JWT token
- **Response**:
```json
{
  "success": true,
  "message": "Snippet deleted successfully"
}
```

### Log Snippet Usage
- **URL**: `/snippets/:id/log-usage`
- **Method**: `POST`
- **Headers**: Required JWT token
- **Response**:
```json
{
  "success": true,
  "usageCount": 5
}
```

### Copy Snippet
- **URL**: `/snippets/:id/copy`
- **Method**: `POST`
- **Headers**: Required JWT token
- **Response**:
```json
{
  "success": true,
  "content": "console.log('Hello World');"
}
```

## Tag Endpoints

### Get User Tags
- **URL**: `/tags`
- **Method**: `GET`
- **Headers**: Required JWT token
- **Response**:
```json
{
  "tags": [
    {
      "id": 1,
      "name": "javascript",
      "count": 5
    },
    {
      "id": 2,
      "name": "python",
      "count": 3
    }
  ]
}
```

## Folder Endpoints

### Create Folder
- **URL**: `/folders`
- **Method**: `POST`
- **Headers**: Required JWT token
- **Request Body**:
```json
{
  "name": "JavaScript Snippets",
  "description": "Collection of useful JavaScript code snippets"
}
```
- **Response**:
```json
{
  "id": 1,
  "name": "JavaScript Snippets",
  "description": "Collection of useful JavaScript code snippets",
  "userId": 1,
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Get All Folders
- **URL**: `/folders`
- **Method**: `GET`
- **Headers**: Required JWT token
- **Response**:
```json
{
  "folders": [
    {
      "id": 1,
      "name": "JavaScript Snippets",
      "description": "Collection of useful JavaScript code snippets",
      "userId": 1,
      "snippetCount": 5,
      "createdAt": "2024-01-20T12:00:00Z",
      "updatedAt": "2024-01-20T12:00:00Z"
    }
  ]
}
```

### Get Folder by ID
- **URL**: `/folders/:id`
- **Method**: `GET`
- **Headers**: Required JWT token
- **Response**:
```json
{
  "id": 1,
  "name": "JavaScript Snippets",
  "description": "Collection of useful JavaScript code snippets",
  "userId": 1,
  "snippets": [
    {
      "id": 1,
      "title": "My Snippet",
      "language": "javascript",
      "description": "A simple logging example"
    }
  ],
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Update Folder
- **URL**: `/folders/:id`
- **Method**: `PATCH`
- **Headers**: Required JWT token
- **Request Body**:
```json
{
  "name": "Updated JavaScript Snippets",
  "description": "Updated collection description"
}
```
- **Response**:
```json
{
  "id": 1,
  "name": "Updated JavaScript Snippets",
  "description": "Updated collection description",
  "userId": 1,
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Delete Folder
- **URL**: `/folders/:id`
- **Method**: `DELETE`
- **Headers**: Required JWT token
- **Response**:
```json
{
  "success": true,
  "message": "Folder deleted successfully"
}
```

### Add Snippet to Folders
- **URL**: `/snippets/:id/folders`
- **Method**: `POST`
- **Headers**: Required JWT token
- **Request Body**:
```json
{
  "folderIds": [1, 2, 3]
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Snippet added to folders successfully"
}
```

### Remove Snippet from Folder
- **URL**: `/snippets/:id/folders/:folderId`
- **Method**: `DELETE`
- **Headers**: Required JWT token
- **Response**:
```json
{
  "success": true,
  "message": "Snippet removed from folder successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### Authentication Error
```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Please provide all required fields"
}
```

### Resource Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
``` 
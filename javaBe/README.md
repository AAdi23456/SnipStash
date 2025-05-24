# SnipStash Java Backend

This is the Java Spring Boot implementation of the SnipStash backend API.

## Technologies Used

- Java 17
- Spring Boot 3.2.3
- Spring Security with JWT Authentication
- Spring Data JPA
- PostgreSQL
- Lombok
- Maven

## Prerequisites

- Java 17 or higher
- Maven
- PostgreSQL database

## Setup Instructions

1. Clone the repository
2. Create a PostgreSQL database named `snipstash`
3. Update `application.yml` with your database credentials
4. Run the following commands:

```bash
cd javaBe
mvn clean install
mvn spring-boot:run
```

The server will start on port 5000.

## Database Schema

The application uses the following entities:

- User
- Snippet
- Tag
- Folder

With relationships:
- User -> Snippets (One-to-Many)
- User -> Folders (One-to-Many)
- Snippet -> Tags (Many-to-Many)
- Snippet -> Folders (Many-to-Many)

## Project Structure

```
src/main/java/com/snipstash/
├── SnipStashApplication.java
├── config/
├── controller/
├── dto/
├── model/
├── repository/
├── security/
└── service/
```

## Features

- User authentication with JWT
- Email verification
- CRUD operations for snippets
- Tag management
- Folder organization
- Snippet search and filtering
- Usage tracking

## Security

- JWT-based authentication
- Password encryption using BCrypt
- CORS configuration
- Stateless session management

## API Documentation

For detailed API documentation, please refer to the `API.md` file in the root directory. 
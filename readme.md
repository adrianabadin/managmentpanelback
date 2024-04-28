# Region X Backend Data Manager

## Implementation
The development is implemented ussing node express typescript passport JS and Prisma JS 
the Database is implemented on CockRoachDB.

## Routes
* /auth/login: Sets session by ussing the required object 
  ```typescript
  {
    "username":"email@example.com",
    "password":"password"
  }
  ```
* /auth/signup: Creates a new user ussing the required object
```typescript
  {
    "username":"email@example.com",
    "password":"password",
    "lastname":"Doeh",
    "name":"John"
  }
  ```
* /auth/logout: Destroy session cookie 
* 
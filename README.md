# Backend Application for Server Management

This project is a backend application designed to centralize the management of multiple servers. It provides a robust architecture using TypeScript, Express, Firebase, and Socket.IO, among other technologies.

## Features

- **Socket.IO Integration**: Real-time communication with servers using WebSocket events.
- **Firebase Authentication**: Secure user authentication and role-based access control.
- **Local Storage Utilities**: Manage local files and cache data efficiently.
- **Logging System**: Save and retrieve logs for debugging and monitoring.
- **Custom Functions**: Easily extendable API functions with authentication and rights management.

## Project Structure

### `src/index.ts`
The entry point of the application. It initializes the Express server, configures SSL, and sets up Socket.IO for real-time communication.

### `src/functions/index.ts`
Defines custom API functions and integrates them with the `TowersFunctionsController`. Includes authentication and rights-checking mechanisms.

### `src/utils`
Contains utility modules for various functionalities:
- **`socket-utils.ts`**: Manages Socket.IO events and communication.
- **`log-utils.ts`**: Handles log storage and retrieval.
- **`local-storage-utils.ts`**: Provides methods to manage local storage, including saving and retrieving files.
- **`firebase-utils.ts`**: Configures Firebase Admin SDK and provides authentication utilities.
- **`cache-utils.ts`**: Implements a simple caching mechanism with expiration support.
- **`user-roles.ts`**: Manages user roles and permissions.

### `src/vars.ts`
Defines constants for paths like certificates, local storage, and logs. These should be updated with your specific paths.

### Configuration Files
- **`tsconfig.json`**: TypeScript configuration for the project.
- **`package.json`**: Lists dependencies and scripts for building and running the project.
- **`nodemon.json`**: Configures `nodemon` for development.
- **`.gitignore`**: Specifies files and directories to exclude from version control.

## How to Use

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Up Environment**:
   - Update `src/vars.ts` with your specific paths for certificates, storage, and logs.
   - Place your Firebase service account JSON file in `src/secrets`.

3. **Run the Application**:
   - For development:
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm run build
     npm start
     ```

4. **Access the API**:
   - The API functions are available under `/api/functions`.

## Example Functionality

### Ping Function
A simple API function to test the server's availability:
```typescript
const ping: CustomFunction = {
    auth: false,
    method: async (req, res) => {
        res.status(200).json({ message: 'pong' });
    }
}
```

### Real-Time Events
Emit server status updates using Socket.IO:
```typescript
SocketUtils.emitServerEvent(serverId, ServerSocketEvents.SERVER_STATUS, { status: 'online' });
```

### Logging
Save logs to a file:
```typescript
LogUtils.saveLog('server1', 'Server started successfully.');
```

### Local Storage
Save a file to the local storage:
```typescript
AppLocalStorage.saveFile('example.txt', Buffer.from('Hello, World!'));
```

## Dependencies

- **TypeScript**: Strongly typed JavaScript.
- **Express**: Web framework for building APIs.
- **Socket.IO**: Real-time communication.
- **Firebase Admin SDK**: Authentication and user management.
- **Towers Express**: Simplifies API function management.

## License

This project is licensed under the MIT License.

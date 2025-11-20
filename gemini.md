# Gemini CLI Context for fitness-mobile-app

**Date:** Thursday, November 13, 2025
**Operating System:** linux
**Current Directory:** /home/henryb45/projects/fitness-mobile-app

## Project Overview

This project is a mobile fitness application built with Expo (React Native) and TypeScript. It is designed as an **offline-first** application, utilizing a local SQLite database as the primary source of truth for the user interface. Data synchronization with a remote Supabase backend is a core feature, ensuring data consistency when the device is online. Key features include user authentication, a dashboard, a unique "Genie" chat functionality, and a user profile.

## Architecture

- **Offline-First Approach**: The application prioritizes local data persistence using `expo-sqlite`. The UI primarily interacts with this local database.
- **Data Synchronization**: A dedicated `syncService` (`src/server/services/sync.ts`) manages the flow of data between the local SQLite database and the remote Supabase backend. It handles:
  - Initializing the local database (`syncService.init()`).
  - Performing full data synchronization (`syncService.fullSync()`) upon user login or app startup.
  - Queuing local changes (`addToSyncQueue`) to be pushed to Supabase.
  - Fetching and updating local data from Supabase (`fetchAndUpdateLocal`).
- **Backend**: Supabase (`@supabase/supabase-js`) serves as the remote database and backend-as-a-service.
- **Routing**: Expo Router (`expo-router`) is used for navigation within the application.
- **State Management**: React Context API (`UserContext.tsx`) and custom hooks (`useUser.ts`) manage application-wide state, particularly user authentication and data.

## Core Features

- **User Authentication**: Secure login and registration process.
- **Dashboard**: Likely displays fitness progress, goals, or summaries.
- **Genie Chat**: A unique feature, possibly an AI assistant or a personalized fitness guide.
- **User Profile**: Allows users to view and manage their information.
- **Offline Data Access**: Users can interact with their data even without an internet connection.

## Folder Structure and Key Components

- **`.env.local`**: Local environment variables.
- **`.gitignore`**: Git ignore rules.
- **`app.json`**: Expo application configuration.
- **`package.json`**: Project dependencies and scripts. Key dependencies include `expo`, `expo-router`, `react-native`, `@supabase/supabase-js`, and `typescript`.
- **`tsconfig.json`**: TypeScript configuration.
- **`.expo/`**: Expo-specific configuration files.
- **`assets/`**: Static assets like icons and splash screens.
- **`node_modules/`**: Project dependencies.

- **`src/`**: Contains the main application source code.
  - **`app/`**: Core application structure, using Expo Router.
    - `_layout.tsx`: The **application's entry point**. It orchestrates the entire startup flow: database initialization (`syncService.init()`), user authentication checks (`useUser`), initial data synchronization (`syncService.fullSync()`), and manages the authentication routing logic. It displays loading indicators or error screens as needed.
    - `(auth)/`: Handles the authentication flow, containing `_layout.tsx`, `login.tsx`, and `register.tsx`.
    - `(tabs)/`: Defines the main tab-based navigation for authenticated users. Includes `genie.tsx`, `index.tsx` (likely the main dashboard/home screen), and `profile.tsx`.
  - **`components/`**: Reusable UI components (e.g., `ThemedCard`, `ThemedText`, `ThemedView`). These components likely adhere to a consistent design system.
  - **`constants/`**: Application-wide constants, such as `Colors.ts`.
  - **`contexts/`**: React Context API providers, notably `UserContext.tsx` for managing user state.
  - **`deprecated/`**: **IMPORTANT:** This folder contains remnants from a proof of concept created by v0. Code here should be considered legacy and is **not** part of the active application logic. The current implementation resides in `src/app` and `src/screens`.
  - **`hooks/`**: Custom React hooks, such as `useUser.ts` for accessing user data and authentication status.
  - **`screens/`**: Top-level views or pages of the application (e.g., `Dashboard.tsx`, `Login.tsx`, `Profile.tsx`). These are the primary UI components rendered within the Expo Router structure.
  - **`server/`**: Server-side logic and data management.
    - `db.ts`: Database interaction logic, likely setting up the SQLite connection.
    - `services/`:
      - `schema.ts`: Defines the schema for the local SQLite database, including tables like `user_profile` and `sync_queue`.
      - `sync.ts`: Contains the core data synchronization logic.
  - **`types/`**: TypeScript type definitions for data structures (e.g., `db.types.ts`, `localstore.types.ts`).
  - **`utils/`**: Utility functions.

## Key Technologies

- **Framework:** Expo (React Native)
- **Language:** TypeScript
- **Routing:** Expo Router
- **State Management:** React Context API (`UserContext.tsx`), custom hooks (`useUser.ts`)
- **Backend/Database:** Supabase (`@supabase/supabase-js` for remote, `expo-sqlite` for local)
- **UI Components:** Themed components suggest a consistent design system.
- **Styling:** `constants/Colors.ts` indicates a defined color palette.

## Actionable Notes

- The `/deprecated` folder should be treated with caution. New features or bug fixes should target the `src/` directory, particularly within `src/app/`, `src/screens/`, and `src/components/`.
- The application's entry point (`src/app/_layout.tsx`) is critical for understanding app initialization, authentication flow, and data synchronization setup.
- Data synchronization is a key feature, managed by `syncService` in `src/server/services/sync.ts`. Understanding this service is crucial for debugging data-related issues.
- The local SQLite database (`src/server/services/schema.ts`) is the primary source of truth for the UI. Changes should be made with synchronization in mind.

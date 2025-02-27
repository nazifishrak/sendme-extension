# README.md

# Raycast Extension

This project is a Raycast extension that provides a simple command to greet the user.

## Project Structure

```
raycast-extension
├── src
│   ├── index.tsx         # Entry point of the extension
│   ├── commands
│   │   └── hello.tsx     # Command to greet the user
│   └── types
│       └── index.ts      # Type definitions for the extension
├── package.json           # NPM configuration file
├── tsconfig.json          # TypeScript configuration file
├── .gitignore             # Git ignore file
└── README.md              # Project documentation
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd raycast-extension
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Build the project:
   ```
   npm run build
   ```

5. Run the extension in Raycast.

## Usage

To use the extension, simply invoke the "Hello" command from within Raycast. It will greet you with a friendly message!
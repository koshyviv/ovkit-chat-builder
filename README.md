
# Warehouse Layout Generator

This application helps users design warehouse layouts through a chat interface powered by OpenAI's GPT-4o-mini. The application collects warehouse specifications through natural conversation and visualizes the resulting layout.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```
3. Create a `.env` file based on `.env.example` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Running the Application

This application has two parts that need to be run:

1. **Start the backend server**:
   ```
   node server.js
   ```
   This will start the server on port 3001.

2. **Start the frontend development server**:
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```
   This will start the frontend application.

### Building for Production

To build the application for production:

```
npm run build
```
or
```
yarn build
```

The build files will be in the `dist` folder. After building, you can run both the backend and frontend with:

```
node server.js
```

## Features

- Interactive chat interface for collecting warehouse specifications
- Integration with OpenAI GPT-4o-mini for natural language processing
- 2D and 3D visualization of warehouse layouts
- Storage and retrieval of warehouse configurations
- Visual indicators for configuration progress
- Excel file generation for warehouse data export

## Configuration

The application collects the following warehouse attributes:

- Length (in meters)
- Width (in meters)
- Height (in meters)
- Pallet Type
- Storage Capacity (number of pallets)
- Storage Type

## API Key

The application requires an OpenAI API key. Create a `.env` file with your API key as shown in the installation instructions.

## Data Storage

Warehouse configurations are stored in `data/warehouse-config.json` on the server. Excel files are generated as `data/warehouse-data.xlsx`. This allows configurations to persist between sessions.

## License

[MIT License](LICENSE)

# AI Component Builder

## Support Us on Patreon

Become a patron to access over 300 LLM projects that you can download and use, plus my 1000x Cursor Course with 26 chapters and over 16 hours of content teaching how to code better with Cursor. [Support us on Patreon](https://www.patreon.com/c/echohive42).

[![AI Component Builder Preview](https://img.youtube.com/vi/vJ9KW-fBkT8/0.jpg)](https://youtu.be/vJ9KW-fBkT8)

You can play the video directly by clicking on the thumbnail image. This will open the video in the same tab.

## Overview

The AI Component Builder is a web application that allows users to generate and modify UI components using AI. The application leverages the power of the Claude model to create responsive and well-structured components based on user prompts.

## How It Works

### Main Components

1. **app.js**: This file contains the client-side JavaScript code that handles user interactions, component generation, and modifications. It includes functions for dragging and managing the layers of components on the canvas.

2. **index.html**: This is the main HTML file that sets up the structure of the application. It includes the canvas where components are added, as well as the input modal for user prompts.

3. **main.py**: This is the server-side code written in FastAPI. It handles incoming requests to generate or modify components using the Claude model. The server processes the user prompts and returns the generated components.

### User Interaction

1. **Adding Components**: Users can click on the canvas to open an input modal where they can describe the component they want to generate. The description is sent to the server, which uses the Claude model to generate the component and return it to the client.

2. **Modifying Components**: Users can select existing components on the canvas and modify them by providing new instructions. The server processes these instructions and returns the modified component.

3. **Dragging**: Components on the canvas can be dragged. The application ensures that components do not exceed the boundaries of the canvas.

4. **Layer Management**: Users can move components forward or backward in the layer stack to manage their visibility and positioning.

### Key Functions

- **generateComponent**: Sends a user prompt to the server to generate a new component.
- **handleComponentResponse**: Processes the server's response and updates the canvas with the new or modified component.
- **drag**: Handles the dragging of components on the canvas.
- **selectComponent**: Selects a component for editing or modification.
- **deselectComponent**: Deselects the currently selected component.

### Server-Side Processing

The server uses the Claude model to generate or modify components based on user prompts. It ensures that the components are well-structured and styled using Tailwind CSS. The server processes both new component generation and modifications to existing components.

### Example Usage

1. **Generating a New Component**:
   - Click on the canvas to open the input modal.
   - Enter a description of the component you want to generate.
   - Click the send button to generate the component.

2. **Modifying an Existing Component**:
   - Select the component you want to modify.
   - Enter the new instructions in the input modal.
   - Click the send button to apply the modifications.

3. **Dragging**:
   - Click and drag a component to move it around the canvas.

4. **Layer Management**:
   - Use the control icons to move components forward or backward in the layer stack.

### Playing the Video

You can play the video directly by clicking on the thumbnail image or the play button icon. Both links will open the video in the same tab.

### Running the Application from GitHub

To run the AI Component Builder from GitHub, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/ai-component-builder.git
   cd ai-component-builder
   ```

2. **Install Dependencies**:
   Make sure you have Python and pip installed. Then, install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Server**:
   Navigate to the directory containing `main.py` and run the server using the command specified in `main.py`:
   ```bash
   python main.py
   ```

4. **Access the Application**:
   Open your web browser and go to `http://localhost:8000` to start using the AI Component Builder.

This application provides a powerful and intuitive way to create and modify UI components using AI, making it easier for developers to build responsive and well-structured interfaces.

# HeyGen Interactive Avatar with Voice & Text Chat

A React application featuring HeyGen's streaming avatar with both voice and text interaction modes, built with Vite and TypeScript.

## Features

- 🎯 **Interactive Avatar**: Real-time streaming avatar powered by HeyGen
- 🗣️ **Voice Mode**: Direct voice interaction with the avatar
- ✍️ **Text Mode**: Traditional text input with avatar responses
- 🔄 **Seamless Mode Switching**: Toggle between voice and text modes
- 📊 **Real-time Status**: Live status updates showing conversation flow
- 🎨 **Modern UI**: Clean, responsive interface with intuitive controls

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- HeyGen API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd heygen_assistant
```

2. Install dependencies:
```bash
npm install
```

3. Update your HeyGen API key in `src/App.tsx`:
```typescript
const apiKey = "YOUR_HEYGEN_API_KEY_HERE";
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Start Session**: Click "Start Session" to initialize the avatar
2. **Text Mode** (default): Type your message and click "Speak" or press Enter
3. **Voice Mode**: Click "Voice Mode" button and start speaking naturally
4. **Status Updates**: Watch real-time status showing listening, processing, and speaking states
5. **Mode Switching**: Toggle between modes anytime during an active session

## Voice Mode Status Messages

- **"Listening..."** - Avatar is listening to your voice
- **"Processing..."** - Avatar is processing your speech
- **"Avatar is speaking..."** - Avatar is responding
- **"Waiting for you to speak..."** - Ready for your next input

## Project Structure

```
src/
├── App.tsx           # Main application component with avatar logic
├── main.tsx          # React entry point
├── HeyGenChat.tsx    # Additional chat component (if needed)
└── assets/           # Static assets
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **HeyGen Streaming Avatar SDK** - Avatar functionality
- **Modern CSS** - Styling with inline styles

## API Integration

This application integrates with HeyGen's Streaming Avatar API following their official documentation for voice chat integration. Key features include:

- Streaming avatar initialization
- Voice chat event handling
- Real-time status updates
- Proper session management

## Build

To build for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [HeyGen](https://heygen.com) for their amazing avatar technology
- [React](https://reactjs.org/) team for the excellent framework
- [Vite](https://vitejs.dev/) for the lightning-fast build tool
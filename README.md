# 🚀 MenePortal

**A sophisticated multi-agent chat portal with modern UI and comprehensive AI integrations**

[![Live Demo](https://img.shields.io/badge/Live_Demo-🌐_Access_Now-blue?style=for-the-badge)](https://3000-imyv1e3fxlca5ybdtie8f-6532622b.e2b.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PM2](https://img.shields.io/badge/PM2-2B037A?style=flat&logo=pm2&logoColor=white)](https://pm2.keymetrics.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)](https://openai.com/)

## ✨ Features

### 🎨 Modern User Interface
- **Beautiful Design**: Modern gradient UI with glassmorphism effects
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Real-time Chat**: Enhanced chat interface with message bubbles and timestamps
- **Visual Feedback**: Typing indicators, status lights, and smooth animations
- **Agent Management**: Interactive agent selection with visual status indicators

### 🤖 AI Agent Integrations
- **OpenAI GPT-4o**: Advanced conversational AI with the latest GPT-4 model
- **Groq LLaMA**: High-speed inference with LLaMA models
- **Kindroid AI**: Specialized conversational AI platform
- **Local Services**: Support for custom local AI services
- **Fallback System**: Graceful simulation mode when APIs aren't configured

### 🎙️ Speech & Voice Features
- **Browser Speech Recognition**: Built-in voice input using Web Speech API
- **ElevenLabs Integration**: Professional speech-to-text with high accuracy
- **Voice Controls**: Visual recording indicators and audio feedback

### 🛠️ Development Infrastructure
- **Node.js Server**: Professional HTTP server with proper error handling
- **PM2 Process Management**: Auto-restart, logging, and process monitoring
- **Configuration Management**: Real-time API key validation and status checking
- **Error Handling**: Comprehensive error reporting with user-friendly messages

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SoundsguyZA/Mene_Portal.git
   cd Mene_Portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run pm2:start
   ```

4. **Access the portal**
   - Local: `http://localhost:3000`
   - Or use the provided sandbox URL

### Configuration

Edit `meneportal_config.json` to configure your AI agents:

```json
{
  "agents": [
    {
      "name": "GPT-4o",
      "endpoint": "https://api.openai.com/v1/chat/completions",
      "apiKey": "YOUR_OPENAI_API_KEY",
      "icon": "🧠"
    }
  ],
  "speechToText": {
    "engine": "ElevenLabs",
    "endpoint": "https://api.elevenlabs.io/v1/stt",
    "apiKey": "YOUR_11LABS_API_KEY"
  }
}
```

## 📁 Project Structure

```
MenePortal/
├── index.html              # Main web interface
├── js/
│   └── api-handler.js      # API integration layer
├── server.js               # Development HTTP server
├── package.json            # Node.js configuration
├── ecosystem.config.js     # PM2 process configuration
├── meneportal_config.json  # Agent configuration
├── MenePortalApp/          # Android application
└── README.md               # This file
```

## 🎯 Usage

### Starting Conversations
1. **Select Agents**: Click on agent cards in the sidebar to activate them
2. **Send Messages**: Type in the chat input or use voice input
3. **Multi-Agent Chat**: Activate multiple agents for simultaneous responses
4. **Voice Input**: Click the microphone button to use speech-to-text

### Agent Status Indicators
- 🟢 **Green**: Agent configured and ready
- 🟠 **Orange**: API key needed
- 🔵 **Blue**: Local service
- 🔴 **Red**: Offline or error

### Configuration Panel
Click the "Configuration" button to:
- View current API key status
- Get setup instructions
- Check connection status
- Switch between live and simulation modes

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Start with PM2
npm run pm2:start

# Stop PM2 process
npm run pm2:stop

# View PM2 logs
npm run pm2:logs

# Check PM2 status
npm run pm2:status
```

### API Integration

The application uses a modular API handler (`js/api-handler.js`) that supports:
- Multiple AI service providers
- Automatic API key validation
- Error handling and fallback mechanisms
- Request timeout management
- Response formatting

### Extending with New Agents

1. Add agent configuration to `meneportal_config.json`
2. Implement API handler in `js/api-handler.js`
3. Test the integration
4. Update documentation

## 🌐 Deployment

### Production Deployment

1. **Configure environment variables**
   ```bash
   export NODE_ENV=production
   export PORT=3000
   ```

2. **Start production server**
   ```bash
   npm run pm2:start
   ```

3. **Set up reverse proxy** (optional)
   Configure nginx or Apache to proxy requests to the Node.js server

### Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/SoundsguyZA/Mene_Portal/issues) page
2. Create a new issue with detailed information
3. Include error messages, browser console logs, and configuration details

## 🚀 Roadmap

- [ ] WebSocket support for real-time updates
- [ ] Message history persistence
- [ ] User authentication and profiles
- [ ] Plugin system for custom agents
- [ ] Advanced speech synthesis
- [ ] Mobile app enhancements
- [ ] Cloud deployment templates

---

**Built with ❤️ by the MenePortal team**

# MENE Portal - Multi-LLM Sandbox PWA

A Progressive Web App for running multiple AI agents in isolated sandboxes with inter-agent communication capabilities.

## 🚀 Features

### Core Functionality
- **Multi-Agent Management**: Create and manage multiple AI agents simultaneously
- **Isolated Sandboxes**: Each agent runs in its own Web Worker for true isolation
- **Inter-Agent Communication**: Agents can communicate with each other
- **Real-time Chat**: Live conversation interface with all agents
- **Persistent Storage**: Conversations and agents saved locally
- **Offline Support**: Works without internet connection

### AI Service Integration
- **ChatGPT**: OpenAI's ChatGPT integration
- **Claude**: Anthropic's Claude integration  
- **Z.ai**: Z.ai service integration
- **Gemini**: Google's Gemini integration
- **Custom Services**: Support for custom AI service URLs

### PWA Features
- **Installable**: Can be installed on desktop and mobile devices
- **Offline Mode**: Full functionality without internet
- **Push Notifications**: Optional notification support
- **Responsive Design**: Works on all screen sizes
- **Fast Loading**: Optimized with service worker caching

## 📋 Requirements

- Modern web browser with PWA support
- Node.js 16+ (for development server)
- Internet connection (for AI services)

## 🛠️ Installation & Setup

### Option 1: Simple HTTP Server (Recommended)
```bash
# Clone or download the project
# Navigate to project directory
cd mene_portal_pwa

# Start Python HTTP server (Python 3)
python -m http.server 3000

# Or use Node.js http-server
npx http-server -p 3000

# Open browser to http://localhost:3000
```

### Option 2: Using npm scripts
```bash
# Install dependencies (optional)
npm install

# Start development server
npm run start

# Build for production (copies files)
npm run build
```

## 🎯 How to Use

### 1. Creating Your First Agent
1. Open the app in your browser
2. Click "Create First Agent" or the "+ New Agent" button
3. Fill in the agent details:
   - **Name**: Give your agent a unique name
   - **Service**: Choose ChatGPT, Claude, Z.ai, Gemini, or Custom
   - **Custom URL**: (If using custom service)
   - **Personality**: Optional instructions for the agent
4. Click "Create Agent"

### 2. Chatting with Agents
- Select an agent from the sidebar
- Type your message in the input field
- Press Enter or click Send
- View responses in the chat area

### 3. Inter-Agent Communication
- **Broadcast Mode**: Check "Broadcast to all agents" to send messages to all agents
- **Direct Communication**: Select a target agent from the dropdown to send agent-to-agent messages
- **Agent Responses**: See how agents respond to each other

### 4. Managing Agents
- **Switch Agents**: Click on any agent in the sidebar
- **Delete Agents**: Hover over an agent and click the trash icon
- **Export Chat**: Click the export button to download conversation history
- **Clear Chat**: Click the clear button to reset conversation

## 📁 Project Structure

```
mene_portal_pwa/
├── index.html                 # Main application HTML
├── manifest.json             # PWA manifest
├── sw.js                    # Service worker
├── package.json            # Project configuration
│
├── css/
│   └── styles.css          # Application styles
│
├── js/
│   ├── app.js             # Main application logic
│   ├── agent-manager.js   # Agent management utilities
│   ├── pwa-utils.js       # PWA utility functions
│   └── workers/           # Web Workers for AI services
│       ├── chatgpt-worker.js
│       ├── claude-worker.js
│       ├── zai-worker.js
│       ├── gemini-worker.js
│       └── custom-worker.js
│
├── assets/
│   └── icons/             # PWA icons and assets
│       ├── icon.svg       # Main SVG icon
│       ├── favicon.svg    # Favicon
│       └── icon-*x*.png   # Various PNG sizes
│
└── docs/
    └── README.md          # This file
```

## 🔧 Development

### Adding New AI Services
1. Create a new worker file in `js/workers/` directory
2. Follow the existing worker pattern (see `chatgpt-worker.js`)
3. Add the service to the dropdown in `index.html`
4. Update the service icons in `app.js`

### Customizing Styles
- Modify `css/styles.css` for appearance changes
- CSS uses custom properties for easy theming
- Responsive design built-in

### Extending Functionality
- Add new features to `js/app.js`
- Use Web Workers for intensive tasks
- Leverage PWA features for better UX

## 🌐 Deployment Options

### Static Hosting (Recommended)
Deploy to any static hosting service:
- **Netlify**: Drag & drop the folder
- **Vercel**: Connect GitHub repo
- **GitHub Pages**: Enable in repository settings
- **Firebase Hosting**: `firebase deploy`

### Web Server
Deploy to any web server that can serve static files:
- Apache, Nginx, IIS, etc.
- Ensure HTTPS for PWA features
- Set proper MIME types for service worker

### CDN Deployment
1. Upload files to CDN
2. Configure proper headers
3. Test PWA functionality
4. Update manifest URLs if needed

## 🔒 Security & Privacy

- **No Data Collection**: All data stays on your device
- **Local Storage**: Conversations saved in browser storage
- **Secure Communication**: Uses HTTPS for AI service calls
- **Isolated Workers**: Each agent runs in separate context

## 🐛 Troubleshooting

### Common Issues

**PWA Won't Install**
- Ensure you're using HTTPS
- Check browser PWA support
- Clear browser cache and try again

**Service Worker Not Working**
- Check browser console for errors
- Verify all files are accessible
- Clear browser data and reload

**Agent Not Responding**
- Check network connectivity
- Verify AI service URLs
- Look for worker errors in console

**Chat Not Loading**
- Clear browser storage
- Check for JavaScript errors
- Refresh the application

### Browser Support
- Chrome 67+ (full support)
- Firefox 60+ (limited PWA features)
- Safari 11.1+ (partial support)
- Edge 79+ (full support)

## 🚀 Advanced Features

### Custom AI Integration
To integrate your own AI service:
1. Create a new worker file
2. Implement the required methods
3. Handle authentication as needed
4. Add to the service dropdown

### API Integration
For real AI services, modify workers to:
- Use actual API endpoints
- Handle authentication tokens
- Implement proper error handling
- Add rate limiting

### Multi-User Support
To add collaboration features:
- Implement WebSocket connections
- Add user authentication
- Share agent configurations
- Sync conversations in real-time

## 📝 License

MIT License - feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review browser console for errors
- Test in different browsers
- Check network connectivity

---

**Happy Multi-LLM Chatting!** 🤖✨

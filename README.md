# Pollygolt Backend Worker

A Cloudflare Worker that provides a multilingual AI chat API using OpenAI's GPT models. The worker supports conversation management with context preservation and streaming responses in multiple languages.

## 🌟 Features

- **Multilingual Support**: Chat in English, French, Spanish, Japanese, and Arabic
- **Conversation Management**: Maintains conversation context across multiple messages
- **Streaming Responses**: Real-time streaming of AI responses for better user experience
- **CORS Enabled**: Ready for frontend integration
- **Serverless**: Deployed on Cloudflare Workers for global edge performance
- **OpenAI Integration**: Uses OpenAI's GPT-4o-mini model with custom instructions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account
- OpenAI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pollygolt-backend-worker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Set your OpenAI API key
   wrangler secret put OPENAI_API_KEY
   ```

4. **Deploy to Cloudflare**
   ```bash
   npm run deploy
   ```

## 📡 API Endpoints

### 1. Start Conversation

**POST** `/api/conversation/start`

Creates a new conversation session.

**Response:**

```json
{
	"sessionId": "session_1234567890_abc123def"
}
```

### 2. Send Message (Non-streaming)

**POST** `/api/conversation/message`

Send a message and receive a complete AI response.

**Request Body:**

```json
{
	"sessionId": "session_1234567890_abc123def",
	"message": "Hello, how are you?",
	"targetLang": "en",
	"temperature": 0.3,
	"maxTokens": 128
}
```

**Response:**

```json
{
	"message": "Hello! I'm doing well, thank you for asking. How can I help you today?",
	"responseId": "resp_1234567890"
}
```

### 3. Send Message (Streaming)

**POST** `/api/conversation/message/stream`

Send a message and receive a streaming AI response.

**Request Body:**

```json
{
	"sessionId": "session_1234567890_abc123def",
	"message": "Tell me a story",
	"targetLang": "en",
	"temperature": 0.7,
	"maxTokens": 256
}
```

**Response:** Stream of text chunks

## 🌍 Supported Languages

| Code | Language | Native Name |
| ---- | -------- | ----------- |
| `en` | English  | English     |
| `fr` | French   | Français    |
| `es` | Spanish  | Español     |
| `ja` | Japanese | 日本語      |
| `ar` | Arabic   | العربية     |

## 🛠️ Development

### Local Development

```bash
# Start local development server
npm run dev

# Run tests
npm test

# Generate Cloudflare types
npm run cf-typegen
```

### Project Structure

```
pollygolt-backend-worker/
├── src/
│   └── index.ts              # Main worker code
├── test/
│   ├── index.spec.ts         # Test files
│   └── env.d.ts              # Test environment types
├── wrangler.jsonc            # Cloudflare Worker configuration
├── package.json              # Dependencies and scripts
├── postman-collection.json   # API testing collection
└── README.md                 # This file
```

## 🔧 Configuration

### Wrangler Configuration

The worker is configured in `wrangler.jsonc`:

```json
{
	"name": "pollygolt-backend-worker",
	"main": "src/index.ts",
	"compatibility_date": "2025-10-14",
	"compatibility_flags": ["nodejs_compat"],
	"observability": {
		"enabled": true
	}
}
```

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (set via `wrangler secret put`)

## 📝 Usage Examples

### JavaScript/TypeScript

```javascript
// Start a conversation
const startResponse = await fetch('https://your-worker.your-subdomain.workers.dev/api/conversation/start', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
});
const { sessionId } = await startResponse.json();

// Send a message
const messageResponse = await fetch('https://your-worker.your-subdomain.workers.dev/api/conversation/message', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		sessionId,
		message: 'Hello! How are you?',
		targetLang: 'en',
		temperature: 0.3,
		maxTokens: 128,
	}),
});
const { message } = await messageResponse.json();
console.log(message);
```

### Python

```python
import requests

# Start conversation
start_response = requests.post('https://your-worker.your-subdomain.workers.dev/api/conversation/start')
session_id = start_response.json()['sessionId']

# Send message
message_response = requests.post(
    'https://your-worker.your-subdomain.workers.dev/api/conversation/message',
    json={
        'sessionId': session_id,
        'message': 'Hello! How are you?',
        'targetLang': 'en',
        'temperature': 0.3,
        'maxTokens': 128
    }
)
print(message_response.json()['message'])
```

### cURL

```bash
# Start conversation
curl -X POST https://your-worker.your-subdomain.workers.dev/api/conversation/start

# Send message
curl -X POST https://your-worker.your-subdomain.workers.dev/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_1234567890_abc123def",
    "message": "Hello! How are you?",
    "targetLang": "en",
    "temperature": 0.3,
    "maxTokens": 128
  }'
```

## 🧪 Testing

### Using Postman

Import the `postman-collection.json` file into Postman to test all endpoints with pre-configured requests.

### Using Vitest

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test -- --watch
```

## 🚀 Deployment

### Deploy to Cloudflare Workers

```bash
# Deploy to production
npm run deploy

# Deploy with custom name
wrangler deploy --name my-custom-worker-name
```

### Environment Setup

1. **Set OpenAI API Key:**

   ```bash
   wrangler secret put OPENAI_API_KEY
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

## 📊 Monitoring

The worker includes observability features:

- **Logs**: View logs in Cloudflare Dashboard
- **Metrics**: Monitor performance and usage
- **Errors**: Track and debug issues

## 🔒 Security

- **CORS**: Configured for cross-origin requests
- **API Key**: Securely stored as Cloudflare secret
- **Input Validation**: All inputs are validated before processing
- **Error Handling**: Comprehensive error handling and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues and questions:

1. Check the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
2. Review the [OpenAI API documentation](https://platform.openai.com/docs)
3. Open an issue in this repository

## 🔄 Version History

- **v0.0.0**: Initial release with multilingual chat support
  - Basic conversation management
  - Streaming and non-streaming responses
  - Multi-language support (EN, FR, ES, JA, AR)
  - CORS configuration
  - OpenAI GPT-4o-mini integration

---

**Built with ❤️ using Cloudflare Workers and OpenAI**

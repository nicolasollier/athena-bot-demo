const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

require('dotenv').config();

const port = 3000;
const app = express();

const API_KEY = process.env.API_KEY

app.use(cors())
app.use(bodyParser.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Route to create a new stream
app.post('/api/talks/streams', async (req, res) => {
  try {
    const response = await fetch('https://api.d-id.com/talks/streams', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to submit network information
app.post('/api/talks/streams/:streamId/ice', async (req, res) => {
  const { streamId } = req.params;
  try {
    const response = await fetch(`https://api.d-id.com/talks/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to start a stream
app.post('/api/talks/streams/:streamId/sdp', async (req, res) => {
  const { streamId } = req.params;
  try {
    const response = await fetch(`https://api.d-id.com/talks/streams/${streamId}/sdp`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to send a message to a chat session with the agent
app.post('/api/agents/:agentId/chat/:chatId', async (req, res) => {
  const { agentId, chatId } = req.params;
  try {
      const response = await fetch(`https://api.d-id.com/agents/${agentId}/chat/${chatId}`, {
          method: 'POST',
          headers: {
              Authorization: `Basic ${API_KEY}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.json(data);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Route to delete a stream
app.delete('/api/talks/streams/:streamId', async (req, res) => {
  const { streamId } = req.params;
  try {
    const response = await fetch(`https://api.d-id.com/talks/streams/${streamId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port localhost:${port}`));

'use strict';

const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;
let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;
let agentId;
let chatId;

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');

// Play the idle video when the page is loaded
window.onload = (event) => {

  playIdleVideo();

  if (agentId == "" || agentId == undefined) {
    console.log("Empty 'agentID' and 'chatID' variables\n\n1. Click on the 'Create new Agent with Knowledge' button\n2. Open the Console and wait for the process to complete\n3. Press on the 'Connect' button\n4. Type and send a message to the chat\nNOTE: You can store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats");
  } else {
    console.log("You are good to go!\nClick on the 'Connect Button', Then send a new message\nAgent ID: ", agentId, "\nChat ID: ", chatId);
  }
};

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');

  let dc = await peerConnection.createDataChannel("JanusDataChannel");
  dc.onopen = () => {
    console.log("datachannel open");
  };

  let decodedMsg;
  dc.onmessage = (event) => {
    let msg = event.data;
    let msgType = "chat/answer:";
    if (msg.includes(msgType)) {
      msg = decodeURIComponent(msg.replace(msgType, ""));
      console.log(msg);
      decodedMsg = msg;
      return decodedMsg;
    }
    if (msg.includes("stream/started")) {
      console.log(msg);
    } else {
      console.log(msg);
    }
  };

  dc.onclose = () => {
    console.log("datachannel close");
  };

  return sessionClientAnswer;
}

function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    fetch(`/api/talks/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });
  }
}

function onIceConnectionStateChange() {
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
  }
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';
    const remoteStream = stream;
    setVideoElement(remoteStream);
  } else {
    status = 'empty';
    playIdleVideo();
  }
}

function onTrack(event) {
  if (!event.track) return;

  statsIntervalId = setInterval(async () => {
    const stats = await peerConnection.getStats(event.track);
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;

        if (videoStatusChanged) {
          videoIsPlaying = report.bytesReceived > lastBytesReceived;
          onVideoStatusChange(videoIsPlaying, event.streams[0]);
        }
        lastBytesReceived = report.bytesReceived;
      }
    });
  }, 500);
}

function setVideoElement(stream) {
  if (!stream) return;
  videoElement.classList.add("animated");
  videoElement.muted = false;
  videoElement.srcObject = stream;
  videoElement.loop = false;

  setTimeout(() => {
    videoElement.classList.remove("animated");
  }, 1000);

  if (videoElement.paused) {
    videoElement
      .play()
      .then((_) => { })
      .catch((e) => { });
  }
}

function playIdleVideo() {
  videoElement.classList.toggle("animated");
  videoElement.srcObject = undefined;
  videoElement.src = 'https://athena-bot-bucket.s3.eu-north-1.amazonaws.com/idle_video.mp4';
  videoElement.loop = true;

  setTimeout(() => {
    videoElement.classList.remove("animated");
  }, 1000);
}

function stopAllStreams() {
  if (videoElement.srcObject) {
    console.log('stopping video streams');
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('stopping peer connection');

  pc.close();
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 3;
const maxDelaySec = 4;
async function fetchWithRetries(url, options, retries = 1) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {
  if (agentId == "" || agentId === undefined) {
    return alert("1. Click on the 'Create new Agent with Knowledge' button\n2. Open the Console and wait for the process to complete\n3. Press on the 'Connect' button\n4. Type and send a message to the chat\nNOTE: You can store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats");
  }

  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }
  stopAllStreams();
  closePC();

  const sessionResponse = await fetchWithRetries('/api/talks/streams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "source_url": "https://create-images-results.d-id.com/google-oauth2|109076752811133787983/upl_lNjsboe2okaREFNt45tcs/image.png",
      "output_resolution": 1080,
    }),
  });

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
  streamId = newStreamId;
  sessionId = newSessionId;
  try {
    console.log('creating peer connection', offer, iceServers);
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.log('error during streaming setup', e);
    stopAllStreams();
    closePC();
    return;
  }

  await fetch(`/api/talks/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer: sessionClientAnswer,
      session_id: sessionId,
    }),
  });
};

const startButton = document.getElementById('start-button');
startButton.onclick = async () => {
  if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
    let txtAreaValue = document.getElementById("textArea").value;
    document.getElementById("textArea").value = "";

    await fetchWithRetries(`/api/agents/${agentId}/chat/${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "streamId": streamId,
        "sessionId": sessionId,
        "messages": [
          {
            "role": "user",
            "content": txtAreaValue,
            "created_at": new Date().toString()
          }
        ]
      }),
    });
  }
};

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () => {
  await fetch(`/api/talks/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  closePC();
};

// Agents API Workflow
async function agentsAPIworkflow() {
  axios.defaults.baseURL = "http://localhost:3000/api";
  axios.defaults.headers.common['content-type'] = 'application/json';

  async function retry(url, retries = 1) {
    const maxRetryCount = 5;
    const maxDelaySec = 10;
    try {
      let response = await axios.get(`${url}`);
      if (response.data.status == "done") {
        return console.log(response.data.id + ": " + response.data.status);
      } else {
        throw new Error("Status is not 'done'");
      }
    } catch (err) {
      if (retries <= maxRetryCount) {
        const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log(`Retrying ${retries}/${maxRetryCount}. ${err}`);
        return retry(url, retries + 1);
      } else {
        throw new Error(`Max retries exceeded. error: ${err}`);
      }
    }
  }

  const createKnowledge = await axios.post('/knowledge', {
    name: "knowledge",
    description: "D-ID Agents API"
  });
  console.log("Create Knowledge:", createKnowledge.data);

  let knowledgeId = createKnowledge.data.id;
  console.log("Knowledge ID: " + knowledgeId);

  const createDocument = await axios.post(`/knowledge/${knowledgeId}/documents`, {
    "documentType": "html",
    "source_url": "https://en.wikipedia.org/wiki/Prompt_engineering",
    "title": "Prompt Engineering Wikipedia Page",
  });
  console.log("Create Document: ", createDocument.data);

  let documentId = createDocument.data.id.split("#")[1];
  console.log("Document ID: " + documentId);

  await retry(`/knowledge/${knowledgeId}/documents/${documentId}`);
  await retry(`/knowledge/${knowledgeId}`);

  const createAgent = await axios.post('/agents', {
    "knowledge": {
      "provider": "pinecone",
      "embedder": {
        "provider": "pinecone",
        "model": "ada02"
      },
      "id": knowledgeId
    },
    "presenter": {
      "type": "talk",
      "voice": {
        "type": "microsoft",
        "voice_id": "en-US-JennyMultilingualV2Neural"
      },
      "stitch": true,
      "thumbnail": "https://create-images-results.d-id.com/google-oauth2|109076752811133787983/upl_lNjsboe2okaREFNt45tcs/image.png",
      "source_url": "https://create-images-results.d-id.com/google-oauth2|109076752811133787983/upl_lNjsboe2okaREFNt45tcs/image.png",
    },
    "llm": {
      "type": "openai",
      "provider": "openai",
      "model": "gpt-3.5-turbo-1106",
      "instructions": "Your name is Emma, an AI designed to assist with information about Prompt Engineering and RAG"
    },
    "preview_name": "Emma"
  });
  console.log("Create Agent: ", createAgent.data);
  let agentId = createAgent.data.id;
  console.log("Agent ID: " + agentId);

  const createChat = await axios.post(`/agents/${agentId}/chat`);
  console.log("Create Chat: ", createChat.data);
  let chatId = createChat.data.id;
  console.log("Chat ID: " + chatId);

  console.log("Create new Agent with Knowledge - DONE!\n Press on the 'Connect' button to proceed.\n Store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats");
  return { agentId: agentId, chatId: chatId };
}

const agentsButton = document.getElementById("agents-button");
agentsButton.onclick = async () => {
  try {
    const agentsIds = await agentsAPIworkflow();
    console.log(agentsIds);
    agentId = agentsIds.agentId;
    chatId = agentsIds.chatId;
    return;
  } catch (err) {
    throw new Error(err);
  }
};

// Paste Your Created Agent and Chat IDs Here:
agentId = "agt_L-4NIYOB";
chatId = "cht_cnLfNZE5QoJQ7b1pNyQvc";

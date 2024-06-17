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
let agentId = "agt_O3O9tAZZ";
let chatId = "cht_zufHnPc8Fc11Ub4UVwR-N";

const videoElement = document.getElementById('video-element');
videoElement.setAttribute('playsinline', '');

// Play the idle video when the page is loaded
window.onload = () => {
  playIdleVideo();

  if (!agentId) {
    console.log("Empty 'agentID' and 'chatID' variables\n\n1. Click on the 'Create new Agent with Knowledge' button\n2. Open the Console and wait for the process to complete\n3. Press on the 'Connect' button\n4. Type and send a message to the chat\nNOTE: You can store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats");
  } else {
    console.log(`You are good to go!\nClick on the 'Connect Button', Then send a new message\nAgent ID: ${agentId}\nChat ID: ${chatId}`);
  }
};

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icecandidate', onIceCandidate);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange);
    peerConnection.addEventListener('track', onTrack);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('Set remote SDP OK');

  sessionClientAnswer = await peerConnection.createAnswer();
  console.log('Create local SDP OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('Set local SDP OK');

  const dc = peerConnection.createDataChannel("JanusDataChannel");
  dc.onopen = () => console.log("Datachannel open");
  dc.onmessage = handleDataChannelMessage;
  dc.onclose = () => console.log("Datachannel close");

  return sessionClientAnswer;
}

function handleDataChannelMessage(event) {
  const msg = event.data;
  const msgType = "chat/answer:";

  if (msg.includes(msgType)) {
    const decodedMsg = decodeURIComponent(msg.replace(msgType, ""));
    console.log(decodedMsg);
    return decodedMsg;
  }

  if (msg.includes("stream/started")) {
    console.log(msg);
  } else {
    console.log(msg);
  }
}

function onIceCandidate(event) {
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    fetchWithRetries(`/api/talks/streams/${streamId}/ice`, {
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
    closePeerConnection();
  }
}

function onVideoStatusChange(videoIsPlaying, stream) {
  if (videoIsPlaying) {
    setVideoElement(stream);
  } else {
    playIdleVideo();
  }
}

function onTrack(event) {
  if (!event.track) return;

  statsIntervalId = setInterval(async () => {
    const stats = await peerConnection.getStats(event.track);
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        const videoStatusChanged = videoIsPlaying !== (report.bytesReceived > lastBytesReceived);

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
    videoElement.play().catch(console.error);
  }
}

function playIdleVideo() {
  videoElement.classList.add("animated");
  videoElement.srcObject = null;
  videoElement.src = 'https://athena-bot-bucket.s3.eu-north-1.amazonaws.com/idle_video.mp4';
  videoElement.loop = true;

  setTimeout(() => {
    videoElement.classList.remove("animated");
  }, 1000);
}

function stopAllStreams() {
  if (videoElement.srcObject) {
    console.log('Stopping video streams');
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}

function closePeerConnection() {
  if (!peerConnection) return;

  console.log('Stopping peer connection');
  peerConnection.close();
  peerConnection.removeEventListener('icecandidate', onIceCandidate);
  peerConnection.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange);
  peerConnection.removeEventListener('track', onTrack);
  clearInterval(statsIntervalId);
  peerConnection = null;
  console.log('Stopped peer connection');
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
      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error: ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. Error: ${err}`);
    }
  }
}

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {
  connectButton.classList.add('loading');
  connectButton.innerText = 'Connecting...';

  if (!agentId) {
    alert("1. Click on the 'Create new Agent with Knowledge' button\n2. Open the Console and wait for the process to complete\n3. Press on the 'Connect' button\n4. Type and send a message to the chat\nNOTE: You can store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats");
    return;
  }

  if (peerConnection && peerConnection.connectionState === 'connected') return;

  stopAllStreams();
  closePeerConnection();

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
    console.log('Creating peer connection', offer, iceServers);
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (error) {
    console.log('Error during streaming setup', error);
    stopAllStreams();
    closePeerConnection();
    return;
  }

  await fetchWithRetries(`/api/talks/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answer: sessionClientAnswer,
      session_id: sessionId,
    }),
  });

  connectButton.classList.remove('loading');
  connectButton.innerText = 'Connected!';

  setTimeout(() => {
    connectButton.style.display = 'none';
  }, 2000);
};

const recordButton = document.getElementById('record-button');
const playIcon = document.getElementById('play-icon');

recordButton.onclick = async () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("Web Speech API is not supported by this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'fr-FR';

  recognition.start();
  recordButton.classList.add('recording');
  playIcon.classList.add('recording');
  console.log("Voice recognition started. Speak into the microphone.");

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("Voice recognition result: ", transcript);

    if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
      console.log("Sending message to chat...", transcript);

      await fetchWithRetries(`/api/agents/${agentId}/chat/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "streamId": streamId,
          "sessionId": sessionId,
          "messages": [{
            "role": "user",
            "content": transcript,
            "created_at": new Date().toString(),
          }],
        }),
      });
    }
    console.log("Voice recognition ended.");
  };

  recognition.onerror = (event) => {
    console.error("Voice recognition error: ", event.error);
  };

  recognition.onend = () => {
    recordButton.classList.remove('recording');
    playIcon.classList.remove('recording');
  };
};

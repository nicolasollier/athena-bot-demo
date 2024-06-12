(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const s of t)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function n(t){const s={};return t.integrity&&(s.integrity=t.integrity),t.referrerPolicy&&(s.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?s.credentials="include":t.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(t){if(t.ep)return;t.ep=!0;const s=n(t);fetch(t.href,s)}})();const D=(window.RTCPeerConnection||window.webkitRTCPeerConnection||window.mozRTCPeerConnection).bind(window);let o,m,g,x,A,w,b,l,y;const c=document.getElementById("video-element");c.setAttribute("playsinline","");window.onload=e=>{k(),l==""||l==null?console.log(`Empty 'agentID' and 'chatID' variables

1. Click on the 'Create new Agent with Knowledge' button
2. Open the Console and wait for the process to complete
3. Press on the 'Connect' button
4. Type and send a message to the chat
NOTE: You can store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats`):console.log(`You are good to go!
Click on the 'Connect Button', Then send a new message
Agent ID: `,l,`
Chat ID: `,y)};async function P(e,a){o||(o=new D({iceServers:a}),o.addEventListener("icecandidate",L,!0),o.addEventListener("iceconnectionstatechange",T,!0),o.addEventListener("track",B,!0)),await o.setRemoteDescription(e),console.log("set remote sdp OK");const n=await o.createAnswer();console.log("create local sdp OK"),await o.setLocalDescription(n),console.log("set local sdp OK");let i=await o.createDataChannel("JanusDataChannel");i.onopen=()=>{console.log("datachannel open")};let t;return i.onmessage=s=>{let r=s.data,d="chat/answer:";if(r.includes(d))return r=decodeURIComponent(r.replace(d,"")),console.log(r),t=r,t;r.includes("stream/started"),console.log(r)},i.onclose=()=>{console.log("datachannel close")},n}function L(e){if(e.candidate){const{candidate:a,sdpMid:n,sdpMLineIndex:i}=e.candidate;fetch(`https://api.d-id.com/talks/streams/${m}/ice`,{method:"POST",headers:{Authorization:'Basic "bmljb2xhc0BsZXBldGl0bWFydGluLmNvbQ:4KL8x-STx5ZlgIAry-U8M",',"Content-Type":"application/json"},body:JSON.stringify({candidate:a,sdpMid:n,sdpMLineIndex:i,session_id:g})})}}function T(){(o.iceConnectionState==="failed"||o.iceConnectionState==="closed")&&(p(),f())}function $(e,a){e?R(a):k()}function B(e){e.track&&(A=setInterval(async()=>{(await o.getStats(e.track)).forEach(n=>{n.type==="inbound-rtp"&&n.kind==="video"&&(w!==n.bytesReceived>b&&(w=n.bytesReceived>b,$(w,e.streams[0])),b=n.bytesReceived)})},500))}function R(e){e&&(c.classList.add("animated"),c.muted=!1,c.srcObject=e,c.loop=!1,setTimeout(()=>{c.classList.remove("animated")},1e3),c.paused&&c.play().then(a=>{}).catch(a=>{}))}function k(){c.classList.toggle("animated"),c.srcObject=void 0,c.src="https://athena-bot-bucket.s3.eu-north-1.amazonaws.com/idle_video.mp4",c.loop=!0,setTimeout(()=>{c.classList.remove("animated")},1e3)}function p(){c.srcObject&&(console.log("stopping video streams"),c.srcObject.getTracks().forEach(e=>e.stop()),c.srcObject=null)}function f(e=o){e&&(console.log("stopping peer connection"),e.close(),e.removeEventListener("icecandidate",L,!0),e.removeEventListener("iceconnectionstatechange",T,!0),e.removeEventListener("track",B,!0),clearInterval(A),console.log("stopped peer connection"),e===o&&(o=null))}const E=3,j=4;async function I(e,a,n=1){try{return await fetch(e,a)}catch(i){if(n<=E){const t=Math.min(Math.pow(2,n)/4+Math.random(),j)*1e3;return await new Promise(s=>setTimeout(s,t)),console.log(`Request failed, retrying ${n}/${E}. Error ${i}`),I(e,a,n+1)}else throw new Error(`Max retries exceeded. error: ${i}`)}}const _=document.getElementById("connect-button");_.onclick=async()=>{if(l==""||l===void 0)return alert(`1. Click on the 'Create new Agent with Knowledge' button
2. Open the Console and wait for the process to complete
3. Press on the 'Connect' button
4. Type and send a message to the chat
NOTE: You can store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats`);if(o&&o.connectionState==="connected")return;p(),f();const e=await I("https://api.d-id.com/talks/streams",{method:"POST",headers:{Authorization:'Basic "bmljb2xhc0BsZXBldGl0bWFydGluLmNvbQ:4KL8x-STx5ZlgIAry-U8M",',"Content-Type":"application/json"},body:JSON.stringify({source_url:"https://create-images-results.d-id.com/google-oauth2|109076752811133787983/upl_lNjsboe2okaREFNt45tcs/image.png",output_resolution:1080})}),{id:a,offer:n,ice_servers:i,session_id:t}=await e.json();m=a,g=t;try{x=await P(n,i)}catch(s){console.log("error during streaming setup",s),p(),f();return}await fetch(`https://api.d-id.com/talks/streams/${m}/sdp`,{method:"POST",headers:{Authorization:'Basic "bmljb2xhc0BsZXBldGl0bWFydGluLmNvbQ:4KL8x-STx5ZlgIAry-U8M",',"Content-Type":"application/json"},body:JSON.stringify({answer:x,session_id:g})})};const M=document.getElementById("start-button");M.onclick=async()=>{if((o==null?void 0:o.signalingState)==="stable"||(o==null?void 0:o.iceConnectionState)==="connected"){let e=document.getElementById("textArea").value;document.getElementById("textArea").value="",await I(`https://api.d-id.com/agents/${l}/chat/${y}`,{method:"POST",headers:{Authorization:'Basic "bmljb2xhc0BsZXBldGl0bWFydGluLmNvbQ:4KL8x-STx5ZlgIAry-U8M",',"Content-Type":"application/json"},body:JSON.stringify({streamId:m,sessionId:g,messages:[{role:"user",content:e,created_at:new Date().toString()}]})})}};const K=document.getElementById("destroy-button");K.onclick=async()=>{await fetch(`https://api.d-id.com/talks/streams/${m}`,{method:"DELETE",headers:{Authorization:'Basic "bmljb2xhc0BsZXBldGl0bWFydGluLmNvbQ:4KL8x-STx5ZlgIAry-U8M",',"Content-Type":"application/json"},body:JSON.stringify({session_id:g})}),p(),f()};async function G(){axios.defaults.baseURL="https://api.d-id.com",axios.defaults.headers.common.Authorization='Basic "bmljb2xhc0BsZXBldGl0bWFydGluLmNvbQ:4KL8x-STx5ZlgIAry-U8M",',axios.defaults.headers.common["content-type"]="application/json";async function e(S,h=1){try{let u=await axios.get(`${S}`);if(u.data.status=="done")return console.log(u.data.id+": "+u.data.status);throw new Error("Status is not 'done'")}catch(u){if(h<=5){const O=Math.min(Math.pow(2,h)/4+Math.random(),10)*1e3;return await new Promise(N=>setTimeout(N,O)),console.log(`Retrying ${h}/5. ${u}`),e(S,h+1)}else throw new Error(`Max retries exceeded. error: ${u}`)}}const a=await axios.post("/knowledge",{name:"knowledge",description:"D-ID Agents API"});console.log("Create Knowledge:",a.data);let n=a.data.id;console.log("Knowledge ID: "+n);const i=await axios.post(`/knowledge/${n}/documents`,{documentType:"html",source_url:"https://en.wikipedia.org/wiki/Prompt_engineering",title:"Prompt Engineering Wikipedia Page"});console.log("Create Document: ",i.data);let t=i.data.id;t=t.split("#")[1],console.log("Document ID: "+t),await e(`/knowledge/${n}/documents/${t}`),await e(`/knowledge/${n}`);const r=await axios.post("/agents",{knowledge:{provider:"pinecone",embedder:{provider:"pinecone",model:"ada02"},id:n},presenter:{type:"talk",voice:{type:"microsoft",voice_id:"en-US-JennyMultilingualV2Neural"},stitch:!0,thumbnail:"https://create-images-results.d-id.com/google-oauth2|109076752811133787983/upl_lNjsboe2okaREFNt45tcs/image.png",source_url:"https://create-images-results.d-id.com/google-oauth2|109076752811133787983/upl_lNjsboe2okaREFNt45tcs/image.png"},llm:{type:"openai",provider:"openai",model:"gpt-3.5-turbo-1106",instructions:"Your name is Emma, an AI designed to assist with information about Prompt Engineering and RAG"},preview_name:"Emma"});console.log("Create Agent: ",r.data);let d=r.data.id;console.log("Agent ID: "+d);const C=await axios.post(`/agents/${d}/chat`);console.log("Create Chat: ",C.data);let v=C.data.id;return console.log("Chat ID: "+v),console.log(`Create new Agent with Knowledge - DONE!
 Press on the 'Connect' button to proceed.
 Store the created 'agentID' and 'chatId' variables at the bottom of the JS file for future chats`),{agentId:d,chatId:v}}const Z=document.getElementById("agents-button");Z.onclick=async()=>{try{const e={}=await G();console.log(e),l=e.agentId,y=e.chatId;return}catch(e){throw new Error(e)}};l="agt_L-4NIYOB";y="cht_cnLfNZE5QoJQ7b1pNyQvc";
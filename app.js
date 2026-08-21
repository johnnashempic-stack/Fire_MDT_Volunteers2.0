// ================================
// BFP / FD Advanced MDT & CAD
// ================================

const USERS = {
  dispatch: {
    password: "dispatch2024",
    role: "dispatch",
    name: "Dispatcher 1",
    callsign: "Dispatch"
  },
  resp1: {
    password: "resp123",
    role: "responder",
    name: "Responder 1",
    callsign: "Engine 1"
  },
  resp2: {
    password: "resp123",
    role: "responder",
    name: "Responder 2",
    callsign: "Engine 2"
  },
  resp3: {
    password: "resp123",
    role: "responder",
    name: "Responder 3",
    callsign: "Ladder 1"
  },
  resp4: {
    password: "resp123",
    role: "responder",
    name: "Responder 4",
    callsign: "Rescue 1"
  },
  resp5: {
    password: "resp123",
    role: "responder",
    name: "Responder 5",
    callsign: "Tanker 1"
  }
};

let currentUser = null;
let data = {
  calls: [],
  reports: [],
  units: [],
  messages: [],
  lastUpdated: null
};
let lastKnownCallCount = 0;
let lastKnownReportCount = 0;
let lastKnownMsgCount = 0;
let map = null;
let markers = {};
let syncTimer = null;
let audioCtx = null;

// ---------- Utility ----------
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function playBeep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    // Rapid triple beep
    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 880;
      osc.type = "square";
      gain.gain.setValueAtTime(0.3, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.18 + 0.12);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.13);
    }
  } catch (e) {
    console.warn("Audio beep failed", e);
  }
}

function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 3500);
}

// ---------- JSONBin API ----------
async function fetchData() {
  if (JSONBIN_BIN_ID === "YOUR_BIN_ID_HERE" || JSONBIN_API_KEY === "YOUR_MASTER_KEY_HERE") {
    console.warn("JSONBin not configured – using local fallback");
    return data;
  }
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: {
        "X-Master-Key": JSONBIN_API_KEY
      }
    });
    if (!res.ok) throw new Error("Fetch failed " + res.status);
    const json = await res.json();
    return json.record || json;
  } catch (err) {
    console.error("JSONBin fetch error:", err);
    showToast("Sync failed – check connection / config", "error");
    return data;
  }
}

async function saveData(newData) {
  if (JSONBIN_BIN_ID === "YOUR_BIN_ID_HERE" || JSONBIN_API_KEY === "YOUR_MASTER_KEY_HERE") {
    data = newData;
    localStorage.setItem("bfp_mdt_local", JSON.stringify(data));
    return true;
  }
  try {
    newData.lastUpdated = new Date().toISOString();
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY
      },
      body: JSON.stringify(newData)
    });
    if (!res.ok) throw new Error("Save failed " + res.status);
    data = newData;
    return true;
  } catch (err) {
    console.error("JSONBin save error:", err);
    showToast("Save failed – try again", "error");
    return false;
  }
}

async function sync() {
  const remote = await fetchData();
  if (!remote) return;

  // Detect new items for beep
  const newCalls = (remote.calls || []).length > lastKnownCallCount;
  const newReports = (remote.reports || []).length > lastKnownReportCount;
  const newMsgs = (remote.messages || []).length > lastKnownMsgCount;

  if ((newCalls || newReports || newMsgs) && currentUser) {
    playBeep();
    if (newCalls) showToast("🚨 New Call / Incident!", "alert");
    else if (newReports) showToast("📋 New Report from unit!", "alert");
    else showToast("💬 New message", "info");
  }

  lastKnownCallCount = (remote.calls || []).length;
  lastKnownReportCount = (remote.reports || []).length;
  lastKnownMsgCount = (remote.messages || []).length;

  data = remote;

  // Ensure units exist
  if (!data.units || data.units.length === 0) {
    data.units = Object.keys(USERS)
      .filter(u => USERS[u].role === "responder")
      .map(id => ({
        id,
        name: USERS[id].name,
        callsign: USERS[id].callsign,
        status: "Available",
        lastUpdate: null
      }));
  }

  if (currentUser) {
    renderUI();
    updateMap();
  }
}

// ---------- Auth ----------
function login() {
  const user = document.getElementById("loginUser").value.trim().toLowerCase();
  const pass = document.getElementById("loginPass").value;

  if (!USERS[user] || USERS[user].password !== pass) {
    showToast("Invalid username or password", "error");
    return;
  }

  currentUser = { username: user, ...USERS[user] };
  localStorage.setItem("bfp_mdt_session", JSON.stringify(currentUser));

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  document.getElementById("userBadge").textContent =
    `\( {currentUser.callsign || currentUser.name} ( \){currentUser.role.toUpperCase()})`;

  if (currentUser.role === "dispatch") {
    document.getElementById("dispatchPanel").classList.remove("hidden");
    document.getElementById("responderPanel").classList.add("hidden");
  } else {
    document.getElementById("dispatchPanel").classList.add("hidden");
    document.getElementById("responderPanel").classList.remove("hidden");
  }

  // Init map after UI is visible
  setTimeout(initMap, 100);

  // First sync + start polling
  sync().then(() => {
    lastKnownCallCount = (data.calls || []).length;
    lastKnownReportCount = (data.reports || []).length;
    lastKnownMsgCount = (data.messages || []).length;
  });
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(sync, SYNC_INTERVAL);

  showToast(`Welcome, ${currentUser.name}`, "success");
}

function logout() {
  currentUser = null;
  localStorage.removeItem("bfp_mdt_session");
  if (syncTimer) clearInterval(syncTimer);
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  if (map) {
    map.remove();
    map = null;
    markers = {};
  }
}

// ---------- Map ----------
function initMap() {
  if (map) return;
  const container = document.getElementById("map");
  if (!container) return;

  map = L.map("map").setView(MAP_CENTER, MAP_ZOOM);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
    maxZoom: 19
  }).addTo(map);

  updateMap();
}

function updateMap() {
  if (!map) return;

  // Clear old markers
  Object.values(markers).forEach(m => map.removeLayer(m));
  markers = {};

  const active = (data.calls || []).filter(
    c => !["Closed", "Cancelled"].includes(c.status)
  );

  active.forEach(call => {
    if (call.lat && call.lng) {
      const color =
        call.status === "On Scene" || call.status === "Controlled"
          ? "#e74c3c"
          : call.status === "Dispatched" || call.status === "Enroute"
          ? "#f39c12"
          : "#3498db";

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background:${color};width:18px;height:18px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.5);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      const m = L.marker([call.lat, call.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px; line-height:1.4">
            <strong style="font-size:14px">${call.type}</strong><br>
            📍 ${call.location}<br>
            <b>Status:</b> ${call.status}<br>
            ${call.description ? call.description : ""}
          </div>
        `);
      markers[call.id] = m;
    }
  });

  // Fit bounds if we have markers
  const group = Object.values(markers);
  if (group.length > 0) {
    const featureGroup = L.featureGroup(group);
    map.fitBounds(featureGroup.getBounds().pad(0.2));
  }
}

// ---------- Rendering ----------
function renderUI() {
  if (!currentUser) return;

  if (currentUser.role === "dispatch") {
    renderDispatchCalls();
    renderUnits();
    renderMessages();
    renderReports();
  } else {
    renderResponderCalls();
    renderMyStatus();
    renderMessages();
    renderReports();
  }
}

function statusBadge(status) {
  const map = {
    Pending: "badge-pending",
    Dispatched: "badge-dispatched",
    Enroute: "badge-enroute",
    "On Scene": "badge-onscene",
    Controlled: "badge-controlled",
    Closed: "badge-closed",
    Cancelled: "badge-closed",
    Available: "badge-available",
    Returning: "badge-returning",
    "Out of Service": "badge-oos"
  };
  return `<span class="badge \( {map[status] || ""}"> \){status}</span>`;
}

function renderDispatchCalls() {
  const el = document.getElementById("dispatchCallList");
  const calls = [...(data.calls || [])].reverse();

  if (calls.length === 0) {
    el.innerHTML = `<div class="empty">No calls yet. Create one below.</div>`;
    return;
  }

  el.innerHTML = calls
    .map(
      c => `
    <div class="card call-card ${c.status === "Closed" || c.status === "Cancelled" ? "closed" : ""}">
      <div class="card-header">
        <strong>#${c.id.slice(-5).toUpperCase()} – ${c.type}</strong>
        ${statusBadge(c.status)}
      </div>
      <div class="card-body">
        <div><i class="icon">📍</i> ${c.location}</div>
        <div><i class="icon">📝</i> ${c.description || "—"}</div>
        <div><i class="icon">🕒</i> ${formatTime(c.createdAt)}</div>
        <div><i class="icon">🚒</i> Units: ${(c.assignedUnits || []).join(", ") || "None"}</div>
      </div>
      <div class="card-actions">
        <select onchange="updateCallStatus('${c.id}', this.value)">
          <option value="">Change Status…</option>
          <option value="Pending">Pending</option>
          <option value="Dispatched">Dispatched</option>
          <option value="Enroute">Enroute</option>
          <option value="On Scene">On Scene</option>
          <option value="Controlled">Controlled</option>
          <option value="Closed">Closed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <button class="btn btn-sm" onclick="openAssign('${c.id}')">Assign Units</button>
      </div>
    </div>
  `
    )
    .join("");
}

function renderResponderCalls() {
  const el = document.getElementById("responderCallList");
  const myCallsign = currentUser.callsign;
  const calls = [...(data.calls || [])]
    .filter(c => !["Closed", "Cancelled"].includes(c.status))
    .reverse();

  if (calls.length === 0) {
    el.innerHTML = `<div class="empty">No active calls.</div>`;
    return;
  }

  el.innerHTML = calls
    .map(c => {
      const assigned = (c.assignedUnits || []).includes(myCallsign);
      return `
      <div class="card call-card ${assigned ? "assigned" : ""}">
        <div class="card-header">
          <strong>#${c.id.slice(-5).toUpperCase()} – ${c.type}</strong>
          ${statusBadge(c.status)}
          ${assigned ? '<span class="badge badge-assigned">ASSIGNED TO YOU</span>' : ""}
        </div>
        <div class="card-body">
          <div><i class="icon">📍</i> ${c.location}</div>
          <div><i class="icon">📝</i> ${c.description || "—"}</div>
          <div><i class="icon">🕒</i> ${formatTime(c.createdAt)}</div>
          <div><i class="icon">🚒</i> Units: ${(c.assignedUnits || []).join(", ") || "None"}</div>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderUnits() {
  const el = document.getElementById("unitList");
  const units = data.units || [];
  el.innerHTML = units
    .map(
      u => `
    <div class="unit-row">
      <span class="callsign">${u.callsign}</span>
      <span class="unit-name">${u.name}</span>
      ${statusBadge(u.status)}
      <small>${u.lastUpdate ? formatTime(u.lastUpdate) : ""}</small>
    </div>
  `
    )
    .join("");
}

function renderMyStatus() {
  const el = document.getElementById("myStatus");
  const me = (data.units || []).find(u => u.id === currentUser.username);
  if (!me) {
    el.innerHTML = "<p>Unit not found in system.</p>";
    return;
  }
  el.innerHTML = `
    <div class="status-display">
      <div class="big-callsign">${me.callsign}</div>
      <div>Current Status: ${statusBadge(me.status)}</div>
      <div class="status-buttons">
        <button class="btn btn-status" onclick="setMyStatus('Available')">Available</button>
        <button class="btn btn-status" onclick="setMyStatus('Enroute')">Enroute</button>
        <button class="btn btn-status" onclick="setMyStatus('On Scene')">On Scene</button>
        <button class="btn btn-status" onclick="setMyStatus('Returning')">Returning</button>
        <button class="btn btn-status btn-danger" onclick="setMyStatus('Out of Service')">OOS</button>
      </div>
    </div>
  `;
}

function renderMessages() {
  const el = document.getElementById(
    currentUser.role === "dispatch" ? "dispatchMessages" : "responderMessages"
  );
  const msgs = [...(data.messages || [])].slice(-30).reverse();
  el.innerHTML = msgs
    .map(
      m => `
    <div class="msg ${m.from === currentUser.username ? "mine" : ""}">
      <strong>${m.fromName || m.from}</strong>
      <span class="msg-time">${formatTime(m.time)}</span>
      <div>${m.text}</div>
    </div>
  `
    )
    .join("") || `<div class="empty">No messages yet.</div>`;
}

function renderReports() {
  const el = document.getElementById(
    currentUser.role === "dispatch" ? "dispatchReports" : "responderReports"
  );
  const reps = [...(data.reports || [])].reverse().slice(0, 20);
  el.innerHTML = reps
    .map(
      r => `
    <div class="card report-card">
      <div class="card-header">
        <strong>${r.fromCallsign || r.from}</strong>
        <span class="msg-time">${formatTime(r.time)}</span>
      </div>
      <div class="card-body">${r.text}</div>
      ${r.location ? `<div class="card-body"><i class="icon">📍</i> ${r.location}</div>` : ""}
    </div>
  `
    )
    .join("") || `<div class="empty">No reports yet.</div>`;
}

// ---------- Actions ----------
async function createCall() {
  const type = document.getElementById("callType").value;
  const location = document.getElementById("callLocation").value.trim();
  const description = document.getElementById("callDesc").value.trim();
  const lat = parseFloat(document.getElementById("callLat").value) || null;
  const lng = parseFloat(document.getElementById("callLng").value) || null;

  if (!type || !location) {
    showToast("Type and Location required", "error");
    return;
  }

  const call = {
    id: generateId(),
    type,
    location,
    description,
    lat,
    lng,
    status: "Pending",
    assignedUnits: [],
    createdBy: currentUser.username,
    createdAt: new Date().toISOString()
  };

  data.calls = data.calls || [];
  data.calls.push(call);

  const ok = await saveData(data);
  if (ok) {
    showToast("Call created", "success");
    document.getElementById("callLocation").value = "";
    document.getElementById("callDesc").value = "";
    document.getElementById("callLat").value = "";
    document.getElementById("callLng").value = "";
    renderUI();
    updateMap();
  }
}

async function updateCallStatus(id, status) {
  if (!status) return;
  const call = (data.calls || []).find(c => c.id === id);
  if (!call) return;
  call.status = status;
  call.updatedAt = new Date().toISOString();
  await saveData(data);
  showToast(`Status → ${status}`, "success");
  renderUI();
  updateMap();
}

function openAssign(callId) {
  const call = (data.calls || []).find(c => c.id === callId);
  if (!call) return;

  const units = (data.units || []).filter(u => u.status !== "Out of Service");
  const options = units
    .map(
      u =>
        `<label><input type="checkbox" value="${u.callsign}" ${(
          call.assignedUnits || []
        ).includes(u.callsign) ? "checked" : ""}> \( {u.callsign} ( \){u.status})</label>`
    )
    .join("<br>");

  const modal = document.getElementById("modal");
  document.getElementById("modalTitle").textContent = `Assign Units – #${callId.slice(-5).toUpperCase()}`;
  document.getElementById("modalBody").innerHTML = options || "No units available";
  document.getElementById("modalConfirm").onclick = async () => {
    const checked = [...document.querySelectorAll("#modalBody input:checked")].map(
      i => i.value
    );
    call.assignedUnits = checked;
    if (call.status === "Pending" && checked.length) call.status = "Dispatched";
    await saveData(data);
    closeModal();
    showToast("Units assigned", "success");
    renderUI();
  };
  modal.classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

async function setMyStatus(status) {
  const unit = (data.units || []).find(u => u.id === currentUser.username);
  if (!unit) return;
  unit.status = status;
  unit.lastUpdate = new Date().toISOString();
  await saveData(data);
  showToast(`Status set to ${status}`, "success");
  renderUI();
}

async function sendMessage() {
  const inputId = currentUser.role === "dispatch" ? "dispatchMsgInput" : "responderMsgInput";
  const text = document.getElementById(inputId).value.trim();
  if (!text) return;

  data.messages = data.messages || [];
  data.messages.push({
    id: generateId(),
    from: currentUser.username,
    fromName: currentUser.callsign || currentUser.name,
    text,
    time: new Date().toISOString()
  });

  // Keep last 100
  if (data.messages.length > 100) data.messages = data.messages.slice(-100);

  const ok = await saveData(data);
  if (ok) {
    document.getElementById(inputId).value = "";
    renderUI();
  }
}

async function submitReport() {
  const text = document.getElementById("reportText").value.trim();
  const location = document.getElementById("reportLocation").value.trim();
  if (!text) {
    showToast("Report text required", "error");
    return;
  }

  data.reports = data.reports || [];
  data.reports.push({
    id: generateId(),
    from: currentUser.username,
    fromCallsign: currentUser.callsign,
    text,
    location: location || null,
    time: new Date().toISOString()
  });

  if (data.reports.length > 50) data.reports = data.reports.slice(-50);

  const ok = await saveData(data);
  if (ok) {
    document.getElementById("reportText").value = "";
    document.getElementById("reportLocation").value = "";
    showToast("Report submitted", "success");
    renderUI();
  }
}

// Geolocation helper for responders
function getMyLocation(forReport = false) {
  if (!navigator.geolocation) {
    showToast("Geolocation not supported", "error");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      if (forReport) {
        document.getElementById("reportLocation").value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      } else {
        document.getElementById("callLat").value = latitude.toFixed(5);
        document.getElementById("callLng").value = longitude.toFixed(5);
      }
      showToast("Location captured", "success");
    },
    () => showToast("Could not get location", "error")
  );
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  // Restore session
  const saved = localStorage.getItem("bfp_mdt_session");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      document.getElementById("loginScreen").classList.add("hidden");
      document.getElementById("app").classList.remove("hidden");
      document.getElementById("userBadge").textContent =
        `\( {currentUser.callsign || currentUser.name} ( \){currentUser.role.toUpperCase()})`;

      if (currentUser.role === "dispatch") {
        document.getElementById("dispatchPanel").classList.remove("hidden");
        document.getElementById("responderPanel").classList.add("hidden");
      } else {
        document.getElementById("dispatchPanel").classList.add("hidden");
        document.getElementById("responderPanel").classList.remove("hidden");
      }
      setTimeout(initMap, 150);
      sync().then(() => {
        lastKnownCallCount = (data.calls || []).length;
        lastKnownReportCount = (data.reports || []).length;
        lastKnownMsgCount = (data.messages || []).length;
      });
      syncTimer = setInterval(sync, SYNC_INTERVAL);
    } catch (e) {
      localStorage.removeItem("bfp_mdt_session");
    }
  }

  // Local fallback if no JSONBin
  if (JSONBIN_BIN_ID === "YOUR_BIN_ID_HERE") {
    const local = localStorage.getItem("bfp_mdt_local");
    if (local) {
      try {
        data = JSON.parse(local);
      } catch (e) {}
    }
  }

  // Enter key on login
  document.getElementById("loginPass").addEventListener("keydown", e => {
    if (e.key === "Enter") login();
  });
});

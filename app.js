// ================================
// BFP / FD Advanced MDT & CAD
// Real FD Theme + Category Status System
// ================================

const USERS = {
  dispatch: { password: "dispatch2024", role: "dispatch", name: "Dispatcher 1", callsign: "Dispatch" },
  resp1: { password: "resp123", role: "responder", name: "Responder 1", callsign: "Engine 1" },
  resp2: { password: "resp123", role: "responder", name: "Responder 2", callsign: "Engine 2" },
  resp3: { password: "resp123", role: "responder", name: "Responder 3", callsign: "Ladder 1" },
  resp4: { password: "resp123", role: "responder", name: "Responder 4", callsign: "Rescue 1" },
  resp5: { password: "resp123", role: "responder", name: "Responder 5", callsign: "Tanker 1" }
};

// Category → Subtypes & Statuses
const CALL_CONFIG = {
  Fire: {
    subtypes: ["Residential", "Commercial", "Industrial", "Vehicle", "Grass / Brush", "Electrical", "Others"],
    multi: false,
    statuses: [
      "Pending", "Dispatched", "Enroute", "On Scene",
      "1st Alarm", "2nd Alarm", "3rd Alarm", "4th Alarm", "5th Alarm",
      "Task Force", "FUC", "FOA", "Closed"
    ]
  },
  Medical: {
    subtypes: ["Vehicular Accident", "Medical Emergency", "Trauma", "Cardiac", "Respiratory", "Others"],
    multi: false,
    statuses: [
      "Pending", "Dispatched", "Ambu Enroute", "On Scene",
      "Transporting", "At Hospital", "Call Ended", "Closed"
    ]
  },
  Rescue: {
    subtypes: [
      "Search & Rescue", "Water Rescue / WASAR", "Flood Swift Water",
      "Flood Rescue", "High Angle", "Confined Space", "Vehicle Extrication"
    ],
    multi: true,
    statuses: [
      "Pending", "Dispatched", "Rescue Enroute", "On Scene",
      "Ongoing", "Rescue Completed", "Closed"
    ]
  }
};

let currentUser = null;
let data = { calls: [], reports: [], units: [], messages: [], lastUpdated: null };
let lastKnownCallCount = 0, lastKnownReportCount = 0, lastKnownMsgCount = 0;
let map = null, markers = {}, syncTimer = null, audioCtx = null;
let pinMode = null, tempPinMarker = null;
let mediaRecorder = null, recordedChunks = [], recordedBlob = null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-PH", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}
function playBeep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.frequency.value = 880; osc.type = "square";
      gain.gain.setValueAtTime(0.3, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.18 + 0.12);
      osc.start(now + i * 0.18); osc.stop(now + i * 0.18 + 0.13);
    }
  } catch (e) {}
}
function showToast(msg, type) {
  type = type || "info";
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  setTimeout(function () { t.classList.remove("show"); }, 3500);
}

// ---------- JSONBin ----------
async function fetchData() {
  if (JSONBIN_BIN_ID === "YOUR_BIN_ID_HERE" || JSONBIN_API_KEY === "YOUR_MASTER_KEY_HERE") return data;
  try {
    const res = await fetch("https://api.jsonbin.io/v3/b/" + JSONBIN_BIN_ID + "/latest", {
      headers: { "X-Master-Key": JSONBIN_API_KEY }
    });
    if (!res.ok) throw new Error("Fetch failed");
    const json = await res.json();
    return json.record || json;
  } catch (err) {
    showToast("Sync failed", "error");
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
    const res = await fetch("https://api.jsonbin.io/v3/b/" + JSONBIN_BIN_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": JSONBIN_API_KEY },
      body: JSON.stringify(newData)
    });
    if (!res.ok) throw new Error("Save failed");
    data = newData;
    return true;
  } catch (err) {
    showToast("Save failed", "error");
    return false;
  }
}

async function sync() {
  const remote = await fetchData();
  if (!remote) return;

  const newCalls = (remote.calls || []).length > lastKnownCallCount;
  const newReports = (remote.reports || []).length > lastKnownReportCount;
  const newMsgs = (remote.messages || []).length > lastKnownMsgCount;

  if ((newCalls || newReports || newMsgs) && currentUser) {
    playBeep();
    if (newCalls) showToast("🚨 New Incident!", "alert");
    else if (newReports) showToast("📋 New Report!", "alert");
    else showToast("💬 New message", "info");
  }

  lastKnownCallCount = (remote.calls || []).length;
  lastKnownReportCount = (remote.reports || []).length;
  lastKnownMsgCount = (remote.messages || []).length;
  data = remote;

  if (!data.units || data.units.length === 0) {
    data.units = Object.keys(USERS)
      .filter(function (u) { return USERS[u].role === "responder"; })
      .map(function (id) {
        return {
          id: id,
          name: USERS[id].name,
          callsign: USERS[id].callsign,
          status: "Available",
          lastUpdate: null
        };
      });
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
  currentUser = { username: user };
  for (var k in USERS[user]) currentUser[k] = USERS[user][k];
  localStorage.setItem("bfp_mdt_session", JSON.stringify(currentUser));

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("userBadge").textContent =
    (currentUser.callsign || currentUser.name) + " (" + currentUser.role.toUpperCase() + ")";

  if (currentUser.role === "dispatch") {
    document.getElementById("dispatchPanel").classList.remove("hidden");
    document.getElementById("responderPanel").classList.add("hidden");
  } else {
    document.getElementById("dispatchPanel").classList.add("hidden");
    document.getElementById("responderPanel").classList.remove("hidden");
  }

  setTimeout(initMap, 120);
  sync().then(function () {
    lastKnownCallCount = (data.calls || []).length;
    lastKnownReportCount = (data.reports || []).length;
    lastKnownMsgCount = (data.messages || []).length;
  });
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(sync, SYNC_INTERVAL);
  showToast("Welcome, " + currentUser.name, "success");
}

function logout() {
  currentUser = null;
  localStorage.removeItem("bfp_mdt_session");
  if (syncTimer) clearInterval(syncTimer);
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  if (map) { map.remove(); map = null; markers = {}; }
  cancelPinMode();
  stopRecording();
}

// ---------- Category UI ----------
function onCategoryChange() {
  const cat = document.getElementById("callCategory").value;
  const container = document.getElementById("subtypeContainer");
  if (!cat || !CALL_CONFIG[cat]) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }
  const cfg = CALL_CONFIG[cat];
  container.classList.remove("hidden");

  if (cfg.multi) {
    let html = '<div class="checkbox-group">';
    cfg.subtypes.forEach(function (s) {
      html += '<label><input type="checkbox" name="subtype" value="' + s + '"> ' + s + '</label>';
    });
    html += "</div>";
    container.innerHTML = html;
  } else {
    let html = '<select id="callSubtype"><option value="">— Select Type —</option>';
    cfg.subtypes.forEach(function (s) {
      html += '<option value="' + s + '">' + s + "</option>";
    });
    html += "</select>";
    container.innerHTML = html;
  }
}

// ---------- Map ----------
function toggleMap() {
  const panel = document.getElementById("mapPanel");
  panel.classList.toggle("open");
  if (panel.classList.contains("open") && map) {
    setTimeout(function () { map.invalidateSize(); }, 200);
  }
}

function initMap() {
  if (map) return;
  const container = document.getElementById("map");
  if (!container) return;
  map = L.map("map").setView(MAP_CENTER, MAP_ZOOM);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap", maxZoom: 19
  }).addTo(map);

  map.on("click", function (e) {
    if (!pinMode) return;
    const lat = e.latlng.lat.toFixed(5);
    const lng = e.latlng.lng.toFixed(5);
    if (pinMode === "call") {
      document.getElementById("callLat").value = lat;
      document.getElementById("callLng").value = lng;
    } else if (pinMode === "report") {
      document.getElementById("reportLocation").value = lat + ", " + lng;
    }
    if (tempPinMarker) map.removeLayer(tempPinMarker);
    tempPinMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
    showToast("Location pinned!", "success");
    cancelPinMode();
    if (window.innerWidth <= 900) {
      document.getElementById("mapPanel").classList.remove("open");
    }
  });
  updateMap();
}

function startPinMode(mode) {
  if (!map) { showToast("Map not ready", "error"); return; }
  pinMode = mode;
  showToast("Click on the map to set location", "info");
  if (window.innerWidth <= 900) {
    document.getElementById("mapPanel").classList.add("open");
    setTimeout(function () { map.invalidateSize(); }, 250);
  }
  var btn = mode === "call" ? document.getElementById("pinCallBtn") : document.getElementById("pinReportBtn");
  if (btn) { btn.textContent = "📍 Click map…"; btn.style.background = "#e74c3c"; }
}

function cancelPinMode() {
  pinMode = null;
  var b1 = document.getElementById("pinCallBtn");
  var b2 = document.getElementById("pinReportBtn");
  if (b1) { b1.textContent = "📌 PIN ON MAP"; b1.style.background = ""; }
  if (b2) { b2.textContent = "📌 PIN"; b2.style.background = ""; }
}

function updateMap() {
  if (!map) return;
  Object.values(markers).forEach(function (m) { map.removeLayer(m); });
  markers = {};

  const active = (data.calls || []).filter(function (c) {
    return c.status !== "Closed" && c.status !== "FOA" && c.status !== "Call Ended" && c.status !== "Rescue Completed";
  });

  active.forEach(function (call) {
    if (call.lat && call.lng) {
      let color = "#3498db";
      if (call.category === "Fire") color = "#e74c3c";
      else if (call.category === "Medical") color = "#3498db";
      else if (call.category === "Rescue") color = "#9b59b6";

      if (call.status === "On Scene" || call.status === "Ongoing" || call.status.indexOf("Alarm") !== -1) {
        color = "#e67e22";
      }
      if (call.status === "FUC" || call.status === "FOA") color = "#27ae60";

      const icon = L.divIcon({
        className: "custom-marker",
        html: '<div style="background:' + color + ';width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 5px rgba(0,0,0,.6);"></div>',
        iconSize: [16, 16], iconAnchor: [8, 8]
      });

      const subtypes = (call.subtypes || []).join(", ") || "—";
      const popup =
        '<div style="min-width:170px;line-height:1.4">' +
        "<strong>" + (call.category || "Incident") + "</strong><br>" +
        subtypes + "<br>" +
        "📍 " + call.location + "<br>" +
        "<b>Status:</b> " + call.status +
        "</div>";

      markers[call.id] = L.marker([call.lat, call.lng], { icon: icon })
        .addTo(map)
        .bindPopup(popup);
    }
  });

  const group = Object.values(markers);
  if (group.length > 0) {
    map.fitBounds(L.featureGroup(group).getBounds().pad(0.2));
  }
}

// ---------- Status Badge ----------
function statusBadge(status) {
  let cls = "badge-pending";
  if (status === "Dispatched") cls = "badge-dispatched";
  else if (status === "Enroute" || status === "Rescue Enroute" || status === "Ambu Enroute") cls = "badge-enroute";
  else if (status === "On Scene") cls = "badge-onscene";
  else if (status.indexOf("Alarm") !== -1 || status === "Task Force") cls = "badge-alarm";
  else if (status === "FUC") cls = "badge-fuc";
  else if (status === "FOA" || status === "Call Ended" || status === "Rescue Completed") cls = "badge-foa";
  else if (status === "Closed") cls = "badge-closed";
  else if (status === "Transporting" || status === "At Hospital") cls = "badge-transport";
  else if (status === "Ongoing") cls = "badge-ongoing";
  else if (status === "Available") cls = "badge-available";
  else if (status === "Out of Service") cls = "badge-oos";

  return '<span class="badge ' + cls + '">' + status + "</span>";
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

function renderDispatchCalls() {
  const el = document.getElementById("dispatchCallList");
  const calls = (data.calls || []).slice().reverse();
  if (!calls.length) {
    el.innerHTML = '<div class="empty">No incidents yet.</div>';
    return;
  }

  el.innerHTML = calls.map(function (c) {
    const catClass = (c.category || "").toLowerCase();
    const closed = (c.status === "Closed" || c.status === "FOA" || c.status === "Call Ended" || c.status === "Rescue Completed") ? "closed" : "";
    const subtypes = (c.subtypes || []).join(", ") || "—";

    let statusOptions = "";
    const cfg = CALL_CONFIG[c.category];
    if (cfg) {
      statusOptions = cfg.statuses.map(function (s) {
        return '<option value="' + s + '">' + s + "</option>";
      }).join("");
    }

    return (
      '<div class="card ' + catClass + " " + closed + '">' +
        '<div class="card-header">' +
          "<strong>#" + c.id.slice(-5).toUpperCase() + " · " + (c.category || "Incident") + "</strong>" +
          statusBadge(c.status) +
        "</div>" +
        '<div class="card-body">Type: ' + subtypes + "</div>" +
        '<div class="card-body">📍 ' + c.location + "</div>" +
        '<div class="card-body">📝 ' + (c.description || "—") + "</div>" +
        '<div class="card-body">🕒 ' + formatTime(c.createdAt) + "</div>" +
        '<div class="card-body">🚒 Units: ' + ((c.assignedUnits || []).join(", ") || "None") + "</div>" +
        '<div class="card-actions">' +
          '<select onchange="updateCallStatus(\'' + c.id + '\', this.value)">' +
            '<option value="">Change Status…</option>' + statusOptions +
          "</select>" +
          '<button class="btn btn-sm" onclick="openAssign(\'' + c.id + '\')">Assign Units</button>' +
        "</div>" +
      "</div>"
    );
  }).join("");
}

function renderResponderCalls() {
  const el = document.getElementById("responderCallList");
  const myCallsign = currentUser.callsign;
  const calls = (data.calls || []).filter(function (c) {
    return c.status !== "Closed" && c.status !== "FOA" && c.status !== "Call Ended" && c.status !== "Rescue Completed";
  }).slice().reverse();

  if (!calls.length) {
    el.innerHTML = '<div class="empty">No active incidents.</div>';
    return;
  }

  el.innerHTML = calls.map(function (c) {
    const assigned = (c.assignedUnits || []).indexOf(myCallsign) !== -1;
    const catClass = (c.category || "").toLowerCase();
    const subtypes = (c.subtypes || []).join(", ") || "—";

    return (
      '<div class="card ' + catClass + (assigned ? " assigned" : "") + '">' +
        '<div class="card-header">' +
          "<strong>#" + c.id.slice(-5).toUpperCase() + " · " + (c.category || "Incident") + "</strong>" +
          statusBadge(c.status) +
          (assigned ? ' <span class="badge badge-assigned">ASSIGNED</span>' : "") +
        "</div>" +
        '<div class="card-body">Type: ' + subtypes + "</div>" +
        '<div class="card-body">📍 ' + c.location + "</div>" +
        '<div class="card-body">📝 ' + (c.description || "—") + "</div>" +
        '<div class="card-body">🕒 ' + formatTime(c.createdAt) + "</div>" +
        '<div class="card-body">🚒 Units: ' + ((c.assignedUnits || []).join(", ") || "None") + "</div>" +
      "</div>"
    );
  }).join("");
}

function renderUnits() {
  const el = document.getElementById("unitList");
  el.innerHTML = (data.units || []).map(function (u) {
    return (
      '<div class="unit-row">' +
        '<span class="callsign">' + u.callsign + "</span>" +
        '<span class="unit-name">' + u.name + "</span>" +
        statusBadge(u.status) +
        "<small>" + (u.lastUpdate ? formatTime(u.lastUpdate) : "") + "</small>" +
      "</div>"
    );
  }).join("");
}

function renderMyStatus() {
  const el = document.getElementById("myStatus");
  const me = (data.units || []).find(function (u) { return u.id === currentUser.username; });
  if (!me) {
    el.innerHTML = "<p>Unit not found.</p>";
    return;
  }
  el.innerHTML =
    '<div class="status-display">' +
      '<div class="big-callsign">' + me.callsign + "</div>" +
      "<div>Current Status: " + statusBadge(me.status) + "</div>" +
      '<div class="status-buttons">' +
        '<button class="btn btn-sm" onclick="setMyStatus(\'Available\')">Available</button>' +
        '<button class="btn btn-sm" onclick="setMyStatus(\'Enroute\')">Enroute</button>' +
        '<button class="btn btn-sm" onclick="setMyStatus(\'On Scene\')">On Scene</button>' +
        '<button class="btn btn-sm" onclick="setMyStatus(\'Returning\')">Returning</button>' +
        '<button class="btn btn-sm" onclick="setMyStatus(\'Out of Service\')">OOS</button>' +
      "</div>" +
    "</div>";
}

function renderMessages() {
  const el = document.getElementById(
    currentUser.role === "dispatch" ? "dispatchMessages" : "responderMessages"
  );
  const msgs = (data.messages || []).slice(-40).reverse();
  if (!msgs.length) {
    el.innerHTML = '<div class="empty">No messages yet.</div>';
    return;
  }
  el.innerHTML = msgs.map(function (m) {
    if (m.type === "voice" && m.audio) {
      return (
        '<div class="msg ' + (m.from === currentUser.username ? "mine" : "") + '">' +
          "<strong>" + (m.fromName || m.from) + "</strong>" +
          '<span class="msg-time">' + formatTime(m.time) + "</span>" +
          '<div style="margin-top:6px;"><audio controls src="' + m.audio + '" style="width:100%;max-width:280px;"></audio></div>' +
        "</div>"
      );
    }
    return (
      '<div class="msg ' + (m.from === currentUser.username ? "mine" : "") + '">' +
        "<strong>" + (m.fromName || m.from) + "</strong>" +
        '<span class="msg-time">' + formatTime(m.time) + "</span>" +
        "<div>" + m.text + "</div>" +
      "</div>"
    );
  }).join("");
}

function renderReports() {
  const el = document.getElementById(
    currentUser.role === "dispatch" ? "dispatchReports" : "responderReports"
  );
  const reps = (data.reports || []).slice().reverse().slice(0, 20);
  if (!reps.length) {
    el.innerHTML = '<div class="empty">No reports yet.</div>';
    return;
  }
  el.innerHTML = reps.map(function (r) {
    return (
      '<div class="card">' +
        '<div class="card-header">' +
          "<strong>" + (r.fromCallsign || r.from) + "</strong>" +
          '<span class="msg-time">' + formatTime(r.time) + "</span>" +
        "</div>" +
       

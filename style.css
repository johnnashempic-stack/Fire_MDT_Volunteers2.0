:root {
  --bg: #0f1419;
  --panel: #1a2332;
  --card: #243044;
  --border: #2f3e55;
  --text: #e6edf5;
  --muted: #8b9bb4;
  --accent: #e74c3c;
  --accent2: #f39c12;
  --success: #27ae60;
  --info: #3498db;
  --danger: #c0392b;
  --radius: 10px;
  --font: "Segoe UI", system-ui, -apple-system, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.45;
  -webkit-tap-highlight-color: transparent;
}

.hidden { display: none !important; }

/* ---------- Login ---------- */
#loginScreen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #0f1419 0%, #1a2332 50%, #2c1810 100%);
  padding: 20px;
}

.login-box {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}

.login-box h1 { font-size: 1.5rem; margin-bottom: 0.3rem; color: var(--accent); text-align: center; }
.login-box .subtitle { text-align: center; color: var(--muted); margin-bottom: 1.5rem; font-size: 0.95rem; }
.login-box label { display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 0.3rem; }
.login-box input {
  width: 100%;
  padding: 0.8rem 1rem;
  margin-bottom: 1rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 1rem;
}
.login-box input:focus { outline: none; border-color: var(--accent); }
.login-box .btn { width: 100%; padding: 0.9rem; font-size: 1.05rem; margin-top: 0.3rem; }
.accounts-hint { margin-top: 1.4rem; font-size: 0.8rem; color: var(--muted); text-align: center; line-height: 1.6; }

/* ---------- App Shell ---------- */
#app { display: flex; flex-direction: column; min-height: 100vh; }

.topbar {
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  padding: 0.65rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.topbar .logo {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

#userBadge {
  background: var(--card);
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  font-size: 0.8rem;
  border: 1px solid var(--border);
  color: var(--text);
  font-weight: 500;
}

.topbar-right { display: flex; gap: 0.5rem; align-items: center; }

.main {
  display: grid;
  grid-template-columns: 1fr 380px;
  flex: 1;
  min-height: 0;
}

.content {
  padding: 0.9rem;
  overflow-y: auto;
  max-height: calc(100vh - 52px);
}

.panel-title {
  font-size: 1.05rem;
  margin-bottom: 0.7rem;
  color: var(--accent2);
}

.section {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.9rem;
  margin-bottom: 0.9rem;
}

.section h3 {
  font-size: 0.85rem;
  margin-bottom: 0.7rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Map */
.map-panel {
  background: var(--panel);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 52px);
}

.map-header {
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
  color: var(--muted);
}

#map { flex: 1; min-height: 220px; background: #1a2332; }

/* Cards & forms */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.8rem;
  margin-bottom: 0.6rem;
}
.call-card.assigned { border-color: var(--accent2); }
.call-card.closed { opacity: 0.55; }

.card-header { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; margin-bottom: 0.45rem; }
.card-body { font-size: 0.88rem; color: var(--muted); margin-bottom: 0.3rem; }
.card-actions { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-top: 0.5rem; }
.card-actions select {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.4rem 0.5rem;
  font-size: 0.85rem;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
}
.badge-pending { background: #3d4f6a; color: #a8c0e0; }
.badge-dispatched { background: #5c4a1f; color: #f5d76e; }
.badge-enroute { background: #1f4a3d; color: #7dcea0; }
.badge-onscene { background: #5c1f1f; color: #f1948a; }
.badge-controlled { background: #1f3d5c; color: #85c1e9; }
.badge-closed { background: #2c2c2c; color: #95a5a6; }
.badge-available { background: #1e3d2f; color: #58d68d; }
.badge-returning { background: #3d2f1e; color: #f5b041; }
.badge-oos { background: #3d1e1e; color: #ec7063; }
.badge-assigned { background: #5c3a1f; color: #f5b041; }

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
}
.form-row input,
.form-row select,
.form-row textarea {
  flex: 1;
  min-width: 120px;
  padding: 0.55rem 0.7rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 0.9rem;
}
.form-row textarea { min-height: 70px; width: 100%; resize: vertical; }

.btn {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 0.55rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
.btn:active { transform: scale(0.97); }
.btn-sm { padding: 0.4rem 0.7rem; font-size: 0.82rem; }
.btn-secondary { background: var(--card); border: 1px solid var(--border); color: var(--text); }
.btn-status { background: var(--card); border: 1px solid var(--border); color: var(--text); padding: 0.4rem 0.65rem; font-size: 0.8rem; }
.btn-danger { background: var(--danger); }
.btn-logout { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 0.35rem 0.7rem; font-size: 0.85rem; }

.unit-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.88rem;
  flex-wrap: wrap;
}
.callsign { font-weight: 700; min-width: 75px; color: var(--accent2); }
.unit-name { flex: 1; color: var(--muted); }

.status-display { text-align: center; padding: 0.4rem 0; }
.big-callsign { font-size: 1.5rem; font-weight: 700; color: var(--accent2); margin-bottom: 0.4rem; }
.status-buttons { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; margin-top: 0.7rem; }

.msg {
  background: var(--card);
  border-radius: 8px;
  padding: 0.5rem 0.7rem;
  margin-bottom: 0.4rem;
  font-size: 0.88rem;
}
.msg.mine { border-left: 3px solid var(--info); }
.msg-time { float: right; font-size: 0.75rem; color: var(--muted); }
.msg-input-row { display: flex; gap: 0.45rem; margin-top: 0.55rem; }
.msg-input-row input {
  flex: 1;
  padding: 0.5rem 0.7rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
}

.voice-row {
  margin-top: 0.7rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}
#recStatus { font-size: 0.85rem; color: var(--muted); }

.empty { color: var(--muted); font-size: 0.9rem; text-align: center; padding: 1rem; }

.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: var(--card);
  color: var(--text);
  padding: 0.8rem 1.3rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  z-index: 9999;
  opacity: 0;
  transition: 0.3s;
  max-width: 90%;
  text-align: center;
}
.toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
.toast.success { border-color: var(--success); }
.toast.error { border-color: var(--danger); }
.toast.alert { border-color: var(--accent); background: #3d1a1a; }

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000; padding: 16px;
}
.modal {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  padding: 1.3rem;
}
.modal h3 { margin-bottom: 0.9rem; color: var(--accent2); }
.modal label { display: block; margin: 0.4rem 0; font-size: 0.9rem; cursor: pointer; }
.modal-actions { display: flex; gap: 0.5rem; margin-top: 1.1rem; justify-content: flex-end; }

.leaflet-container { background: #1a2332; font-family: var(--font); }
.custom-marker { background: transparent !important; border: none !important; }

/* ========== MOBILE (phones) ========== */
@media (max-width: 900px) {
  .main {
    grid-template-columns: 1fr;
  }
  .map-panel {
    position: fixed;
    inset: 0;
    z-index: 150;
    height: 100%;
    display: none;
    border-left: none;
  }
  .map-panel.open {
    display: flex;
  }
  .content {
    max-height: none;
    padding-bottom: 80px;
  }
  .topbar .logo { font-size: 0.95rem; }
  #userBadge { font-size: 0.75rem; }
  .btn, .btn-sm { min-height: 42px; }
  .form-row input, .form-row select, .form-row textarea {
    font-size: 16px; /* prevents zoom on iOS */
  }
}

/* Desktop – hide the map toggle by default look */
@media (min-width: 901px) {
  #toggleMapBtn { display: none; }
  .map-header button { display: none; }
}

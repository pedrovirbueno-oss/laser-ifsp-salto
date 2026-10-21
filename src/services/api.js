const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
  // Check backend server health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return await res.json();
    } catch (e) {
      console.warn('[API WARNING] Backend Node.js offline, usando modo simulação local.');
      return null;
    }
  },

  // Login user
  async login(prontuario, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prontuario, password })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  // Fetch Work Orders from backend
  async getWorkOrders() {
    try {
      const res = await fetch(`${API_BASE_URL}/work-orders`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  // Create Work Order in backend
  async createWorkOrder(osData) {
    try {
      const res = await fetch(`${API_BASE_URL}/work-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(osData)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  // Send hardware actuation command to real ESP32 via backend
  async actuateHardware(action, osCode = null, operatorName = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/esp32/actuate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, osCode, operatorName })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }
};

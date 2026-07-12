const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || error.message || `API Error: ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  // Auth
  register(data: { email: string; password: string; name: string }) {
    return this.request<{ user: any; accessToken: string }>('POST', '/api/auth/register', data);
  }
  login(data: { email: string; password: string }) {
    return this.request<{ user: any; accessToken: string }>('POST', '/api/auth/login', data);
  }
  refresh() {
    return this.request<{ accessToken: string; user: any }>('POST', '/api/auth/refresh');
  }
  logout() {
    return this.request('POST', '/api/auth/logout');
  }

  // Wallets
  getWallets() { return this.request<any[]>('GET', '/api/wallets'); }
  createWallet(data: { name: string; isTreasury?: boolean; isAgent?: boolean; network?: string }) {
    return this.request('POST', '/api/wallets', data);
  }
  importWallet(data: { name: string; privateKey: string; network?: string }) {
    return this.request('POST', '/api/wallets/import', data);
  }
  getWalletBalance(id: string, network?: string) {
    return this.request<{ eth: string; usdc: string; tokens: any[] }>('GET', `/api/wallets/${id}/balance?network=${network || 'base-sepolia'}`);
  }
  renameWallet(id: string, name: string) { return this.request('PATCH', `/api/wallets/${id}`, { name }); }
  setDefaultWallet(id: string) { return this.request('POST', `/api/wallets/${id}/set-default`); }
  deleteWallet(id: string) { return this.request('DELETE', `/api/wallets/${id}`); }

  // Payments
  getPayments(limit = 50, offset = 0) {
    return this.request<any[]>('GET', `/api/payments?limit=${limit}&offset=${offset}`);
  }
  createPayment(data: any) { return this.request('POST', '/api/payments', data); }
  executePayment(id: string) { return this.request('POST', `/api/payments/${id}/execute`); }
  simulatePayment(id: string) { return this.request('POST', `/api/payments/${id}/simulate`); }
  approvePayment(id: string) { return this.request('POST', `/api/payments/${id}/approve`); }

  // Trading
  getQuote(data: any) { return this.request('POST', '/api/trading/quote', data); }
  executeSwap(data: any) { return this.request('POST', '/api/trading/swap', data); }
  getTradeHistory(limit = 50) { return this.request<any[]>('GET', `/api/trading/history?limit=${limit}`); }

  // Strategies
  getStrategies() { return this.request<any[]>('GET', '/api/strategies'); }
  createStrategy(data: any) { return this.request('POST', '/api/strategies', data); }
  activateStrategy(id: string) { return this.request('POST', `/api/strategies/${id}/activate`); }
  pauseStrategy(id: string) { return this.request('POST', `/api/strategies/${id}/pause`); }
  deleteStrategy(id: string) { return this.request('DELETE', `/api/strategies/${id}`); }

  // Missions
  getMissions(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>('GET', `/api/missions${query}`);
  }
  getMission(id: string) { return this.request('GET', `/api/missions/${id}`); }
  getMissionSteps(id: string) { return this.request<any[]>('GET', `/api/missions/${id}/steps`); }
  approveMission(id: string) { return this.request('POST', `/api/missions/${id}/approve`); }
  cancelMission(id: string) { return this.request('POST', `/api/missions/${id}/cancel`); }
  replayMission(id: string) { return this.request('POST', `/api/missions/${id}/replay`); }

  // Portfolio
  getPortfolio() { return this.request('GET', '/api/portfolio'); }
  getPortfolioHistory(limit = 30) { return this.request<any[]>('GET', `/api/portfolio/history?limit=${limit}`); }
  getPortfolioPerformance() { return this.request('GET', '/api/portfolio/performance'); }

  // Dashboard
  getDashboardMetrics() { return this.request('GET', '/api/dashboard/metrics'); }
  getTractionMetrics() { return this.request('GET', '/api/dashboard/traction'); }

  // Notifications
  getNotifications(limit = 50) { return this.request<any[]>('GET', `/api/notifications?limit=${limit}`); }
  markNotificationRead(id: string) { return this.request('PATCH', `/api/notifications/${id}/read`); }

  // AI Providers
  getAIProviders() { return this.request<{ providers: any[] }>('GET', '/api/settings/ai-providers'); }
  addAIProvider(data: { name: string; slug: string; baseUrl: string; apiKey: string; defaultModel: string; isDefault?: boolean }) {
    return this.request<{ provider: any }>('POST', '/api/settings/ai-providers', data);
  }
  updateAIProvider(slug: string, data: Record<string, unknown>) {
    return this.request<{ provider: any }>('PATCH', `/api/settings/ai-providers/${slug}`, data);
  }
  deleteAIProvider(slug: string) { return this.request('DELETE', `/api/settings/ai-providers/${slug}`); }
  testAIProvider(slug: string) {
    return this.request<{ success: boolean; latencyMs: number; error?: string }>('POST', `/api/settings/ai-providers/${slug}/test`);
  }
  setDefaultAIProvider(slug: string) { return this.request('POST', `/api/settings/ai-providers/${slug}/set-default`); }
}

export const api = new ApiClient();

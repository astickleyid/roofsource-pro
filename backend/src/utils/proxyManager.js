/**
 * Proxy Rotation Manager
 * Manages rotating proxy pool for scraping
 */
import dotenv from 'dotenv';
dotenv.config();

export class ProxyManager {
  constructor() {
    this.currentIndex = 0;
    this.proxies = this.loadProxies();
  }

  loadProxies() {
    const proxies = [];

    // Load from environment
    if (process.env.PROXY_HOST && process.env.PROXY_USERNAME) {
      proxies.push({
        host: process.env.PROXY_HOST,
        port: parseInt(process.env.PROXY_PORT || '8080'),
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD
      });
    }

    // Fallback: Free proxy list (less reliable, use for testing only)
    if (proxies.length === 0) {
      console.warn('⚠️  No premium proxies configured. Scraping may be blocked.');
      console.warn('   Add proxy credentials to .env for production use.');
      return [];
    }

    return proxies;
  }

  getProxy() {
    if (this.proxies.length === 0) {
      return null;
    }

    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    
    return proxy;
  }

  getProxyUrl() {
    const proxy = this.getProxy();
    if (!proxy) return null;

    return `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
  }

  getAxiosConfig() {
    const proxy = this.getProxy();
    if (!proxy) return {};

    return {
      proxy: {
        host: proxy.host,
        port: proxy.port,
        auth: {
          username: proxy.username,
          password: proxy.password
        }
      }
    };
  }

  getPuppeteerArgs() {
    const proxyUrl = this.getProxyUrl();
    if (!proxyUrl) return [];

    return [`--proxy-server=${proxyUrl}`];
  }
}

export default new ProxyManager();

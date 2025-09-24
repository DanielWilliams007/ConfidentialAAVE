import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './config/wagmi';
import { Header } from './components/Header';
import { Faucet } from './components/Faucet';
import { Vault } from './components/Vault';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en">
          <div className="app-container">
            <Header />
            <main className="main-content">
              <div className="hero-section">
                <h1 className="hero-title">
                  Welcome to <span className="gradient-text">Confidential AAVE</span>
                </h1>
                <p className="hero-subtitle">
                  Experience the future of private DeFi with fully encrypted transactions and balances
                </p>
              </div>

              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🔒</div>
                  <h3 className="feature-title">End-to-End Encryption</h3>
                  <p className="feature-description">
                    All transactions and balances are encrypted using state-of-the-art FHE technology
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h3 className="feature-title">Lightning Fast</h3>
                  <p className="feature-description">
                    Optimized smart contracts ensure quick and efficient confidential operations
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🛡️</div>
                  <h3 className="feature-title">Battle Tested</h3>
                  <p className="feature-description">
                    Built on proven protocols with rigorous security audits and testing
                  </p>
                </div>
              </div>

              <div className="sections-container">
                <div className="section-wrapper animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                  <Faucet />
                </div>
                <div className="section-wrapper animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                  <Vault />
                </div>
              </div>

              <footer className="footer">
                <div className="footer-content">
                  <p className="footer-text">
                    Built with ❤️ using Zama FHE technology
                  </p>
                  <p className="footer-copyright">
                    © 2024 Confidential AAVE. All rights reserved.
                  </p>
                </div>
              </footer>
            </main>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App
import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <div className="header-logo">
              <div className="header-logo-icon">A</div>
              <h1 className="header-title">Confidential AAVE</h1>
            </div>
            <span className="header-badge">Beta</span>
          </div>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

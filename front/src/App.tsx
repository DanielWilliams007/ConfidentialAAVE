import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { ConfidentialAAVEDashboard } from './components/ConfidentialAAVEDashboard'
import './App.css'

function App() {
  const { isConnected } = useAccount()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>ConfidentialAAVE</h1>
        <p>Simplified encrypted staking protocol powered by Zama FHE</p>
        <ConnectButton />
      </header>

      <main className="app-main">
        {isConnected ? (
          <ConfidentialAAVEDashboard />
        ) : (
          <div className="connect-prompt">
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to interact with ConfidentialAAVE</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

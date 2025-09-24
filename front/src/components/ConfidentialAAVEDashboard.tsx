import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk'
import { DepositForm } from './DepositForm'
import { WithdrawForm } from './WithdrawForm'
import { BalanceDisplay } from './BalanceDisplay'
import './ConfidentialAAVEDashboard.css'

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0x..." // TODO: Update with deployed address

export function ConfidentialAAVEDashboard() {
  const { address } = useAccount()
  const [fhevmInstance, setFhevmInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeFHEVM = async () => {
      try {
        setIsLoading(true)
        // Initialize FHEVM instance
        const instance = await createInstance({
          ...SepoliaConfig,
          network: window.ethereum,
        })
        setFhevmInstance(instance)
      } catch (err) {
        console.error('Failed to initialize FHEVM:', err)
        setError('Failed to initialize FHEVM. Please check your connection.')
      } finally {
        setIsLoading(false)
      }
    }

    if (address && window.ethereum) {
      initializeFHEVM()
    }
  }, [address])

  if (isLoading) {
    return (
      <div className="dashboard loading">
        <p>Initializing FHEVM...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (!fhevmInstance) {
    return (
      <div className="dashboard error">
        <h2>FHEVM Not Available</h2>
        <p>Please make sure you're connected to Sepolia testnet and try again.</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your ConfidentialAAVE Dashboard</h2>
        <p>Address: {address}</p>
      </div>

      <div className="dashboard-content">
        <div className="balance-section">
          <BalanceDisplay
            contractAddress={CONTRACT_ADDRESS}
            fhevmInstance={fhevmInstance}
            userAddress={address!}
          />
        </div>

        <div className="actions-section">
          <div className="action-card">
            <h3>Deposit</h3>
            <DepositForm
              contractAddress={CONTRACT_ADDRESS}
              fhevmInstance={fhevmInstance}
              userAddress={address!}
            />
          </div>

          <div className="action-card">
            <h3>Withdraw</h3>
            <WithdrawForm
              contractAddress={CONTRACT_ADDRESS}
              fhevmInstance={fhevmInstance}
              userAddress={address!}
            />
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>About ConfidentialAAVE</h3>
        <p>
          ConfidentialAAVE is a simplified encrypted staking protocol that allows you to:
        </p>
        <ul>
          <li>Deposit tokens with complete privacy using FHE</li>
          <li>Withdraw your tokens securely</li>
          <li>Keep your balance confidential from other users</li>
        </ul>
        <p>
          All operations are performed on encrypted data, ensuring your financial privacy.
        </p>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { getContract } from 'viem'
import { confidentialAAVEABI } from '../contracts/abi'
import './DepositForm.css'

interface DepositFormProps {
  contractAddress: string
  fhevmInstance: any
  userAddress: string
}

export function DepositForm({ contractAddress, fhevmInstance, userAddress }: DepositFormProps) {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !publicClient || !walletClient || !fhevmInstance) return

    try {
      setIsLoading(true)
      setError(null)
      setStatus('Encrypting amount...')

      // Create encrypted input
      const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress)
      input.add64(BigInt(amount))
      const encryptedInput = await input.encrypt()

      setStatus('Sending transaction...')

      const contract = getContract({
        address: contractAddress as `0x${string}`,
        abi: confidentialAAVEABI,
        client: { public: publicClient, wallet: walletClient },
      })

      // Call deposit function
      const hash = await contract.write.deposit([
        encryptedInput.handles[0],
        encryptedInput.inputProof
      ])

      setStatus('Transaction submitted. Waiting for confirmation...')

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash })

      setStatus('Deposit successful!')
      setAmount('')

      // Clear status after 3 seconds
      setTimeout(() => setStatus(null), 3000)

    } catch (err: any) {
      console.error('Deposit failed:', err)
      setError(err.message || 'Deposit failed')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="deposit-form">
      <form onSubmit={handleDeposit}>
        <div className="input-group">
          <label htmlFor="deposit-amount">Amount to Deposit</label>
          <input
            id="deposit-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount..."
            min="1"
            required
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !amount}
          className="deposit-button"
        >
          {isLoading ? 'Processing...' : 'Deposit'}
        </button>
      </form>

      {status && (
        <div className="status-message success">
          {status}
        </div>
      )}

      {error && (
        <div className="status-message error">
          {error}
        </div>
      )}

      <div className="deposit-info">
        <h4>How it works:</h4>
        <ul>
          <li>Your deposit amount is encrypted before being sent to the blockchain</li>
          <li>No one can see how much you're depositing</li>
          <li>Your balance remains private and confidential</li>
        </ul>
      </div>
    </div>
  )
}
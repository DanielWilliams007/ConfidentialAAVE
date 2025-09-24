import { useState } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { getContract } from 'viem'
import { confidentialAAVEABI } from '../contracts/abi'
import './WithdrawForm.css'

interface WithdrawFormProps {
  contractAddress: string
  fhevmInstance: any
  userAddress: string
}

export function WithdrawForm({ contractAddress, fhevmInstance, userAddress }: WithdrawFormProps) {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const handleWithdraw = async (e: React.FormEvent) => {
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

      // Call withdraw function
      const hash = await contract.write.withdraw([
        encryptedInput.handles[0],
        encryptedInput.inputProof
      ])

      setStatus('Transaction submitted. Waiting for confirmation...')

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash })

      setStatus('Withdrawal successful!')
      setAmount('')

      // Clear status after 3 seconds
      setTimeout(() => setStatus(null), 3000)

    } catch (err: any) {
      console.error('Withdrawal failed:', err)
      setError(err.message || 'Withdrawal failed')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="withdraw-form">
      <form onSubmit={handleWithdraw}>
        <div className="input-group">
          <label htmlFor="withdraw-amount">Amount to Withdraw</label>
          <input
            id="withdraw-amount"
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
          className="withdraw-button"
        >
          {isLoading ? 'Processing...' : 'Withdraw'}
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

      <div className="withdraw-info">
        <h4>Important:</h4>
        <ul>
          <li>You can only withdraw up to your current balance</li>
          <li>Withdrawal amounts are encrypted for privacy</li>
          <li>If you try to withdraw more than your balance, the transaction will fail silently</li>
        </ul>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { getContract } from 'viem'
import { confidentialAAVEABI } from '../contracts/abi'
import './BalanceDisplay.css'

interface BalanceDisplayProps {
  contractAddress: string
  fhevmInstance: any
  userAddress: string
}

export function BalanceDisplay({ contractAddress, fhevmInstance, userAddress }: BalanceDisplayProps) {
  const [balance, setBalance] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const refreshBalance = async () => {
    if (!publicClient || !walletClient || !fhevmInstance) return

    try {
      setIsLoading(true)
      setError(null)

      const contract = getContract({
        address: contractAddress as `0x${string}`,
        abi: confidentialAAVEABI,
        client: publicClient,
      })

      // Get encrypted balance
      const encryptedBalance = await contract.read.balanceOf([userAddress])

      // Decrypt balance using FHEVM
      const keypair = fhevmInstance.generateKeypair()
      const handleContractPairs = [{
        handle: encryptedBalance,
        contractAddress: contractAddress,
      }]

      const startTimeStamp = Math.floor(Date.now() / 1000).toString()
      const durationDays = "10"
      const contractAddresses = [contractAddress]

      const eip712 = fhevmInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      )

      const signature = await walletClient.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message
      )

      const result = await fhevmInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        userAddress,
        startTimeStamp,
        durationDays
      )

      setBalance(result[encryptedBalance]?.toString() || '0')
    } catch (err) {
      console.error('Failed to fetch balance:', err)
      setError('Failed to fetch balance. Make sure you have permission to view this data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshBalance()
  }, [contractAddress, fhevmInstance, userAddress, publicClient, walletClient])

  return (
    <div className="balance-display">
      <h3>Your Balance</h3>
      <div className="balance-content">
        {isLoading ? (
          <div className="balance-loading">
            <p>Decrypting balance...</p>
          </div>
        ) : error ? (
          <div className="balance-error">
            <p>{error}</p>
            <button onClick={refreshBalance}>Retry</button>
          </div>
        ) : (
          <div className="balance-value">
            <span className="amount">{balance || '0'}</span>
            <span className="unit">tokens</span>
          </div>
        )}
      </div>
      <button 
        onClick={refreshBalance}
        disabled={isLoading}
        className="refresh-button"
      >
        {isLoading ? 'Refreshing...' : 'Refresh Balance'}
      </button>
    </div>
  )
}
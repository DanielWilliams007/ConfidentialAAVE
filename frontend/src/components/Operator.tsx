import { useAccount, useReadContract } from 'wagmi';
import { useState } from 'react';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CETH_ADDRESS, CETH_ABI, VAULT_ADDRESS } from '../config/contracts';
import '../styles/Components.css';

export function Operator() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: isOp } = useReadContract({
    address: CETH_ADDRESS || undefined,
    abi: CETH_ABI,
    functionName: 'isOperator',
    args: address && CETH_ADDRESS && VAULT_ADDRESS ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address && !!CETH_ADDRESS && !!VAULT_ADDRESS },
  });

  const setOperator = async () => {
    if (!CETH_ADDRESS || !VAULT_ADDRESS) {
      alert('Contract address is not configured.');
      return;
    }
    if (!address) {
      alert('Please connect your wallet first.');
      return;
    }
    if (!signerPromise) {
      alert('Wallet signer not available. Please try again.');
      return;
    }
    setLoading(true);
    setSuccess(false);
    try {
      const until = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const signer = await signerPromise;
      const ceth = new Contract(CETH_ADDRESS, CETH_ABI, signer);
      const tx = await ceth.setOperator(VAULT_ADDRESS, until);
      await tx.wait();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="section-icon">🔐</div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Vault Authorization</h2>
          <p className="section-subtitle">Grant the vault permission to manage your encrypted tokens</p>
        </div>
        {isOp && (
          <span className="status-badge success">
            ✓ Vault Authorized
          </span>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{isOp ? 'Active' : 'Inactive'}</div>
          <div className="stat-label">Current Status</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">1 Year</div>
          <div className="stat-label">Authorization Period</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">Secure</div>
          <div className="stat-label">Encryption Level</div>
        </div>
      </div>

      <div className="button-group">
        <button
          className={`btn ${isOp ? 'btn-success' : success ? 'btn-success' : 'btn-primary'}`}
          disabled={!address || loading || isOp || !CETH_ADDRESS || !VAULT_ADDRESS}
          onClick={setOperator}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Authorizing...
            </>
          ) : isOp ? (
            <>✓ Vault Already Authorized</>
          ) : success ? (
            <>✓ Successfully Authorized!</>
          ) : (
            <>🔐 Authorize Vault as Operator</>
          )}
        </button>
      </div>

      <div className="info-box">
        <svg className="info-box-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div className="info-box-content">
          <p className="info-box-text">
            Authorization is required before depositing tokens to the vault. This grants the vault contract
            permission to transfer your encrypted tokens securely. The authorization expires after one year.
          </p>
        </div>
      </div>
    </section>
  );
}
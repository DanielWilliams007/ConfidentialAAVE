import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { useState } from 'react';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { VAULT_ADDRESS, VAULT_ABI, CETH_ADDRESS, CETH_ABI } from '../config/contracts';
import '../styles/Components.css';

export function Vault() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance } = useZamaInstance();
  const client = usePublicClient();

  const [amount, setAmount] = useState('1');
  const [decBalance, setDecBalance] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeOperation, setActiveOperation] = useState<'deposit' | 'withdraw' | 'decrypt' | 'authorize' | null>(null);

  const { data: isOperator } = useReadContract({
    address: CETH_ADDRESS || undefined,
    abi: CETH_ABI,
    functionName: 'isOperator',
    args: address && CETH_ADDRESS && VAULT_ADDRESS ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address && !!CETH_ADDRESS && !!VAULT_ADDRESS },
  });

  const authorizeVault = async () => {
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
    setActiveOperation('authorize');
    try {
      const until = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const signer = await signerPromise;
      const ceth = new Contract(CETH_ADDRESS, CETH_ABI, signer);
      const tx = await ceth.setOperator(VAULT_ADDRESS, until);
      await tx.wait();
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  const decryptVaultBalance = async () => {
    if (!instance) {
      alert('Encryption service not initialized. Please try again shortly.');
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
    if (!VAULT_ADDRESS) {
      alert('Contract address is not configured.');
      return;
    }
    if (!client) {
      alert('Network client not ready.');
      return;
    }
    setLoading(true);
    setActiveOperation('decrypt');
    try {
      const latestEnc: string = await client.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI as any,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      }) as unknown as string;

      if (!latestEnc || latestEnc.toLowerCase() === '0x'.padEnd(66, '0')) {
        setDecBalance('0');
        return;
      }

      const signer = await signerPromise;
      const keypair = instance.generateKeypair();
      const handleContractPairs = [{ handle: latestEnc, contractAddress: VAULT_ADDRESS }];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const eip712 = instance.createEIP712(keypair.publicKey, [VAULT_ADDRESS], startTimeStamp, durationDays);
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );
      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        [VAULT_ADDRESS],
        address,
        startTimeStamp,
        durationDays,
      );
      const micro = result[latestEnc] || '0';
      setDecBalance((Number(micro) / 1_000_000).toString());
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  const depositOrWithdraw = async (kind: 'deposit' | 'withdraw') => {
    if (!instance) {
      alert('Encryption service not initialized. Please try again shortly.');
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
    if (!VAULT_ADDRESS) {
      alert('Contract address is not configured.');
      return;
    }
    setLoading(true);
    setActiveOperation(kind);
    try {
      const micro = Math.floor(Number(amount) * 1_000_000);
      const target = VAULT_ADDRESS;
      if (!target) throw new Error('Missing contract address');
      const input = instance.createEncryptedInput(target, address);
      input.add64(micro);
      const encrypted = await input.encrypt();

      const signer = await signerPromise;
      const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const tx = await vault[kind](encrypted.handles[0], encrypted.inputProof);
      await tx.wait();
      await decryptVaultBalance();
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Confidential Vault</h2>
        </div>
      </div>

      <div className="balance-display">
        <div>
          <div className="balance-label">Vault Balance</div>
          <div className="balance-value">
            {decBalance ? (
              <>{decBalance}<span className="balance-unit">cETH</span></>
            ) : (
              <span className="balance-value-hidden">•••••••</span>
            )}
          </div>
        </div>
        <button
          className="btn btn-outline"
          disabled={!address || loading || !VAULT_ADDRESS}
          onClick={decryptVaultBalance}
          style={{ alignSelf: 'center' }}
        >
          {loading && activeOperation === 'decrypt' ? (
            <>
              <span className="loading-spinner"></span>
              Decrypting...
            </>
          ) : (
            <>🔓 Reveal Balance</>
          )}
        </button>
      </div>

      <div className="form-group">
        <div className="form-input-wrapper">
          <input
            className="form-input"
            type="number"
            min="0"
            step="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount in cETH"
          />
        </div>
      </div>

      <div className="button-group">
        <button
          className={`btn ${isOperator ? 'btn-outline' : 'btn-accent'}`}
          disabled={!address || loading || isOperator || !CETH_ADDRESS || !VAULT_ADDRESS}
          onClick={authorizeVault}
        >
          {loading && activeOperation === 'authorize' ? (
            <>
              <span className="loading-spinner"></span>
              Authorizing...
            </>
          ) : isOperator ? (
            <>✓ Vault Authorized</>
          ) : (
            <>🔐 Authorize Vault</>
          )}
        </button>

        <button
          className="btn btn-primary"
          disabled={!address || loading || !VAULT_ADDRESS || !isOperator}
          onClick={() => depositOrWithdraw('deposit')}
        >
          {loading && activeOperation === 'deposit' ? (
            <>
              <span className="loading-spinner"></span>
              Depositing...
            </>
          ) : (
            <>Deposit</>
          )}
        </button>

        <button
          className="btn btn-secondary"
          disabled={!address || loading || !VAULT_ADDRESS}
          onClick={() => depositOrWithdraw('withdraw')}
        >
          {loading && activeOperation === 'withdraw' ? (
            <>
              <span className="loading-spinner"></span>
              Withdrawing...
            </>
          ) : (
            <>Withdraw</>
          )}
        </button>
      </div>
    </section>
  );
}
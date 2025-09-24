import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { useState } from 'react';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { VAULT_ADDRESS, VAULT_ABI, CETH_ADDRESS } from '../config/contracts';

export function Vault() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance } = useZamaInstance();
  const client = usePublicClient();

  const [amount, setAmount] = useState('1');
  const [decBalance, setDecBalance] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { data: encBalance } = useReadContract({
    address: VAULT_ADDRESS || undefined,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address && VAULT_ADDRESS ? [address] : undefined,
    query: { enabled: !!address && !!VAULT_ADDRESS },
  });

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
    try {
      // 1) fetch latest encrypted balance from chain
      const latestEnc: string = await client.readContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI as any,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      }) as unknown as string;

      // zero-handle => treat as 0
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
    try {
      const micro = Math.floor(Number(amount) * 1_000_000);
      // deposit/withdraw both use inputs verified by Vault
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
    }
  };

  return (
    <section style={{ background: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Vault</h2>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <input
          type="number"
          min="0"
          step="0.000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (cETH)"
        />
        <button disabled={!address || loading || !VAULT_ADDRESS} onClick={() => depositOrWithdraw('deposit')}>
          {loading ? 'Processing…' : 'Deposit'}
        </button>
        <button disabled={!address || loading || !VAULT_ADDRESS} onClick={() => depositOrWithdraw('withdraw')}>
          {loading ? 'Processing…' : 'Withdraw'}
        </button>
        <button disabled={!address || loading || !VAULT_ADDRESS} onClick={decryptVaultBalance}>
          {loading ? 'Decrypting…' : 'Decrypt Balance'}
        </button>
        <div>Vault Balance: {decBalance || '***'} cETH</div>
      </div>
      <p style={{ color: '#6b7280', fontSize: 12 }}>Note: authorize the vault as operator before deposit.</p>
    </section>
  );
}

import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { useState } from 'react';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CETH_ADDRESS, CETH_ABI } from '../config/contracts';

export function Faucet() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance } = useZamaInstance();
  const client = usePublicClient();

  const [decBalance, setDecBalance] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { data: encBalance } = useReadContract({
    address: CETH_ADDRESS || undefined,
    abi: CETH_ABI,
    functionName: 'confidentialBalanceOf',
    args: address && CETH_ADDRESS ? [address] : undefined,
    query: { enabled: !!address && !!CETH_ADDRESS },
  });

  const refreshDecryptedBalance = async () => {
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
    if (!CETH_ADDRESS) {
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
        address: CETH_ADDRESS,
        abi: CETH_ABI as any,
        functionName: 'confidentialBalanceOf',
        args: [address as `0x${string}`],
      }) as unknown as string;

      // zero-handle => treat as 0
      if (!latestEnc || latestEnc.toLowerCase() === '0x'.padEnd(66, '0')) {
        setDecBalance('0');
        return;
      }

      const signer = await signerPromise;
      const keypair = instance.generateKeypair();
      const handleContractPairs = [{ handle: latestEnc, contractAddress: CETH_ADDRESS }];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const eip712 = instance.createEIP712(keypair.publicKey, [CETH_ADDRESS], startTimeStamp, durationDays);
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
        [CETH_ADDRESS],
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

  const faucet = async () => {
    if (!signerPromise || !CETH_ADDRESS) return;
    setLoading(true);
    try {
      const signer = await signerPromise;
      const ceth = new Contract(CETH_ADDRESS, CETH_ABI, signer);
      const tx = await ceth.faucet();
      await tx.wait();
      await refreshDecryptedBalance();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ background: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Token Faucet (cETH)</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button disabled={!address || loading || !CETH_ADDRESS} onClick={faucet}>
          {loading ? 'Processing…' : 'Mint 1 cETH'}
        </button>
        <button disabled={!address || loading || !CETH_ADDRESS} onClick={refreshDecryptedBalance}>
          {loading ? 'Decrypting…' : 'Decrypt My Balance'}
        </button>
        <div>Balance: {decBalance || '***'} cETH</div>
      </div>
    </section>
  );
}

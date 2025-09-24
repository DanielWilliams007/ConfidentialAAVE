import { useAccount, useReadContract } from 'wagmi';
import { useState } from 'react';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CETH_ADDRESS, CETH_ABI, VAULT_ADDRESS } from '../config/contracts';

export function Operator() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const [loading, setLoading] = useState(false);

  const { data: isOp } = useReadContract({
    address: CETH_ADDRESS || undefined,
    abi: CETH_ABI,
    functionName: 'isOperator',
    args: address && CETH_ADDRESS && VAULT_ADDRESS ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address && !!CETH_ADDRESS && !!VAULT_ADDRESS },
  });

  const setOperator = async () => {
    if (!signerPromise || !CETH_ADDRESS || !VAULT_ADDRESS) return;
    setLoading(true);
    try {
      const until = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year
      const signer = await signerPromise;
      const ceth = new Contract(CETH_ADDRESS, CETH_ABI, signer);
      const tx = await ceth.setOperator(VAULT_ADDRESS, until);
      await tx.wait();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ background: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Authorize Vault</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button disabled={!address || loading || isOp || !CETH_ADDRESS || !VAULT_ADDRESS} onClick={setOperator}>
          {loading ? 'Authorizing…' : isOp ? 'Vault Authorized' : 'Authorize Vault as Operator'}
        </button>
      </div>
    </section>
  );
}


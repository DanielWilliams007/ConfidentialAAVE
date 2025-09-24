import { useAccount, usePublicClient } from 'wagmi';
import { useState } from 'react';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CETH_ADDRESS, CETH_ABI } from '../config/contracts';
import '../styles/Components.css';

export function Faucet() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance } = useZamaInstance();
  const client = usePublicClient();

  const [decBalance, setDecBalance] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeOperation, setActiveOperation] = useState<'mint' | 'decrypt' | null>(null);

  const refreshDecryptedBalance = async () => {
    if (!instance || !address || !signerPromise || !CETH_ADDRESS || !client) {
      return;
    }
    setLoading(true);
    setActiveOperation('decrypt');
    try {
      const latestEnc: string = await client.readContract({
        address: CETH_ADDRESS,
        abi: CETH_ABI as any,
        functionName: 'confidentialBalanceOf',
        args: [address as `0x${string}`],
      }) as unknown as string;

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
      setActiveOperation(null);
    }
  };

  const faucet = async () => {
    if (!signerPromise || !CETH_ADDRESS) return;
    setLoading(true);
    setActiveOperation('mint');
    try {
      const signer = await signerPromise;
      const ceth = new Contract(CETH_ADDRESS, CETH_ABI, signer);
      const tx = await ceth.faucet();
      await tx.wait();
      await refreshDecryptedBalance();
    } finally {
      setLoading(false);
      setActiveOperation(null);
    }
  };

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2 className="section-title">cETH Balance</h2>
        </div>
      </div>

      <div className="balance-display" style={{ marginBottom: '1rem' }}>
        <div>
          <div className="balance-label">Balance</div>
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
          disabled={!address || loading || !CETH_ADDRESS}
          onClick={refreshDecryptedBalance}
          style={{ alignSelf: 'center' }}
        >
          {loading && activeOperation === 'decrypt' ? (
            <>
              <span className="loading-spinner"></span>
              Revealing...
            </>
          ) : (
            <>🔓 Reveal</>
          )}
        </button>
      </div>

      <button
        className="btn btn-primary"
        disabled={!address || loading || !CETH_ADDRESS}
        onClick={faucet}
        style={{ width: '100%' }}
      >
        {loading && activeOperation === 'mint' ? (
          <>
            <span className="loading-spinner"></span>
            Minting...
          </>
        ) : (
          <>Mint 1 cETH</>
        )}
      </button>
    </section>
  );
}
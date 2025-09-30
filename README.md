# Confidential AAVE

A privacy-preserving DeFi lending protocol built with Fully Homomorphic Encryption (FHE) technology. This project implements a simplified version of AAVE with end-to-end encrypted deposits, withdrawals, and balances, ensuring complete financial privacy on the blockchain.

## 🌟 Overview

Confidential AAVE is a decentralized finance (DeFi) protocol that enables users to deposit and withdraw encrypted tokens while maintaining complete privacy of their balances and transaction amounts. Built on Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine), this protocol allows computation on encrypted data without ever revealing sensitive financial information.

Unlike traditional DeFi protocols where all transaction amounts and balances are publicly visible on-chain, Confidential AAVE keeps your financial activities completely private while maintaining the transparency and security guarantees of blockchain technology.

## ✨ Key Features

### 🔐 Complete Privacy
- **Encrypted Balances**: User balances are stored as encrypted values on-chain and never revealed
- **Private Transactions**: Deposit and withdrawal amounts are encrypted end-to-end
- **Confidential Computation**: All arithmetic operations happen on encrypted data using FHE
- **Zero Knowledge**: Even the smart contract cannot decrypt user balances without permission

### 🚀 Core Functionality
- **ConfidentialETH Token (cETH)**: FHE-enabled ERC20-like token with encrypted balances
- **Public Faucet**: Anyone can claim encrypted cETH tokens for testing
- **Encrypted Deposits**: Securely deposit cETH into the vault with hidden amounts
- **Encrypted Withdrawals**: Withdraw funds with complete privacy
- **Secure Vault**: AAVE-like vault system with confidential balance management

### 🛡️ Security & Safety
- **FHE Safe Math**: Overflow-protected arithmetic operations on encrypted values
- **Access Control Lists**: Fine-grained permissions for viewing encrypted data
- **Auditable Code**: Built on Zama's audited FHE libraries
- **No Front-running**: Encrypted amounts prevent MEV attacks

## 🎯 Problem Solved

### Traditional DeFi Privacy Issues

1. **Public Financial Data**: All balances and transaction amounts are visible to everyone
2. **Lack of Privacy**: Users' financial positions can be tracked and analyzed
3. **Front-running Vulnerability**: Visible transaction amounts enable MEV attacks
4. **Competitive Disadvantage**: Large players can see and react to others' positions
5. **Personal Security Risk**: Wealth visibility can make users targets

### Our Solution

Confidential AAVE solves these issues by:
- Encrypting all sensitive financial data on-chain
- Enabling computations on encrypted data using FHE
- Protecting users from surveillance and analysis
- Preventing front-running through encrypted transactions
- Maintaining audit trails while preserving privacy

## 🏗️ Technical Architecture

### Smart Contracts

#### 1. **ConfidentialETH.sol**
- FHE-enabled fungible token based on `ConfidentialFungibleToken`
- Implements encrypted balance storage and transfers
- Public `faucet()` function for testing - mints 1 cETH to any caller
- Full ERC20-like interface with encrypted amounts
- Location: `contracts/ConfidentialETH.sol`

#### 2. **ConfidentialVault.sol**
- AAVE-inspired vault for encrypted deposits/withdrawals
- Maps users to their encrypted balance: `mapping(address => euint64) private _balances`
- **Deposit Flow**:
  1. User submits encrypted amount with zero-knowledge proof
  2. Vault validates input and pulls tokens via `confidentialTransferFrom`
  3. Updates encrypted balance using safe math operations
  4. Emits event with encrypted values
- **Withdraw Flow**:
  1. User submits encrypted withdrawal amount
  2. Vault checks encrypted balance (without decryption)
  3. Safely decreases balance and transfers tokens
  4. All operations maintain encryption throughout
- Uses `FHESafeMath` for overflow protection on encrypted values
- Location: `contracts/ConfidentialVault.sol`

### Frontend Application

#### Technology Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development
- **Web3 Integration**:
  - Wagmi v2 for React hooks
  - Viem for contract reads
  - Ethers v6 for contract writes
- **Wallet Connection**: RainbowKit for multi-wallet support
- **Encryption SDK**: Zama FHE Relayer SDK for client-side encryption
- **State Management**: TanStack Query (React Query) for async state
- **Styling**: Custom CSS (no Tailwind)

#### Architecture
```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx          # Wallet connection & navigation
│   │   ├── Faucet.tsx          # Claim cETH tokens
│   │   ├── Vault.tsx           # Deposit/withdraw interface
│   │   └── Balance.tsx         # Encrypted balance viewer
│   ├── config/
│   │   └── wagmi.ts            # Web3 configuration
│   ├── hooks/
│   │   └── useFhevm.ts         # FHE encryption hooks
│   └── App.tsx                 # Main application
```

#### Key Features
- **Real-time Balance Updates**: Decrypts and displays user's encrypted balance
- **Encrypted Input**: Client-side encryption before submitting transactions
- **Zero-Knowledge Proofs**: Generates proofs for encrypted inputs
- **Network Support**: Sepolia testnet with automatic contract detection
- **Responsive Design**: Modern, gradient-rich UI without external CSS frameworks

### Development Infrastructure

#### Blockchain Framework
- **Hardhat**: Complete development environment
  - Custom tasks for deployment and testing
  - TypeChain integration for type-safe contracts
  - Gas reporting and test coverage
  - Multiple network support (local, Sepolia)

#### Testing Strategy
- **Unit Tests**: Full coverage of contract logic
- **Integration Tests**: End-to-end encrypted transaction flows
- **Local Testing**: FHEVM-enabled local node
- **Testnet Testing**: Sepolia network validation
- **Test Files**: `test/ConfidentialVault.ts`

#### Deployment Pipeline
1. **Local Development**: Deploy to Hardhat local node with FHEVM support
2. **Testing**: Run comprehensive test suite
3. **Sepolia Deploy**: Deploy using private key from `.env`
4. **Contract Verification**: Automatic Etherscan verification
5. **ABI Export**: Auto-copy ABIs to frontend from `deployments/sepolia/`

## 🔧 Technology Stack

### Core Technologies

#### Zama FHEVM
- **Purpose**: Fully Homomorphic Encryption on Ethereum
- **Features**:
  - `euint64`: Encrypted 64-bit unsigned integers
  - `ebool`: Encrypted boolean values
  - FHE operations: `add`, `sub`, `mul`, `select`, `lte`, `gte`
  - Access Control Lists (ACL) for viewing permissions
- **Documentation**: Zama Protocol Docs (included in `docs/zama_llm.md`)

#### Smart Contract Libraries
- **@fhevm/solidity**: FHE primitives and encrypted types
- **new-confidential-contracts**: Base implementations for FHE tokens
- **@zama-fhe/oracle-solidity**: Oracle integration for decryption
- **encrypted-types**: TypeScript types for FHE values

#### Frontend Libraries
- **@zama-fhe/relayer-sdk**: Client-side encryption and proof generation
- **wagmi**: React hooks for Ethereum
- **viem**: TypeScript Ethereum library
- **ethers**: Web3 provider and contract interaction
- **@rainbow-me/rainbowkit**: Wallet connection UI

#### Development Tools
- **Hardhat**: Smart contract development framework
- **TypeChain**: TypeScript bindings for contracts
- **hardhat-deploy**: Deployment management
- **Mocha/Chai**: Testing framework
- **ESLint/Prettier**: Code quality tools
- **Solhint**: Solidity linting

### Network Configuration
- **Local**: Hardhat node with FHEVM support (chainId: 31337)
- **Testnet**: Sepolia (chainId: 11155111)
- **RPC**: Infura for Sepolia connectivity

## 📦 Installation & Setup

### Prerequisites
- Node.js >= 20.0.0
- npm >= 7.0.0
- Git

### Clone & Install
```bash
# Clone repository
git clone https://github.com/yourusername/ConfidentialAAVE.git
cd ConfidentialAAVE

# Install dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Environment Configuration

Create a `.env` file in the project root:
```bash
# Deployment private key (with 0x prefix)
PRIVATE_KEY=0x0123456789abcdef...

# Infura API key for Sepolia
INFURA_API_KEY=your_infura_key_here

# Optional: Etherscan API key for verification
ETHERSCAN_API_KEY=your_etherscan_key
```

### Compile Contracts
```bash
npm run compile
```

This generates:
- Compiled artifacts in `artifacts/`
- TypeChain types in `types/`
- Deployment info in `deployments/`

## 🚀 Usage

### Local Development

#### 1. Start Local FHEVM Node
```bash
npx hardhat node
```

This starts a local Ethereum node with FHEVM support on `http://localhost:8545`

#### 2. Deploy Contracts
```bash
# Deploy to local network
npx hardhat deploy --network localhost

# Or deploy to Sepolia testnet
npm run deploy:sepolia
```

#### 3. Run Tests
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run coverage

# Run tests on Sepolia
npm run test:sepolia
```

#### 4. Start Frontend
```bash
npm run frontend:dev
```

The frontend will be available at `http://localhost:5173`

### Interacting with Contracts

#### Using Hardhat Tasks
```bash
# Check accounts
npx hardhat accounts

# Custom FHE counter tasks (if available)
npx hardhat FHECounter --network sepolia
```

#### Using Frontend

1. **Connect Wallet**: Click "Connect Wallet" and select your wallet
2. **Get Test Tokens**:
   - Navigate to Faucet section
   - Click "Claim cETH" to receive 1 encrypted cETH
   - Transaction confirms with encrypted amount
3. **Deposit to Vault**:
   - Enter amount to deposit
   - Client encrypts amount and generates proof
   - Approve vault as operator on cETH token
   - Confirm deposit transaction
4. **Withdraw from Vault**:
   - Enter encrypted withdrawal amount
   - System verifies encrypted balance
   - Receive tokens directly to wallet
5. **View Balance**:
   - Balance automatically decrypts for viewing
   - Updates in real-time after transactions

### Contract Interaction (Code)

```typescript
import { ethers } from 'ethers';
import { ConfidentialETH__factory, ConfidentialVault__factory } from './types';

// Connect to contracts
const cETH = ConfidentialETH__factory.connect(cethAddress, signer);
const vault = ConfidentialVault__factory.connect(vaultAddress, signer);

// Claim faucet
await cETH.faucet();

// Encrypt amount using FHE relayer SDK
const encryptedAmount = await encryptAmount(1000000n); // 1 cETH

// Approve vault
await cETH.approve(vaultAddress, encryptedAmount);

// Deposit
await vault.deposit(encryptedAmount, proof);

// Withdraw
await vault.withdraw(encryptedAmount, proof);

// View encrypted balance
const encBalance = await vault.balanceOf(userAddress);
```

## 🧪 Testing

### Test Coverage

The project includes comprehensive tests for:
- ConfidentialETH token operations (mint, transfer, approve)
- ConfidentialVault deposit/withdraw flows
- FHE encryption/decryption
- Edge cases (insufficient balance, overflow protection)
- Access control and permissions

### Running Tests
```bash
# Local tests with FHEVM mock
npm run test

# Sepolia testnet tests (requires deployed contracts)
npm run test:sepolia

# Coverage report
npm run coverage
```

### Test Example
```typescript
describe("ConfidentialVault", function () {
  it("Should deposit encrypted amount", async function () {
    const amount = 1000000n;
    const encrypted = await encryptAmount(amount);

    await expect(vault.deposit(encrypted, proof))
      .to.emit(vault, "Deposited");

    // Balance remains encrypted
    const balance = await vault.balanceOf(user.address);
    expect(balance).to.be.an('object'); // euint64 type
  });
});
```

## 📚 Project Structure

```
ConfidentialAAVE/
├── contracts/              # Solidity smart contracts
│   ├── ConfidentialETH.sol     # FHE ERC20 token
│   ├── ConfidentialVault.sol   # Deposit/withdrawal vault
│   └── FHECounter.sol          # Example FHE contract
├── deploy/                 # Deployment scripts
│   └── deploy.ts               # Automated deployment
├── deployments/            # Deployment artifacts
│   └── sepolia/                # Sepolia contract addresses & ABIs
├── test/                   # Contract tests
│   ├── ConfidentialVault.ts
│   └── FHECounter.ts
├── tasks/                  # Hardhat custom tasks
│   ├── accounts.ts
│   └── FHECounter.ts
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── config/             # Web3 configuration
│   │   ├── hooks/              # Custom React hooks
│   │   └── App.tsx             # Main app
│   └── package.json
├── types/                  # TypeChain generated types
├── docs/                   # Documentation
│   ├── zama_llm.md            # Zama protocol docs
│   └── zama_doc_relayer.md    # FHE relayer SDK docs
├── hardhat.config.ts       # Hardhat configuration
├── tsconfig.json           # TypeScript config
├── package.json            # Project dependencies
└── .env                    # Environment variables (create this)
```

## 🎨 Frontend Architecture Details

### State Management
- React Query for server state (contract reads)
- React hooks for local state
- Wagmi hooks for wallet connection

### FHE Integration
The frontend uses Zama's Relayer SDK to:
1. **Encrypt Inputs**: Convert plaintext amounts to encrypted values
2. **Generate Proofs**: Create zero-knowledge proofs for encrypted inputs
3. **Decrypt Outputs**: View encrypted balances with proper permissions
4. **Manage ACL**: Handle access control for encrypted data

### Design Philosophy
- **No Tailwind**: Custom CSS for full design control
- **Modern Gradients**: Rich visual design with CSS gradients
- **Responsive**: Mobile-first approach
- **Accessibility**: Semantic HTML and ARIA labels
- **Performance**: Code splitting and lazy loading

## 🛣️ Roadmap & Future Plans

### Phase 1: Core Protocol (✅ Completed)
- ✅ ConfidentialETH token implementation
- ✅ ConfidentialVault with deposit/withdraw
- ✅ Faucet mechanism
- ✅ Frontend with encrypted transactions
- ✅ Sepolia testnet deployment

### Phase 2: Enhanced Privacy (Q2 2024)
- [ ] **Multi-token Support**: Add multiple encrypted ERC20 tokens
- [ ] **Private Interest Rates**: Implement confidential yield calculation
- [ ] **Encrypted Collateral**: Add over-collateralization with hidden ratios
- [ ] **Private Liquidations**: Liquidation mechanism without revealing positions
- [ ] **Enhanced ACL**: More granular permission system

### Phase 3: Advanced DeFi (Q3 2024)
- [ ] **Confidential Borrowing**: Implement private lending with encrypted debt
- [ ] **Private Oracles**: Integrate encrypted price feeds
- [ ] **Flash Loans**: Anonymous flash loan functionality
- [ ] **Governance**: Private voting mechanism for protocol upgrades
- [ ] **Risk Management**: Confidential risk scoring system

### Phase 4: Scaling & Security (Q4 2024)
- [ ] **Layer 2 Integration**: Deploy on FHE-enabled L2s for lower costs
- [ ] **Professional Audit**: Complete security audit by reputable firm
- [ ] **Optimization**: Gas optimization for encrypted operations
- [ ] **Cross-chain**: Bridge encrypted assets across chains
- [ ] **Mobile App**: Native mobile application

### Phase 5: Mainnet & Ecosystem (2025)
- [ ] **Mainnet Launch**: Deploy to Ethereum mainnet when FHEVM is production-ready
- [ ] **Liquidity Mining**: Incentive program for early adopters
- [ ] **Partner Integrations**: Integrate with other DeFi protocols
- [ ] **Developer Tools**: SDK and libraries for third-party integrations
- [ ] **Institutional Features**: Features for institutional users
- [ ] **Compliance Tools**: Optional privacy-preserving compliance features

### Research Directions
- **Zero-Knowledge Proofs**: Hybrid ZK + FHE for enhanced privacy
- **Threshold Decryption**: Distributed decryption for added security
- **Homomorphic Signatures**: More efficient encrypted authentication
- **Privacy-Preserving Analytics**: Aggregate statistics without revealing individual data
- **Regulatory Compliance**: Balance privacy with optional transparency features

### Community & Ecosystem
- [ ] **Bug Bounty Program**: Security researcher incentives
- [ ] **Developer Grants**: Fund community projects
- [ ] **Documentation Portal**: Comprehensive developer docs
- [ ] **Educational Content**: Tutorials and workshops on FHE DeFi
- [ ] **Hackathons**: Organize FHE DeFi hackathons

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Coding Standards
- **Solidity**: Follow Solhint rules in `.solhint.json`
- **TypeScript**: Use ESLint configuration in `.eslintrc.yml`
- **Formatting**: Run `npm run prettier:write` before committing
- **Tests**: Maintain >80% code coverage
- **Documentation**: Update docs for all new features

### Areas for Contribution
- Smart contract optimizations
- Frontend UX improvements
- Additional test coverage
- Documentation and tutorials
- Bug fixes and security improvements

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.

The BSD-3-Clause-Clear License is a permissive open source license that:
- Allows commercial and private use
- Permits modification and distribution
- Requires preservation of copyright and license notices
- Explicitly does NOT grant patent rights
- Provides no warranty

## 🆘 Support & Community

### Get Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/ConfidentialAAVE/issues)
- **Discussions**: [Join our community discussions](https://github.com/yourusername/ConfidentialAAVE/discussions)

### Resources
- **Zama Documentation**: [FHEVM Protocol Docs](https://docs.zama.ai/fhevm)
- **FHEVM Hardhat Plugin**: [Development Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- **FHE Relayer SDK**: [Frontend Integration](https://docs.zama.ai/protocol/solidity-guides/development-guide/relayer)

### Community
- **Zama Discord**: [Join the Zama community](https://discord.gg/zama)
- **Twitter**: Follow updates on FHE and DeFi privacy

## 🙏 Acknowledgments

### Built With
- **Zama**: For pioneering FHEVM technology and providing excellent developer tools
- **AAVE**: For inspiration on vault mechanics and DeFi design patterns
- **Hardhat**: For the best-in-class Ethereum development environment
- **Rainbow Kit**: For seamless wallet connection UX

### Special Thanks
- The Zama team for their groundbreaking work on FHE
- The Ethereum community for building the infrastructure we rely on
- All contributors and early adopters of this project

---

## 🔒 Security Notice

**This is experimental software using cutting-edge cryptographic technology.**

- **Testnet Only**: Currently deployed only on Sepolia testnet
- **No Audit**: Has not undergone professional security audit
- **Experimental**: FHEVM is still in development
- **Use at Own Risk**: Do not use with real funds on mainnet
- **Educational Purpose**: Intended for learning and experimentation

### Reporting Security Issues
If you discover a security vulnerability, please email security@yourdomain.com instead of using the public issue tracker.

---

**Built with ❤️ for the future of private DeFi**

*Confidential AAVE - Where Privacy Meets DeFi*
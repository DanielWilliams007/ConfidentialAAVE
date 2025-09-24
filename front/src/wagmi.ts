import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'viem/chains'

export const config = getDefaultConfig({
  appName: 'ConfidentialAAVE',
  projectId: 'YOUR_PROJECT_ID', // Get your project ID at https://cloud.reown.com
  chains: [sepolia],
  ssr: false,
})
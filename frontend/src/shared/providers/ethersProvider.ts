import { ethers } from 'ethers';

/**
 * @title ethersProvider
 * @notice Standard RPC connection provider for IDQ AWallet.
 * Supports dynamic switching between Browser (Coinbase/MetaMask) and Static RPC.
 */

let activeProvider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
let activeSigner: ethers.Signer | null = null;

export const setGlobalProvider = (provider: any) => {
    activeProvider = new ethers.BrowserProvider(provider);
    console.log("[Provider] Global Provider Updated (Browser)");
};

export const getProvider = () => {
    if (activeProvider) return activeProvider;
    
    // Fallback to window.ethereum
    if (typeof window !== 'undefined' && (window as any).ethereum) {
        activeProvider = new ethers.BrowserProvider((window as any).ethereum);
        return activeProvider;
    }
    
    // Static Fallback (Base Mainnet preferred for Basenames)
    return new ethers.JsonRpcProvider(process.env.REACT_APP_RPC_URL || 'https://mainnet.base.org');
};

export const getSigner = async () => {
    if (activeSigner) return activeSigner;

    const provider = getProvider();
    if (provider instanceof ethers.BrowserProvider) {
        activeSigner = await provider.getSigner();
        return activeSigner;
    }
    throw new Error('No secure signer available. Please connect your Coinbase Wallet.');
};

/**
 * @dev Resolve Basenames (ENS on Base) for a given address
 */
export const resolveBasename = async (address: string) => {
    try {
        const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        const name = await provider.lookupAddress(address);
        return name; // Returns "amasasia.base.eth" or null
    } catch (err) {
        console.error("Basename Resolution Error:", err);
        return null;
    }
};

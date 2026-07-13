import { ethers } from 'ethers';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { wallets } from '../db/schema.js';
import { encrypt, decrypt } from '../security/encryption.js';
import {
  NETWORKS,
  ERC20_ABI,
  USDC_DECIMALS,
  type NetworkId,
  type WalletType,
  type WalletBalance,
  type TokenBalance,
} from '@baseagent/shared';

function getProvider(network: NetworkId): ethers.JsonRpcProvider {
  const config = NETWORKS[network];
  const envKey = network === 'base-mainnet' ? 'BASE_MAINNET_RPC_URL' : 'BASE_SEPOLIA_RPC_URL';
  const rpcUrl = process.env[envKey] ?? config.rpcUrl;
  return new ethers.JsonRpcProvider(rpcUrl, config.chainId);
}

export async function createEOAWallet(
  userId: string,
  name: string,
  network: NetworkId = 'base-sepolia',
): Promise<typeof wallets.$inferSelect> {
  const ethWallet = ethers.Wallet.createRandom();
  const encryptedKey = encrypt(ethWallet.privateKey);

  const [wallet] = await db
    .insert(wallets)
    .values({
      userId,
      name,
      address: ethWallet.address,
      type: 'eoa' as WalletType,
      encryptedPrivateKey: encryptedKey,
      network,
    })
    .returning();

  return wallet;
}

export async function importWallet(
  userId: string,
  name: string,
  privateKey: string,
  network: NetworkId = 'base-sepolia',
): Promise<typeof wallets.$inferSelect> {
  const ethWallet = new ethers.Wallet(privateKey);
  const encryptedKey = encrypt(privateKey);

  const existing = await db.query.wallets.findFirst({
    where: and(
      eq(wallets.userId, userId),
      eq(wallets.address, ethWallet.address),
    ),
  });

  if (existing) {
    throw new Error(`Wallet with address ${ethWallet.address} already exists for this user`);
  }

  const [wallet] = await db
    .insert(wallets)
    .values({
      userId,
      name,
      address: ethWallet.address,
      type: 'eoa' as WalletType,
      encryptedPrivateKey: encryptedKey,
      network,
    })
    .returning();

  return wallet;
}

export async function addExternalWallet(
  userId: string,
  name: string,
  address: string,
  type: WalletType,
  network: NetworkId = 'base-sepolia',
): Promise<typeof wallets.$inferSelect> {
  if (!ethers.isAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }

  const [wallet] = await db
    .insert(wallets)
    .values({
      userId,
      name,
      address: ethers.getAddress(address), // checksum
      type,
      network,
    })
    .returning();

  return wallet;
}

export async function getUserWallets(
  userId: string,
): Promise<typeof wallets.$inferSelect[]> {
  return db.query.wallets.findMany({
    where: eq(wallets.userId, userId),
    orderBy: (w, { desc }) => [desc(w.isDefault), desc(w.createdAt)],
  });
}

export async function getWalletById(
  walletId: string,
  userId: string,
): Promise<typeof wallets.$inferSelect | undefined> {
  return db.query.wallets.findFirst({
    where: and(eq(wallets.id, walletId), eq(wallets.userId, userId)),
  });
}

export async function updateWallet(
  walletId: string,
  userId: string,
  data: { name?: string },
): Promise<typeof wallets.$inferSelect> {
  const [updated] = await db
    .update(wallets)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error('Wallet not found');
  }
  return updated;
}

export async function deleteWallet(
  walletId: string,
  userId: string,
): Promise<void> {
  const wallet = await getWalletById(walletId, userId);
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  if (wallet.isDefault) {
    throw new Error('Cannot delete the default wallet');
  }
  if (wallet.isTreasury) {
    throw new Error('Cannot delete a treasury wallet');
  }

  await db.delete(wallets).where(
    and(eq(wallets.id, walletId), eq(wallets.userId, userId)),
  );
}

export async function setDefaultWallet(
  walletId: string,
  userId: string,
): Promise<typeof wallets.$inferSelect> {
  // Unset any existing default
  await db
    .update(wallets)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(and(eq(wallets.userId, userId), eq(wallets.isDefault, true)));

  const [updated] = await db
    .update(wallets)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error('Wallet not found');
  }
  return updated;
}

export async function setTreasuryWallet(
  walletId: string,
  userId: string,
): Promise<typeof wallets.$inferSelect> {
  // Unset any existing treasury
  await db
    .update(wallets)
    .set({ isTreasury: false, updatedAt: new Date() })
    .where(and(eq(wallets.userId, userId), eq(wallets.isTreasury, true)));

  const [updated] = await db
    .update(wallets)
    .set({ isTreasury: true, updatedAt: new Date() })
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error('Wallet not found');
  }
  return updated;
}

export async function getWalletBalance(
  walletId: string,
  userId: string,
): Promise<WalletBalance> {
  const wallet = await getWalletById(walletId, userId);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const network = wallet.network as NetworkId;
  const provider = getProvider(network);
  const networkConfig = NETWORKS[network];

  // Fetch ETH balance
  const ethBalance = await provider.getBalance(wallet.address);

  // Fetch USDC balance
  const usdcContract = new ethers.Contract(networkConfig.usdc, ERC20_ABI, provider);
  const usdcBalance = await usdcContract.balanceOf(wallet.address);

  const tokens: TokenBalance[] = [
    {
      address: networkConfig.usdc,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: USDC_DECIMALS,
      balance: ethers.formatUnits(usdcBalance, USDC_DECIMALS),
      valueUsd: ethers.formatUnits(usdcBalance, USDC_DECIMALS), // USDC is 1:1 USD
    },
  ];

  return {
    eth: ethers.formatEther(ethBalance),
    usdc: ethers.formatUnits(usdcBalance, USDC_DECIMALS),
    tokens,
  };
}

export async function transferETH(
  fromWalletId: string,
  userId: string,
  toAddress: string,
  amount: string,
): Promise<{ txHash: string; explorerUrl: string }> {
  const wallet = await getWalletById(fromWalletId, userId);
  if (!wallet) throw new Error('Wallet not found');
  if (!wallet.encryptedPrivateKey) throw new Error('Wallet has no private key');

  const network = wallet.network as NetworkId;
  const signer = getSigner(wallet);
  const tx = await signer.sendTransaction({
    to: toAddress,
    value: ethers.parseEther(amount),
  });
  const receipt = await tx.wait();
  return {
    txHash: receipt!.hash,
    explorerUrl: `${NETWORKS[network].explorerUrl}/tx/${receipt!.hash}`,
  };
}

export async function transferUSDC(
  fromWalletId: string,
  userId: string,
  toAddress: string,
  amount: string,
): Promise<{ txHash: string; explorerUrl: string }> {
  const wallet = await getWalletById(fromWalletId, userId);
  if (!wallet) throw new Error('Wallet not found');
  if (!wallet.encryptedPrivateKey) throw new Error('Wallet has no private key');

  const network = wallet.network as NetworkId;
  const networkConfig = NETWORKS[network];
  const signer = getSigner(wallet);
  const usdcContract = new ethers.Contract(networkConfig.usdc, ERC20_ABI, signer);
  const tx = await usdcContract.transfer(toAddress, ethers.parseUnits(amount, USDC_DECIMALS));
  const receipt = await tx.wait();
  return {
    txHash: receipt!.hash,
    explorerUrl: `${NETWORKS[network].explorerUrl}/tx/${receipt!.hash}`,
  };
}

export function getDecryptedPrivateKey(
  wallet: typeof wallets.$inferSelect,
): string {
  if (!wallet.encryptedPrivateKey) {
    throw new Error('Wallet does not have a stored private key');
  }
  return decrypt(wallet.encryptedPrivateKey);
}

export function getSigner(
  wallet: typeof wallets.$inferSelect,
): ethers.Wallet {
  const privateKey = getDecryptedPrivateKey(wallet);
  const network = wallet.network as NetworkId;
  const provider = getProvider(network);
  return new ethers.Wallet(privateKey, provider);
}

export { getProvider };

export const walletService = {
  create: createEOAWallet,
  importWallet,
  addExternal: addExternalWallet,
  listByUser: getUserWallets,
  getById: getWalletById,
  rename: (walletId: string, name: string, userId?: string) =>
    updateWallet(walletId, userId || '', { name }),
  delete: deleteWallet,
  setDefault: (userId: string, walletId: string) => setDefaultWallet(walletId, userId),
  setTreasury: (userId: string, walletId: string) => setTreasuryWallet(walletId, userId),
  getBalance: (walletId: string, network: NetworkId, userId?: string) =>
    getWalletBalance(walletId, userId || ''),
  getDecryptedPrivateKey,
  getSigner,
};

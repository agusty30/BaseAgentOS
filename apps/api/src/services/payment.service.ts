import { ethers } from 'ethers';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { payments, paymentSchedules, transactions } from '../db/schema.js';
import { getSigner, getWalletById, getProvider } from './wallet.service.js';
import {
  NETWORKS,
  ERC20_ABI,
  USDC_DECIMALS,
  GAS_BUFFER_MULTIPLIER,
  type NetworkId,
  type PaymentStatus,
  type TransactionResult,
} from '@baseagent/shared';

export async function createPayment(data: {
  userId: string;
  walletId: string;
  type: 'one-time' | 'scheduled' | 'recurring' | 'conditional' | 'batch';
  recipient: string;
  amount: string;
  token: string;
  network: NetworkId;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}): Promise<typeof payments.$inferSelect> {
  if (!ethers.isAddress(data.recipient)) {
    throw new Error('Invalid recipient address');
  }

  const wallet = await getWalletById(data.walletId, data.userId);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const [payment] = await db
    .insert(payments)
    .values({
      userId: data.userId,
      walletId: data.walletId,
      type: data.type,
      status: 'pending',
      recipient: ethers.getAddress(data.recipient),
      amount: data.amount,
      token: data.token,
      network: data.network,
      scheduledAt: data.scheduledAt ?? null,
      metadata: data.metadata ?? null,
    })
    .returning();

  return payment;
}

export async function getUserPayments(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<typeof payments.$inferSelect[]> {
  return db.query.payments.findMany({
    where: eq(payments.userId, userId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    limit,
    offset,
  });
}

export async function getPaymentById(
  paymentId: string,
  userId: string,
): Promise<typeof payments.$inferSelect | undefined> {
  return db.query.payments.findFirst({
    where: and(eq(payments.id, paymentId), eq(payments.userId, userId)),
  });
}

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  extra?: Partial<{
    txHash: string;
    gasUsed: string;
    gasCost: string;
    executedAt: Date;
    error: string;
  }>,
): Promise<typeof payments.$inferSelect> {
  const [updated] = await db
    .update(payments)
    .set({
      status,
      ...extra,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
    .returning();

  if (!updated) {
    throw new Error('Payment not found');
  }
  return updated;
}

export async function simulatePayment(
  paymentId: string,
  userId: string,
): Promise<{ success: boolean; gasEstimate: string; error?: string }> {
  const payment = await getPaymentById(paymentId, userId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  const wallet = await getWalletById(payment.walletId, userId);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const network = payment.network as NetworkId;
  const networkConfig = NETWORKS[network];
  const provider = getProvider(network);
  const signer = getSigner(wallet);

  try {
    const usdcContract = new ethers.Contract(networkConfig.usdc, ERC20_ABI, signer);
    const amountWei = ethers.parseUnits(payment.amount, USDC_DECIMALS);

    // Simulate via eth_call (static call)
    await usdcContract.transfer.staticCall(payment.recipient, amountWei);

    // Estimate gas
    const gasEstimate = await usdcContract.transfer.estimateGas(
      payment.recipient,
      amountWei,
    );

    await updatePaymentStatus(paymentId, 'simulated');

    return {
      success: true,
      gasEstimate: gasEstimate.toString(),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Simulation failed';
    await updatePaymentStatus(paymentId, 'failed', { error: errorMessage });

    return {
      success: false,
      gasEstimate: '0',
      error: errorMessage,
    };
  }
}

export async function executePayment(
  paymentId: string,
  userId: string,
): Promise<TransactionResult> {
  const payment = await getPaymentById(paymentId, userId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'pending' && payment.status !== 'simulated' && payment.status !== 'approved') {
    throw new Error(`Cannot execute payment in status: ${payment.status}`);
  }

  const wallet = await getWalletById(payment.walletId, userId);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const network = payment.network as NetworkId;
  const networkConfig = NETWORKS[network];

  await updatePaymentStatus(paymentId, 'executing');

  try {
    const signer = getSigner(wallet);
    const usdcContract = new ethers.Contract(networkConfig.usdc, ERC20_ABI, signer);
    const amountWei = ethers.parseUnits(payment.amount, USDC_DECIMALS);

    // Estimate gas and apply buffer
    const gasEstimate = await usdcContract.transfer.estimateGas(
      payment.recipient,
      amountWei,
    );
    const gasLimit = BigInt(Math.ceil(Number(gasEstimate) * GAS_BUFFER_MULTIPLIER));

    // Send transaction
    const tx = await usdcContract.transfer(payment.recipient, amountWei, {
      gasLimit,
    });

    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction receipt not received');
    }

    const gasUsed = receipt.gasUsed.toString();
    const gasCost = ethers.formatEther(receipt.gasUsed * receipt.gasPrice);

    // Record transaction
    await db.insert(transactions).values({
      userId,
      walletId: wallet.id,
      txHash: receipt.hash,
      type: 'payment',
      status: 'confirmed',
      network,
      from: wallet.address,
      to: payment.recipient,
      value: payment.amount,
      gasUsed,
      gasCost,
      blockNumber: receipt.blockNumber,
      data: { paymentId, token: payment.token },
    });

    await updatePaymentStatus(paymentId, 'completed', {
      txHash: receipt.hash,
      gasUsed,
      gasCost,
      executedAt: new Date(),
    });

    return {
      txHash: receipt.hash,
      status: 'confirmed',
      gasUsed,
      gasCost,
      blockNumber: receipt.blockNumber,
      explorerUrl: `${networkConfig.explorerUrl}/tx/${receipt.hash}`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Execution failed';
    await updatePaymentStatus(paymentId, 'failed', { error: errorMessage });
    throw new Error(`Payment execution failed: ${errorMessage}`);
  }
}

export async function executeBatchPayments(
  paymentIds: string[],
  userId: string,
): Promise<{ results: Array<{ paymentId: string; success: boolean; txHash?: string; error?: string }> }> {
  const results: Array<{ paymentId: string; success: boolean; txHash?: string; error?: string }> = [];

  for (const paymentId of paymentIds) {
    try {
      const result = await executePayment(paymentId, userId);
      results.push({ paymentId, success: true, txHash: result.txHash });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      results.push({ paymentId, success: false, error: errorMessage });
    }
  }

  return { results };
}

export async function approvePayment(
  paymentId: string,
  userId: string,
): Promise<typeof payments.$inferSelect> {
  const payment = await getPaymentById(paymentId, userId);
  if (!payment) {
    throw new Error('Payment not found');
  }
  if (payment.status !== 'pending' && payment.status !== 'simulated') {
    throw new Error(`Cannot approve payment in status: ${payment.status}`);
  }
  return updatePaymentStatus(paymentId, 'approved');
}

export async function createPaymentSchedule(
  paymentId: string,
  cronExpression: string,
  nextRunAt: Date,
): Promise<typeof paymentSchedules.$inferSelect> {
  const [schedule] = await db
    .insert(paymentSchedules)
    .values({
      paymentId,
      cronExpression,
      nextRunAt,
    })
    .returning();

  return schedule;
}

export const paymentService = {
  create: createPayment,
  listByUser: getUserPayments,
  getById: (id: string) => getPaymentById(id, ''),
  execute: (id: string) => executePayment(id, ''),
  simulate: (id: string) => simulatePayment(id, ''),
  approve: (id: string) => approvePayment(id, ''),
  cancel: async (id: string) => { await updatePaymentStatus(id, 'cancelled'); },
  createBatch: async (data: { userId: string; walletId: string; network: string; payments: Array<{ recipient: string; amount: string }> }) => {
    const created = [];
    for (const p of data.payments) {
      const payment = await createPayment({
        userId: data.userId,
        walletId: data.walletId,
        type: 'batch',
        recipient: p.recipient,
        amount: p.amount,
        token: 'USDC',
        network: data.network as 'base-mainnet' | 'base-sepolia',
      });
      created.push(payment);
    }
    return { payments: created };
  },
};

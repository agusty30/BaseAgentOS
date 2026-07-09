# BaseAgent OS — User Guide

## Getting Started

BaseAgent OS is an autonomous agent operating system for on-chain finance on Base Network. It enables AI agents to manage wallets, execute payments, trade on DEXs, and run trading strategies.

## Dashboard

The dashboard provides an executive overview of your entire operation:

- **Treasury Value**: Total value of all treasury wallets
- **Wallet Balance**: Combined ETH balance across all wallets
- **USDC Balance**: Total USDC across all wallets
- **Open Positions**: Active token positions
- **Agent Health**: Status of all 8 AI agents
- **Pending Approvals**: Tasks waiting for your approval
- **Recent Transactions**: Latest on-chain activity

## Wallets

### Creating a Wallet
1. Navigate to **Wallets**
2. Click **Create Wallet**
3. Enter a name for the wallet
4. Select the wallet purpose (General, Treasury, or Agent)
5. The wallet is automatically generated with a secure private key

### Importing a Wallet
1. Navigate to **Wallets**
2. Click **Import Wallet**
3. Enter the private key (encrypted and stored securely)
4. Enter a name for the wallet

### Wallet Types
- **EOA**: Externally Owned Account — keys managed by the platform
- **WalletConnect**: Connect an external wallet via WalletConnect
- **Coinbase Wallet**: Connect via Coinbase Wallet

### Setting Default & Treasury Wallets
- Click the three-dot menu on any wallet card
- Select **Set as Default** or **Set as Treasury**

## Payments

### One-Time Payment
1. Navigate to **Payments**
2. Click **New Payment**
3. Enter recipient address, amount (USDC), and select wallet
4. Review gas estimate
5. Approve the transaction

### Scheduled Payment
1. Create a new payment
2. Toggle **Schedule Payment**
3. Set the date and time

### Recurring Payment
1. Create a new payment
2. Toggle **Recurring**
3. Set the frequency (daily, weekly, monthly)
4. Set start date and optional end date

### Batch Payment
1. Navigate to **Payments** → **Batch**
2. Add multiple recipients with amounts
3. Review total and gas estimate
4. Approve the batch

## Trading

### Swap Tokens
1. Navigate to **Trading**
2. Select the token to sell (Token In)
3. Select the token to buy (Token Out)
4. Enter the amount
5. Review the quote (price impact, slippage, route)
6. Set slippage tolerance (default 0.5%)
7. Click **Swap**

### DEX Providers
- **Uniswap V3**: Concentrated liquidity, multiple fee tiers
- **Aerodrome**: High liquidity on Base, competitive rates

The platform automatically compares routes across providers to find the best price.

## Strategies

### Dollar Cost Averaging (DCA)
Automatically buy a token at regular intervals.

1. Navigate to **Strategies** → **New Strategy**
2. Select **DCA**
3. Configure: token, amount per buy, frequency
4. Set limits: max daily spend, max position size
5. Enable **Autonomous Execution** to skip approval per trade

### Portfolio Rebalancing
Maintain target allocation across tokens.

1. Select **Rebalance**
2. Set target allocations (e.g., 60% USDC, 30% ETH, 10% other)
3. Set rebalance threshold (e.g., 5% deviation)
4. Set frequency

### Profit Target / Stop Loss
Automatically sell when price targets are hit.

1. Select **Profit Target** or **Stop Loss**
2. Set the token and target price
3. Set the sell amount (partial or full)

## Mission Control

Mission Control is your operational command center. Every agent task flows through here.

### Task Statuses
- **Planning**: Agent is planning the task
- **Queued**: Waiting to be executed
- **Running**: Currently executing
- **Waiting Confirmation**: Needs your approval
- **Simulation**: Running dry simulation
- **Executing**: Broadcasting to blockchain
- **Completed**: Successfully finished
- **Failed**: Encountered an error
- **Retrying**: Automatically retrying

### Approving Tasks
1. Click on a mission in **Waiting Confirmation** status
2. Review the details, risk assessment, and simulation results
3. Click **Approve** or **Reject**

### Replaying Tasks
Completed tasks can be replayed in dry-run mode for testing.

## Portfolio

View your complete portfolio:
- **Total Value**: Aggregate USD value
- **Allocation**: Visual breakdown of holdings
- **Performance**: Daily, weekly, and monthly P/L
- **Holdings**: Detailed token-by-token view
- **History**: Portfolio value over time

## Analytics

View traction metrics calculated from real execution data:
- Total Autonomous Payments
- Total Trading Volume
- Trade Success Rate
- Average Gas Cost
- Portfolio Growth
- Agent Success Rate
- System Availability

## Settings

### Network
Switch between Base Mainnet and Base Sepolia.

### Security
- Change password
- View audit log
- Manage API keys

### Notifications
- Configure notification preferences
- Set alert thresholds

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K / Ctrl+K | Open Command Palette |
| ⌘1-9 | Navigate to page |
| ⌘D | Toggle dark mode |
| Esc | Close dialog/modal |

## Safety Features

- **Transaction Simulation**: Every transaction is simulated before execution
- **Risk Assessment**: AI agents evaluate risk before every action
- **Approval Workflows**: You control what runs autonomously
- **Emergency Stop**: Halt all agent activity instantly
- **Spending Limits**: Set maximum daily spend and position sizes
- **Token Whitelist/Blacklist**: Control which tokens can be traded

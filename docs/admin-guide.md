# BaseAgent OS — Administrator Guide

## System Administration

### User Management

Users have three roles:
- **Admin**: Full access to all features, user management, system settings
- **Operator**: Can execute payments, trades, and manage strategies
- **Viewer**: Read-only access to dashboards and reports

### Role Permissions

| Action | Admin | Operator | Viewer |
|--------|-------|----------|--------|
| View Dashboard | ✓ | ✓ | ✓ |
| View Portfolio | ✓ | ✓ | ✓ |
| View Mission Control | ✓ | ✓ | ✓ |
| Create Wallet | ✓ | ✓ | ✗ |
| Delete Wallet | ✓ | ✗ | ✗ |
| Execute Payment | ✓ | ✓ | ✗ |
| Execute Trade | ✓ | ✓ | ✗ |
| Create Strategy | ✓ | ✓ | ✗ |
| Enable Autonomous Execution | ✓ | ✗ | ✗ |
| Approve Tasks | ✓ | ✓ | ✗ |
| Emergency Stop | ✓ | ✓ | ✗ |
| Manage Users | ✓ | ✗ | ✗ |
| View Audit Logs | ✓ | ✗ | ✗ |
| System Settings | ✓ | ✗ | ✗ |

### Audit Logs

All mutations are logged with:
- User ID
- Action performed
- Resource type and ID
- Request details
- IP address
- Correlation ID
- Timestamp

Access audit logs at **Settings** → **Audit Log** (Admin only).

### Emergency Stop

The Emergency Stop feature halts all autonomous agent activity immediately:

1. Navigate to **Settings** → **System**
2. Click **Emergency Stop**
3. Confirm the action
4. All running and queued missions are cancelled
5. All strategy executions are paused
6. All scheduled payments are suspended

To resume operations, click **Resume Operations** and confirm.

### Network Configuration

1. Navigate to **Settings** → **Network**
2. Select the active network (Base Mainnet or Base Sepolia)
3. Optionally configure custom RPC URLs
4. All new operations will use the selected network

### Risk Limits

Configure global risk limits:

| Limit | Default | Description |
|-------|---------|-------------|
| Max Trade Size | $10,000 | Maximum single trade value |
| Max Daily Volume | $100,000 | Maximum total daily trading volume |
| Max Slippage | 5% (500 bps) | Maximum allowed slippage |
| Gas Buffer | 1.2x | Gas estimate multiplier |

### Token Management

- **Whitelist**: Only whitelisted tokens can be traded
- **Blacklist**: Blacklisted tokens are blocked from trading
- Configure at **Settings** → **Tokens**

### Monitoring

#### System Health
- API health: `GET /health` (returns 200 if healthy)
- Agent health: `GET /agents/status` (returns status of all agents)
- WebSocket: `ws://api:3001/ws` (Mission Control updates)

#### Agent Health States
- **Healthy**: Agent responding, executing tasks normally
- **Degraded**: Agent responding but with elevated error rates
- **Down**: Agent not responding or crashed

#### Database
- Use Drizzle Studio: `pnpm db:studio`
- Monitor connection pool usage
- Check for long-running queries

### Backup & Recovery

#### Database Backup
```bash
pg_dump -h localhost -U baseagent -d baseagent > backup_$(date +%Y%m%d).sql
```

#### Database Restore
```bash
psql -h localhost -U baseagent -d baseagent < backup_20240101.sql
```

#### Wallet Recovery
Encrypted private keys are stored in the database. To recover:
1. Restore database from backup
2. Ensure ENCRYPTION_MASTER_KEY matches the one used for encryption
3. Wallets will be accessible with the correct key

### Scaling

#### Horizontal Scaling
- API service: Deploy multiple instances behind a load balancer
- Agent service: Run multiple instances (tasks distributed via Redis)
- WebSocket: Use Redis adapter for multi-instance WebSocket

#### Vertical Scaling
- PostgreSQL: Increase memory for larger datasets
- Redis: Increase memory for more concurrent jobs
- API/Agent: Increase CPU/memory as needed

### Adding New Blockchain Networks

The architecture supports adding new networks:

1. Add network config to `packages/shared/src/constants/index.ts`
2. Add contract addresses for the new network
3. Verify DEX router compatibility
4. Test on testnet before enabling mainnet
5. Update frontend network switcher

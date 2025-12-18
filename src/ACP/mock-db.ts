
// lib/mock-db.ts

export interface User {
  id: string;
  wallet_address: string;
  joined_at: string;
  go_points: number;
  go_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface Session {
  token: string;
  user_id: string;
  expires_at: string;
}


// In-memory storage
const globalForDb = globalThis as unknown as {
  mockUsers: User[];
  mockSessions: Session[];
};

if (!globalForDb.mockUsers) globalForDb.mockUsers = [];
if (!globalForDb.mockSessions) globalForDb.mockSessions = [];

const users = globalForDb.mockUsers;
const sessions = globalForDb.mockSessions;


export const db = {
  users: {
    findByWallet: async (wallet_address: string): Promise<User | null> => {
      return users.find((u) => u.wallet_address.toLowerCase() === wallet_address.toLowerCase()) || null;
    },
    create: async (wallet_address: string): Promise<User> => {
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        wallet_address,
        joined_at: new Date().toISOString(),
        go_points: 100, // Bonus for new users
        go_tier: 'Bronze',
      };
      users.push(newUser);
      return newUser;
    },
    findById: async (id: string): Promise<User | null> => {
      return users.find((u) => u.id === id) || null;
    },
  },
  sessions: {
    create: async (user_id: string): Promise<Session> => {
      // Look up user to get wallet info (if available in memory at creation time)
      const user = users.find(u => u.id === user_id);
      const wallet = user ? user.wallet_address : '';

      // STATELESS TOKEN with Wallet info
      // Format: base64(userId:wallet:expiresAt) - JSON stringified
      const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      const payload = JSON.stringify({ uid: user_id, wal: wallet, exp: expires_at });
      const token = Buffer.from(payload).toString('base64');

      // We still push to memory for local dev consistency, but verification won't strictly require it
      const newSession = { token, user_id, expires_at };
      sessions.push(newSession);
      return newSession;
    },
    verify: async (token: string): Promise<User | null> => {
      try {
        // 1. Try generic decode
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const payload = JSON.parse(decoded);

        if (!payload.uid || !payload.exp) return null;

        // 2. Check Expiry
        if (new Date(payload.exp) < new Date()) {
          return null; // Expired
        }

        // 3. User Resolution (Stateless Resilience)
        // If server restarted, 'users' array is empty. We must handle this.
        let user = await db.users.findById(payload.uid);

        if (!user) {
          // COLD START RECOVERY:
          // If we have a valid token but no user in memory, it means the server restarted.
          // Since we encoded the wallet address in the token (if using the new create()), we can recover it.

          user = {
            id: payload.uid,
            wallet_address: payload.wal || ("0xRecovered_" + payload.uid.substr(-4)),
            joined_at: new Date().toISOString(),
            go_points: 100,
            go_tier: 'Bronze'
          };
        }

        return user;
      } catch (e) {
        // Not a valid JSON token, fallback to memory check (legacy/local)
        const session = sessions.find((s) => s.token === token);
        if (session && new Date(session.expires_at) > new Date()) {
          return db.users.findById(session.user_id);
        }
        return null;
      }
    }
  }
};

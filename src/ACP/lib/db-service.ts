import clientPromise from '../config/mongodb';
import { ObjectId } from 'mongodb';
import { firestoreService } from '../services/firestore';
import { User, Session, UserMyCashback } from '../types';

// Interfaces moved to types.ts


// In-memory storage (Fallback)
const globalForDb = globalThis as unknown as {
  mockUsers: User[];
  mockCashbacks: UserMyCashback[];
  mockSessions: Session[];
  revokedTokens: Set<string>; // Add blacklist
};

if (!globalForDb.mockUsers) globalForDb.mockUsers = [];
if (!globalForDb.mockCashbacks) globalForDb.mockCashbacks = [];
if (!globalForDb.mockSessions) globalForDb.mockSessions = [];
if (!globalForDb.revokedTokens) globalForDb.revokedTokens = new Set(); // Initialize

const users = globalForDb.mockUsers;
const cashbacks = globalForDb.mockCashbacks;
const sessions = globalForDb.mockSessions;
const revokedTokens = globalForDb.revokedTokens;


export const db = {
  users: {
    findByWallet: async (wallet_address: string): Promise<User | null> => {
        const client = await clientPromise;
        const db = client.db("gogocash");
        const doc = await db.collection("users").findOne({ wallet_address });
        return doc ? mapDocToUser(doc) : null;
    },
    findByEmail: async (email: string): Promise<User | null> => {
        const client = await clientPromise;
        const db = client.db("gogocash");
        const doc = await db.collection("users").findOne({ email });
        return doc ? mapDocToUser(doc) : null;
    },
    findByPhone: async (phone: string): Promise<User | null> => {
        const client = await clientPromise;
        const db = client.db("gogocash");
        const doc = await db.collection("users").findOne({ phone });
        return doc ? mapDocToUser(doc) : null;
    },
    create: async (data: { wallet_address?: string, email?: string, phone?: string }): Promise<User> => {
       // Hybrid: Check if exists in Mongo first
       const client = await clientPromise;
       const db = client.db("gogocash");
       const collection = db.collection("users");
       
       const existing = await collection.findOne({ 
           $or: [
               { wallet_address: data.wallet_address }, 
               { email: data.email }
            ].filter(q => Object.values(q)[0]) 
       });
       
       if (existing) return mapDocToUser(existing);

       const newUser = {
           ...data,
           balance: 0,
           go_points: 0,
           go_tier: 'Bronze',
           joined_at: new Date().toISOString()
       };
       
       const result = await collection.insertOne(newUser);
       return { id: result.insertedId.toString(), ...newUser } as User;
    },
    findById: async (id: string): Promise<User | null> => {
       const client = await clientPromise;
       const db = client.db("gogocash");
       try {
           const doc = await db.collection("users").findOne({ _id: new ObjectId(id) });
           return doc ? mapDocToUser(doc) : null;
       } catch (e) { return null; }
    },
  },
  cashbacks: {
      create: async (userId: string, amount: number): Promise<UserMyCashback> => {
         const client = await clientPromise;
         const db = client.db("gogocash");
         const newCashback = {
             userId,
             cashback_amount: amount,
             status: 'pending',
             created_at: new Date().toISOString()
         };
         const result = await db.collection("usermycashback").insertOne(newCashback);
         return { id: result.insertedId.toString(), ...newCashback } as UserMyCashback;
      },
      findByUser: async (userId: string): Promise<UserMyCashback[]> => {
          const client = await clientPromise;
          const db = client.db("gogocash");
          const docs = await db.collection("usermycashback").find({ userId }).toArray();
          return docs.map(doc => ({
              id: doc._id.toString(),
              userId: doc.userId,
              cashback_amount: doc.cashback_amount,
              status: doc.status as 'pending' | 'approved' | 'rejected',
              created_at: doc.created_at
          }));
      }
  },
  sessions: {
    create: async (user_id: string): Promise<Session> => {
      // Look up user to get info (from Hybrid)
      const user = await db.users.findById(user_id);
      
      // STATELESS TOKEN
      // Format: base64(json)
      const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      
      // Payload can contain partial user info for recovery if needed, but primarily ID
      const payload = JSON.stringify({ 
          uid: user_id, 
          email: user?.email,
          phone: user?.phone,
          wal: user?.wallet_address, 
          exp: expires_at, 
          jti: Date.now() 
      });
      const token = Buffer.from(payload).toString('base64');

      // We still push to memory for local dev consistency, but verification won't strictly require it
      const newSession = { token, user_id, expires_at };
      sessions.push(newSession);
      return newSession;
    },
    revoke: async (token: string): Promise<void> => {
      revokedTokens.add(token);
    },
    verify: async (token: string): Promise<User | null> => {
      // 0. Check Blacklist
      if (revokedTokens.has(token)) {
         return null;
      }

      try {
        // 1. Try generic decode
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const payload = JSON.parse(decoded);

        if (!payload.uid || !payload.exp) return null;

        // 2. Check Expiry
        if (new Date(payload.exp) < new Date()) {
          return null; // Expired
        }

        // 3. User Resolution (Hybrid)
        // Try getting fresh user from DB/Memory
        let user = await db.users.findById(payload.uid);

        if (!user) {
          // COLD START RECOVERY:
          // Recover basic info from token
          user = {
            id: payload.uid,
            wallet_address: payload.wal,
            email: payload.email,
            phone: payload.phone,
            joined_at: new Date().toISOString(),
            balance: 0, // Default for recovered session
            go_points: 100,
            go_tier: 'Bronze'
          };
          // We DON'T push to memory/DB here to avoid auto-creating ghost users, 
          // but we accept it for this session context.
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

// Map MongoDB Doc to User Interface
function mapDocToUser(doc: any): User {
    return {
        id: doc._id.toString(),
        wallet_address: doc.wallet_address,
        email: doc.email,
        phone: doc.phone,
        joined_at: doc.joined_at,
        balance: doc.balance || 0,
        go_points: doc.go_points || 0,
        go_tier: doc.go_tier || 'Bronze'
    };
}

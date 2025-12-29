import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { app } from '../config/firebase-admin'; // We need an admin config file
import { User } from '../types';

const db = getFirestore(app);
const USERS_COL = 'users';

export const firestoreService = {
    users: {
        findById: async (id: string): Promise<User | null> => {
            const doc = await db.collection(USERS_COL).doc(id).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() } as User;
        },
        
        findByEmail: async (email: string): Promise<User | null> => {
            const snapshot = await db.collection(USERS_COL).where('email', '==', email).limit(1).get();
            if (snapshot.empty) return null;
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as User;
        },

        findByPhone: async (phone: string): Promise<User | null> => {
            const snapshot = await db.collection(USERS_COL).where('phone', '==', phone).limit(1).get();
            if (snapshot.empty) return null;
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as User;
        },

        create: async (userData: Partial<User>): Promise<User> => {
            // If ID provided, use it, else auto-gen
            const id = userData.id || db.collection(USERS_COL).doc().id;
            const newUser = {
                id,
                joined_at: new Date().toISOString(),
                balance: 0,
                go_points: 100,
                go_tier: 'Bronze',
                ...userData
            };
            
            // Remove undefined fields
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.keys(newUser).forEach(key => (newUser as any)[key] === undefined && delete (newUser as any)[key]);
            
            await db.collection(USERS_COL).doc(id).set(newUser);
            return newUser as User;
        },

        updateBalance: async (id: string, amount: number) => {
             await db.collection(USERS_COL).doc(id).update({
                 balance: admin.firestore.FieldValue.increment(amount)
             });
        }
    },

    cashbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: async (userId: string, amount: number, description: string = 'Cashback'): Promise<any> => {
            const batch = db.batch();
            
            // 1. Create Transaction Record
            const transRef = db.collection('cashback_transactions').doc();
            const transaction = {
                id: transRef.id,
                userId,
                amount,
                description,
                status: 'pending', // Pending until confirmed
                createdAt: new Date().toISOString()
            };
            batch.set(transRef, transaction);

            // 2. Update User Balance (Immediate credit for MVP, or separate confirmation step)
            // For now, we increment immediately
            const userRef = db.collection(USERS_COL).doc(userId);
            batch.update(userRef, {
                balance: admin.firestore.FieldValue.increment(amount)
            });

            await batch.commit();
            return transaction;
        },

        findByUser: async (userId: string) => {
            const snapshot = await db.collection('cashback_transactions')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    },
    
    products: {
         search: async (query: string, limit: number = 20) => {
             try {
                 // 1. Tokenize query
                 const keyword = query.toLowerCase().split(' ')[0]; // Basic single-keyword match
                 
                 // 2. Query Firestore 'products' collection
                 const snapshot = await db.collection('products')
                     .where('keywords', 'array-contains', keyword)
                     .limit(limit)
                     .get();
                 
                 return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             } catch (error) {
                 console.warn("⚠️ Firestore access failed (likely missing credentials). Returning MOCK data regarding:", query);
                 // Fallback Mock Data for Development/Testing without Auth
                 return [
                     {
                         id: 'mock_1',
                         title: `Mock Product: ${query}`,
                         price: 999,
                         currency: 'USD',
                         image_url: 'https://via.placeholder.com/150',
                         product_url: 'https://example.com/mock',
                         rating: 4.5,
                         sold: 100,
                         keywords: [query.toLowerCase()]
                     },
                     {
                         id: 'mock_2',
                         title: `Mock Accessory for ${query}`,
                         price: 49,
                         currency: 'USD',
                         image_url: 'https://via.placeholder.com/150',
                         product_url: 'https://example.com/mock-2',
                         rating: 4.0,
                         sold: 50,
                         keywords: [query.toLowerCase()]
                     }
                 ];
             }
         }
    }
};

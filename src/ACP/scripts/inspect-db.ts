
import { getCollection, closeConnection } from '../lib/mongodb';

async function inspect() {
    try {
        console.log('--- Inspecting DB Collections ---');

        const usersCol = await getCollection('users');
        if (usersCol) {
            const user = await usersCol.findOne({});
            console.log('\n[Collection: users] Sample Document:');
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('\n[Collection: users] Could not connect or collection empty.');
        }

        const cashbackCol = await getCollection('usermycashbacks');
        if (cashbackCol) {
            const cashback = await cashbackCol.findOne({});
            console.log('\n[Collection: usermycashbacks] Sample Document:');
            console.log(JSON.stringify(cashback, null, 2));
        } else {
             console.log('\n[Collection: usermycashbacks] Could not connect or collection empty.');
        }

    } catch (error) {
        console.error('Inspection failed:', error);
    } finally {
        await closeConnection();
    }
}

inspect();

const SUPABASE_URL = 'https://olnjccddsquaspnacqyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbmpjY2Rkc3F1YXNwbmFjcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzM3MDUsImV4cCI6MjA3ODA0OTcwNX0.Am3MGb1a4yz15aACQMqBx4WB4btBIqTOoQvqUjSLfQA';

if (typeof supabase === 'undefined') {
    console.error('Supabase SDK is not loaded.');
    throw new Error('Supabase SDK is required');
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CACHE_KEY = 'dbtrade';
let dbPromise = null;

function saveToCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        console.log('💾 Data is saved to local');
    } catch (error) {
        console.warn('⚠️ Failed to save data:', error);
    }
}

function getFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.warn('⚠️ Failed to read cache:', error);
    }
    return null;
}

async function loadDB() {
    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            window.location.href = '../index.html';
            return [];
        }

        const userId = user.id;

        // Query trades hanya milik user ini
        const { data: trades, error: tradesErr } = await supabaseClient
            .from('trades')
            .select(`
                id,
                date,
                pairs,
                method,
                entry,
                timeframe,
                rr,
                behavior,
                causes,
                psychology,
                class,
                bias,
                last,
                pos,
                margin,
                result,
                pnl,
                inserted_at
            `)
            .eq('user_id', userId);

        if (tradesErr) throw tradesErr;

        // Query transactions hanya milik user ini
        const { data: transactions, error: txErr } = await supabaseClient
            .from('transactions')
            .select(`
                id,
                date,
                action,
                value,
                inserted_at
            `)
            .eq('user_id', userId);

        if (txErr) throw txErr;

        const allRawData = [
            ...trades.map(t => ({ ...t, type: 'trade' })),
            ...transactions.map(tx => ({ ...tx, type: 'transaction' }))
        ];

        const sortedAllData = allRawData.sort((a, b) => new Date(a.date) - new Date(b.date));

        let tradeCounter = 1;

        const processedData = sortedAllData.map(item => {
            const baseData = {
                id: item.id,
                tradeNumber: tradeCounter++,
                date: new Date(item.date).getTime()
            };

            if (item.type === 'trade') {
                return {
                    ...baseData,
                    Pairs: item.pairs || '',
                    Method: item.method || '',
                    Confluance: {
                        Entry: item.entry || '',
                        TimeFrame: item.timeframe || ''
                    },
                    RR: item.rr || 0,
                    Behavior: item.behavior || '',
                    Causes: item.causes || '',
                    Psychology: item.psychology || '',
                    Class: item.class || '',
                    Files: {
                        Bias: item.bias || '',
                        Last: item.last || ''
                    },
                    Pos: item.pos || '',
                    Margin: item.margin || 0,
                    Result: item.result || '',
                    Pnl: item.pnl || 0
                };
            } else {
                return {
                    ...baseData,
                    action: item.action || '',
                    value: item.value || 0
                };
            }
        });

        const finalData = processedData;

        saveToCache(finalData);

        return finalData;

    } catch (err) {
        const cachedData = getFromCache();
        if (cachedData) {
            return cachedData;
        }
        
        return [];
    }
}

async function getDB() {
    if (!dbPromise) {
        dbPromise = loadDB();
    }
    return await dbPromise;
}

function refreshDBCache() {
    dbPromise = loadDB();
}

document.addEventListener('DOMContentLoaded', () => {
    dbPromise = loadDB().then(data => {
        window.dbtradeData = data;
        document.dispatchEvent(new CustomEvent('dbLoaded', { detail: data }));
        return data;
    });
});

window.getDB = getDB;
window.loadDB = loadDB;
window.refreshDBCache = refreshDBCache;

// ======================= Notes ======================= //
const CACHE_KEY_NOTES = 'dbnotes';
let dbNotesPromise = null;

function saveNotesToCache(data) {
    try {
        localStorage.setItem(CACHE_KEY_NOTES, JSON.stringify(data));
        console.log('📚 Notes saved to local cache');
    } catch (error) {
        console.warn('⚠️ Failed to save notes to cache:', error);
    }
}

function getNotesFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY_NOTES);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.warn('⚠️ Failed to read notes from cache:', error);
    }
    return null;
}

async function loadDBNotes() {
    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            // Optional: redirect or just return empty
            return [];
        }

        const userId = user.id;

        const { data: notes, error: notesErr } = await supabaseClient
            .from('notes')
            .select(`
                id,
                timestamp,
                title,
                category,
                something,
                learning,
                plan,
                user_id
            `)
            .eq('user_id', userId);

        if (notesErr) throw notesErr;

        // Proses data sesuai kebutuhan (misal, ubah timestamp jadi Date kalau perlu)
        const processedNotes = notes.map(note => ({
            id: note.id,
            timestamp: note.timestamp, // udah bigint (ms), bisa langsung dipakai
            title: note.title || '',
            category: note.category || '',
            something: note.something || '',
            learning: note.learning || '',
            plan: note.plan || ''
        }));

        saveNotesToCache(processedNotes);
        return processedNotes;

    } catch (err) {
        console.error('❌ Error loading notes:', err);
        const cachedData = getNotesFromCache();
        if (cachedData) {
            return cachedData;
        }
        return [];
    }
}

async function getDBNotes() {
    if (!dbNotesPromise) {
        dbNotesPromise = loadDBNotes();
    }
    return await dbNotesPromise;
}

function refreshDBNotesCache() {
    dbNotesPromise = loadDBNotes();
}

document.addEventListener('DOMContentLoaded', async () => {
    dbNotesPromise = loadDBNotes().then(data => {
        window.dbnotesData = data;
        document.dispatchEvent(new CustomEvent('notesLoaded', { detail: data }));
        return data;
    });
});

window.getDBNotes = getDBNotes;
window.loadDBNotes = loadDBNotes;
window.refreshDBNotesCache = refreshDBNotesCache;
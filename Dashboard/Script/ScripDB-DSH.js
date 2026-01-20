const SUPABASE_URL = 'https://olnjccddsquaspnacqyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbmpjY2Rkc3F1YXNwbmFjcXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NzM3MDUsImV4cCI6MjA3ODA0OTcwNX0.Am3MGb1a4yz15aACQMqBx4WB4btBIqTOoQvqUjSLfQA';

if (typeof supabase === 'undefined') {
    console.error('Supabase SDK is not loaded.');
    throw new Error('Supabase SDK is required');
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CACHE_KEY = 'dbperpetual';
let dbPromise = null;

function saveToPerpetualCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        console.log('💾 Data Perpetual Saved Local');
    } catch (error) {
        console.warn('⚠️ Failed save data Perpetual:', error);
    }
}

function getPerpetualFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.warn('⚠️ Failed to read cache Perpetual:', error);
    }
    return null;
}

async function loadDBPerpetual() {
    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            window.location.href = '../index.html';
            return [];
        }

        const userId = user.id;

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

        saveToPerpetualCache(finalData);

        return finalData;

    } catch (err) {
        const cachedData = getPerpetualFromCache();
        if (cachedData) {
            return cachedData;
        }
        
        return [];
    }
}

async function getDBPerpetual() {
    if (!dbPromise) {
        dbPromise = loadDBPerpetual();
    }
    return await dbPromise;
}

function refreshDBPerpetualCache() {
    dbPromise = loadDBPerpetual();
}

document.addEventListener('DOMContentLoaded', () => {
    dbPromise = loadDBPerpetual().then(data => {
        window.dbperpetualData = data;
        document.dispatchEvent(new CustomEvent('dbLoaded', { detail: data }));
        return data;
    });
});

window.getDBPerpetual = getDBPerpetual;
window.loadDBPerpetual = loadDBPerpetual;
window.refreshDBPerpetualCache = refreshDBPerpetualCache;

// ======================= Spot Trading ======================= //
const CACHE_KEY_SPOT = 'dbspot';
let dbSpotPromise = null;

function saveSpotToCache(data) {
    try {
        localStorage.setItem(CACHE_KEY_SPOT, JSON.stringify(data));
        console.log('💾 Spot data saved to local');
    } catch (error) {
        console.warn('⚠️ Failed to save spot data:', error);
    }
}

function getSpotFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY_SPOT);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.warn('⚠️ Failed to read spot cache:', error);
    }
    return null;
}

async function loadDBSpot() {
    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            return [];
        }

        const userId = user.id;

        const { data: spots, error: spotErr } = await supabaseClient
            .from('spot')
            .select(`
                id,
                date,
                pairs,
                method,
                timeframe,
                rr,
                causes,
                psychology,
                class,
                bias,
                last,
                margin,
                result,
                pnl,
                inserted_at
            `)
            .eq('user_id', userId);

        if (spotErr) throw spotErr;

        const { data: transactions, error: txErr } = await supabaseClient
            .from('spot_transactions')
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
            ...spots.map(s => ({ ...s, type: 'spot' })),
            ...transactions.map(tx => ({ ...tx, type: 'transaction' }))
        ];

        const sortedAllData = allRawData.sort((a, b) => a.date - b.date);

        let tradeCounter = 1;

        const processedData = sortedAllData.map(item => {
            const baseData = {
                id: item.id,
                tradeNumber: tradeCounter++,
                date: item.date
            };

            if (item.type === 'spot') {
                return {
                    ...baseData,
                    Pairs: item.pairs || '',
                    Method: item.method || '',
                    Confluance: {
                        TimeFrame: item.timeframe || ''
                    },
                    RR: item.rr || 0,
                    Causes: item.causes || '',
                    Psychology: item.psychology || '',
                    Class: item.class || '',
                    Files: {
                        Bias: item.bias || '',
                        Last: item.last || ''
                    },
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

        saveSpotToCache(processedData);
        return processedData;

    } catch (err) {
        console.error('❌ Error loading spot DB:', err);
        const cachedData = getSpotFromCache();
        if (cachedData) {
            return cachedData;
        }
        return [];
    }
}

async function getDBSpot() {
    if (!dbSpotPromise) {
        dbSpotPromise = loadDBSpot();
    }
    return await dbSpotPromise;
}

function refreshDBSpotCache() {
    dbSpotPromise = loadDBSpot();
}

document.addEventListener('DOMContentLoaded', () => {
    dbSpotPromise = loadDBSpot().then(data => {
        window.dbspotData = data;
        document.dispatchEvent(new CustomEvent('spotLoaded', { detail: data }));
        return data;
    });
});

window.getDBSpot = getDBSpot;
window.loadDBSpot = loadDBSpot;
window.refreshDBSpotCache = refreshDBSpotCache;

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

        const processedNotes = notes.map(note => ({
            id: note.id,
            timestamp: note.timestamp,
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
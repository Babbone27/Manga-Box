import { openDB } from 'idb';
import { DB_NAME, DB_VERSION } from '../dbConfig.js';

const STORE_NAME = 'history';

// Helper to get DB connection
const getDB = async () => {
    return openDB(DB_NAME, DB_VERSION);
};

let historyQueue = Promise.resolve();

export const addHistoryEntry = async (entry) => {
    return new Promise((resolve, reject) => {
        historyQueue = historyQueue.then(async () => {
            try {
                const db = await getDB();
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);

                // Try to get the latest entry to see if we can coalesce
                const cursor = await store.openCursor(null, 'prev');
                const lastEntry = cursor ? cursor.value : null;

                const now = new Date();
                const coalesceWindow = 60 * 1000; // 60 seconds

                if (lastEntry && 
                    lastEntry.opera === entry.opera && 
                    (now - new Date(lastEntry.date)) < coalesceWindow) {
                    
                    // Identifica se le azioni sono compatibili per la fusione (es. tutte modifiche date)
                    const datePattern = /^(Data lettura modificata per Vol\. [^ (]+) \((.*) ➜ (.*)\)$/;
                    const isPureDateChange = (azione) => azione.every(act => act.match(datePattern));

                    if (isPureDateChange(lastEntry.azione) && isPureDateChange(entry.azione)) {
                        // Creiamo una mappa delle azioni esistenti per volume (il prefisso identifica il volume)
                        const actionsMap = new Map();
                        
                        lastEntry.azione.forEach(act => {
                            const match = act.match(datePattern);
                            if (match) actionsMap.set(match[1], { start: match[2], end: match[3] });
                        });

                        // Aggiorniamo la mappa con le nuove azioni
                        entry.azione.forEach(newAct => {
                            const match = newAct.match(datePattern);
                            if (match) {
                                const prefix = match[1];
                                const existing = actionsMap.get(prefix);
                                if (existing) {
                                    // Aggiorna solo il valore finale, mantieni l'originale iniziale
                                    actionsMap.set(prefix, { ...existing, end: match[3] });
                                } else {
                                    // Nuovo volume modificato nella stessa sessione, aggiungilo
                                    actionsMap.set(prefix, { start: match[2], end: match[3] });
                                }
                            }
                        });

                        // Ricostruiamo l'array delle azioni
                        const mergedAzione = Array.from(actionsMap.entries()).map(([prefix, vals]) => {
                            return `${prefix} (${vals.start} ➜ ${vals.end})`;
                        });

                        const updatedEntry = {
                            ...lastEntry,
                            azione: mergedAzione,
                            date: now.toISOString()
                        };
                        await cursor.update(updatedEntry);
                        await tx.done;
                        resolve(updatedEntry);
                        return;
                    }
                }

                const fullEntry = {
                    ...entry,
                    date: now.toISOString()
                };
                await store.add(fullEntry);
                await tx.done;
                resolve(fullEntry);
            } catch (err) {
                console.error('Failed to add history entry:', err);
                reject(err);
            }
        });
    });
};

export const getHistory = async () => {
    try {
        const db = await getDB();
        const all = await db.getAll(STORE_NAME);
        // Sort by date descending (newest first)
        return all.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (err) {
        console.error('Failed to get history:', err);
        return [];
    }
};

export const clearHistory = async () => {
    try {
        const db = await getDB();
        await db.clear(STORE_NAME);
    } catch (err) {
        console.error('Failed to clear history:', err);
    }
};

// --- Diff Logic ---

export const generateDiff = (oldManga, newManga) => {
    const changes = [];

    // 1. Status Change
    if (oldManga.status !== newManga.status) {
        changes.push(`Stato serie modificato (${oldManga.status || 'N/A'} > ${newManga.status})`);
    }

    // 2. Volumes Added/Removed
    const oldVols = oldManga.volumes || [];
    const newVols = newManga.volumes || [];

    // Simple check on count first
    if (newVols.length > oldVols.length) {
        // Find which ones are new
        const oldIds = new Set(oldVols.map(v => v.id || v.number)); // fallback if no ID
        const added = newVols.filter(v => !oldIds.has(v.id || v.number));
        if (added.length > 0) {
            const range = getVolumeRange(added);
            changes.push(`Volumi aggiunti (${range})`);
        }
    } else if (newVols.length < oldVols.length) {
        const newIds = new Set(newVols.map(v => v.id || v.number));
        const removed = oldVols.filter(v => !newIds.has(v.id || v.number));
        if (removed.length > 0) {
            const range = getVolumeRange(removed);
            changes.push(`Volumi eliminati (${range})`);
        }
    }

    // 3. Volumes Read/Unread Status
    // We only check intersection
    const oldMap = new Map(oldVols.map(v => [v.id || v.number, v]));
    const readChangedToRead = [];
    const readChangedToUnread = [];

    const unreadWithDate = [];
    const unreadNoDate = [];
    const dateChanged = [];

    newVols.forEach(newVol => {
        const oldVol = oldMap.get(newVol.id || newVol.number);
        if (oldVol) {
            if (!oldVol.read && newVol.read) {
                readChangedToRead.push(newVol);
            } else if (oldVol.read && !newVol.read) {
                if (oldVol.readDate) {
                    unreadWithDate.push({ vol: newVol, date: oldVol.readDate });
                } else {
                    unreadNoDate.push(newVol);
                }
            } else if (oldVol.read && newVol.read && oldVol.readDate !== newVol.readDate) {
                if (oldVol.readDate && newVol.readDate) {
                    const oldD = new Date(oldVol.readDate).toLocaleDateString('it-IT');
                    const newD = new Date(newVol.readDate).toLocaleDateString('it-IT');
                    if (oldD !== newD) {
                        dateChanged.push({ vol: newVol, oldDate: oldVol.readDate, newDate: newVol.readDate });
                    }
                }
            }
        }
    });

    if (readChangedToRead.length > 0) {
        changes.push(`Segnati letti: Vol. ${getVolumeRange(readChangedToRead)}`);
    }

    const unreadParts = [];
    if (unreadNoDate.length > 0) {
        unreadParts.push(`Vol. ${getVolumeRange(unreadNoDate)}`);
    }
    const dateGroups = {};
    unreadWithDate.forEach(item => {
        const dateStr = new Date(item.date).toLocaleDateString('it-IT');
        if (!dateGroups[dateStr]) dateGroups[dateStr] = [];
        dateGroups[dateStr].push(item.vol);
    });
    Object.entries(dateGroups).forEach(([date, vols]) => {
        unreadParts.push(`Vol. ${getVolumeRange(vols)} (Letto il: ${date})`);
    });
    if (unreadParts.length > 0) {
        changes.push(`Segnati da leggere: ${unreadParts.join(', ')}`);
    }

    if (dateChanged.length > 0) {
        const group = {};
        dateChanged.forEach(item => {
            const o = new Date(item.oldDate).toLocaleDateString('it-IT');
            const n = new Date(item.newDate).toLocaleDateString('it-IT');
            const key = `${o} ➜ ${n}`;
            if (!group[key]) group[key] = [];
            group[key].push(item.vol);
        });

        Object.entries(group).forEach(([dates, vols]) => {
            changes.push(`Data lettura modificata per Vol. ${getVolumeRange(vols)} (${dates})`);
        });
    }

    return changes;
};

// Helper: "1, 2, 3" -> "1-3"
function getVolumeRange(volumes) {
    if (!volumes || volumes.length === 0) return '';

    const numericVols = [];
    const stringVols = [];

    volumes.forEach(v => {
        const name = v.name || v.number || '?';
        const match = String(name).match(/^(\d+(\.\d+)?)$/); // Strict number check
        if (match) {
            numericVols.push(parseFloat(match[1]));
        } else {
            stringVols.push(name);
        }
    });

    numericVols.sort((a, b) => a - b);

    // Compact numeric ranges
    const ranges = [];
    if (numericVols.length > 0) {
        let start = numericVols[0];
        let prev = numericVols[0];

        for (let i = 1; i < numericVols.length; i++) {
            // Check for integer continuity only? Or roughly sequential
            // Let's stick to integer continuity for "1-3" style
            // If they are floats (1.5), we probably shouldn't range them unless they are exactly prev + 1?
            // Safer to only range integers.
            if (Number.isInteger(numericVols[i]) && Number.isInteger(prev) && numericVols[i] === prev + 1) {
                prev = numericVols[i];
            } else {
                ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
                start = numericVols[i];
                prev = numericVols[i];
            }
        }
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    }

    const allParts = [...ranges, ...stringVols];
    return allParts.join(', ');
}

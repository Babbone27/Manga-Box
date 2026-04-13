import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { html } from 'htm/preact';
import { getHistory, clearHistory } from '../services/history.js';

export default function HistoryLog({ onBack }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getHistory();
        setLogs(data);
        setLoading(false);
    };

    const handleClear = async () => {
        if (confirm('Sei sicuro di voler cancellare tutto lo storico?')) {
            await clearHistory();
            loadHistory();
        }
    };

    const [filterDate, setFilterDate] = useState('');

    // Filter and Group logs
    const filteredLogs = filterDate
        ? logs.filter(log => new Date(log.date).toLocaleDateString('it-IT') === new Date(filterDate).toLocaleDateString('it-IT'))
        : logs;

    const groupedLogs = filteredLogs.reduce((acc, log) => {
        const date = new Date(log.date).toLocaleDateString('it-IT');
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
    }, {});

    return html`
        <div class="history-page" style="height: 100%; display: flex; flex-direction: column; background: var(--background-color);">
            
            <!-- Action Bar -->
            <div style="padding: 16px; display: flex; align-items: center; justify-content: space-between; background: var(--surface-color); border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 13px; color: var(--secondary-text-color);">Filtra data:</span>
                        <input 
                            type="date" 
                            value=${filterDate} 
                            onInput=${(e) => setFilterDate(e.target.value)}
                            style="background: var(--background-color); color: var(--text-color); border: 1px solid var(--border-color); padding: 6px 10px; border-radius: 12px; font-family: inherit; font-size: 13px;"
                        />
                        ${filterDate && html`
                            <button 
                                onClick=${() => setFilterDate('')}
                                style="background: none; border: none; color: var(--text-color); cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; transition: background 0.2s;"
                                onMouseEnter=${e => e.currentTarget.style.background = 'var(--hover-bg-color)'}
                                onMouseLeave=${e => e.currentTarget.style.background = 'transparent'}
                                title="Rimuovi filtro"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        `}
                    </div>
                </div>

                <button 
                    onClick=${handleClear}
                    style="padding: 8px 12px; font-size: 12px; background: rgba(255, 82, 82, 0.1); color: #ff5252; border: 1px solid rgba(255, 82, 82, 0.3); border-radius: 12px; cursor: pointer;"
                >
                    Pulisci Storico
                </button>
            </div>

            <!-- Content -->
            <div style="flex: 1; overflow-y: auto; padding: 16px;">
                ${loading ? html`<div style="text-align: center; padding: 20px; color: var(--secondary-text-color);">Caricamento...</div>` : ''}
                
                ${!loading && filteredLogs.length === 0 ? html`
                    <div style="text-align: center; padding: 40px; color: var(--secondary-text-color);">
                        <div style="font-size: 40px; margin-bottom: 16px;">📜</div>
                        ${filterDate ? 'Nessuna modifica in questa data.' : 'Nessuna modifica registrata.'}
                    </div>
                ` : ''}

                ${Object.entries(groupedLogs).map(([date, dayLogs]) => {
        const groups = [];
        dayLogs.forEach(log => {
            const last = groups[groups.length - 1];
            if (last && last.opera === log.opera) {
                last.entries.push(log);
            } else {
                groups.push({ opera: log.opera, entries: [log] });
            }
        });

        return html`
                        <div style="margin-bottom: 24px;">
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${groups.map(group => html`
                                    <div style="background: var(--surface-color); padding: 12px; border-radius: 12px; border-left: 4px solid var(--primary-color);">
                                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 8px;">
                                            <span style="font-weight: bold; font-size: 15px;">${group.opera}</span>
                                            <span style="font-size: 12px; font-weight: normal; color: var(--secondary-text-color);">${date}</span>
                                        </div>
                                        
                                        <div style="display: flex; flex-direction: column; gap: 8px;">
                                            ${group.entries.map(entry => html`
                                                <div style="display: flex; gap: 8px; align-items: flex-start;">
                                                    <div style="font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; margin-top: 2px; min-width: 40px;">
                                                        ${new Date(entry.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div style="font-size: 13px; color: var(--text-color);">
                                                        <ul style="margin: 0; padding-left: 16px; list-style-type: disc;">
                                                            ${entry.azione.map(action => html`
                                                                <li style="margin-bottom: 2px;">${action}</li>
                                                            `)}
                                                        </ul>
                                                    </div>
                                                </div>
                                            `)}
                                        </div>
                                    </div>
                                `)}
                            </div>
                        </div>
                    `;
    })}
            </div>
        </div>
    `;
}

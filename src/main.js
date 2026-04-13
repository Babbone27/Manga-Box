import { h, render } from 'preact';
import { html } from 'htm/preact';
import App from './components/App.js';
import { initTitleBar } from './titleBar.js';

render(html`<${App} />`, document.getElementById('app'));

// Initialize title bar (sync status and quick actions)
if (document.getElementById('title-bar')) {
    initTitleBar();
}

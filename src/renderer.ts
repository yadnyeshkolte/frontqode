// src/renderer.ts
import './index.css';
import './styles/App.css';
import './styles/AppInit.css';
import AppInit from "./components/AppInit/AppInit";
import App from "./components/App/App";

// First check if our renderer is loading at all
console.log('👋 Front Qode IDE renderer is loading');

// Get the root element
const root = document.getElementById('root');

// Show the initialization screen first
if (root) {
    root.innerHTML = `
    <div class="app-init-container">
      <div class="app-init-content">
        <h1>Front Qode</h1>
        <p>Starting up your cross-platform IDE experience</p>
        
        <div class="progress-container">
          <div class="progress-bar" style="width: 10%"></div>
        </div>
        
        <p class="status-text">Loading... 10%</p>
      </div>
    </div>
  `;

    // Simulate loading process
    let progress = 10;
    const loadingInterval = setInterval(() => {
        progress += 10;
        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        const statusText = document.querySelector('.status-text');

        if (progressBar && statusText) {
            progressBar.style.width = `${progress}%`;
            statusText.textContent = `Loading... ${progress}%`;
        }

        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => showMainApp(), 500);
        }
    }, 300);
}

// Function to show the main app
function showMainApp() {
    if (root) {
        root.innerHTML = `
      <div class="app-container">
        <div class="app-header">
          <h1>Front Qode IDE</h1>
        </div>
        <div class="app-content">
          <div class="sidebar">
            <div class="sidebar-header">Explorer</div>
            <div class="sidebar-content">
              <ul class="file-tree">
                <li>src/</li>
                <li>&nbsp;&nbsp;- index.ts</li>
                <li>&nbsp;&nbsp;- components/</li>
              </ul>
            </div>
          </div>
          <div class="editor">
            <div class="editor-tabs">
              <div class="tab active">index.ts</div>
            </div>
            <div class="editor-content">
              <pre>// Welcome to Front Qode IDE Yadnyesh
// Start coding here...</pre>
            </div>
          </div>
        </div>
        <div class="status-bar">
          <div>Ready</div>
          <div>UTF-8</div>
          <div>TypeScript</div>
        </div>
      </div>
    `;
    }
}
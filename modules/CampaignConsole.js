// modules/CampaignConsole.js - A dynamically loaded module for campaign management.

/**
 * Module entry point. Creates the UI and attaches event listeners.
 */
export function init() {
    const container = document.getElementById('module-container');
    if (!container) {
        console.error("Module container not found in DOM.");
        return;
    }

    // Create the module's UI
    const consoleHtml = `
        <div id="campaign-console" style="color: #fff; padding: 10px;">
            <h4>Campaign Console</h4>
            <textarea 
                id="adventure-json" 
                placeholder='Paste Adventure JSON here...' 
                style="width: 95%; height: 100px; background-color: #333; color: #eee; border: 1px solid #555;"></textarea>
            <button id="load-adventure" style="margin-top: 5px;">Load Adventure</button>
            <div id="adventure-tree" style="margin-top: 10px; max-height: 40vh; overflow-y: auto;"></div>
        </div>
    `;
    container.innerHTML = consoleHtml;

    // Attach event listeners
    document.getElementById('load-adventure').addEventListener('click', buildTree);
}

/**
 * Parses the JSON from the textarea and renders it as an interactive HTML tree.
 */
function buildTree() {
    const jsonText = document.getElementById('adventure-json').value;
    const treeContainer = document.getElementById('adventure-tree');
    
    if (!jsonText) {
        treeContainer.innerHTML = '<p style="color: #f00;">Textarea is empty.</p>';
        return;
    }

    try {
        const data = JSON.parse(jsonText);
        if (data.campaign) {
            treeContainer.innerHTML = renderCampaign(data.campaign);
            attachTreeEventListeners();
        } else {
             treeContainer.innerHTML = '<p style="color: #f00;">Invalid JSON structure: "campaign" key missing.</p>';
        }
    } catch (error) {
        treeContainer.innerHTML = `<p style="color: #f00;">Error parsing JSON: ${error.message}</p>`;
    }
}

/**
 * Recursively renders the campaign structure into an HTML string.
 * @param {object} campaign The campaign object from the parsed JSON.
 * @returns {string} The HTML string representing the campaign tree.
 */
function renderCampaign(campaign) {
    let html = `<ul>`;
    html += `<li><strong>${campaign.name}</strong>`;
    if (campaign.worldMap) {
        html += ` <button class="set-map-btn" data-url="${campaign.worldMap}">Show World Map</button>`;
    }
    
    if (campaign.areas && campaign.areas.length > 0) {
        html += `<ul>`;
        campaign.areas.forEach(area => {
            html += `<li>${area.name}`;
            if (area.areaMap) {
                html += ` <button class="set-map-btn" data-url="${area.areaMap}">Show Area Map</button>`;
            }
            if (area.scenes && area.scenes.length > 0) {
                html += `<ul>`;
                area.scenes.forEach(scene => {
                    html += `<li>${scene.name} <button class="set-map-btn" data-url="${scene.sceneMap}">Show Scene Map</button></li>`;
                });
                html += `</ul>`;
            }
            html += `</li>`;
        });
        html += `</ul>`;
    }
    
    html += `</li></ul>`;
    return html;
}

/**
 * Attaches click listeners to all "set map" buttons in the tree.
 */
function attachTreeEventListeners() {
    const buttons = document.querySelectorAll('#adventure-tree .set-map-btn');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            const url = e.target.dataset.url;
            if (url) {
                const event = new CustomEvent('vttSetMap', { 
                    detail: { url },
                    bubbles: true // Ensure the event bubbles up to the window
                });
                window.dispatchEvent(event);
            }
        });
    });
}

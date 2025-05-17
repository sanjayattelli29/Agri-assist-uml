// Table Connections Management System
// This script handles the creation, display, saving, and loading of connections between tables

// Connection state variables
let connectionMode = false;
let activeConnectionSource = null;
let connections = [];
const connectionColors = {
    'data-sources': '#4CAF50',      // Green
    'data-processing': '#2196F3',   // Blue
    'ai-models': '#9C27B0',         // Purple
    'analytics-layer': '#FF9800',   // Orange
    'integration-layer': '#E91E63', // Pink
    'frontend-layer': '#00BCD4',    // Cyan
    'cloud-infrastructure': '#FF5722', // Deep Orange
    'core-features': '#FFEB3B',      // Yellow
    'web-interface': '#2E7D32',      // Dark Green
    'flask-backend': '#1976D2',      // Dark Blue
    'supabase': '#F57C00',           // Dark Orange
    'render-hosting': '#7B1FA2',     // Dark Purple
    'ai-supabase': '#FBC02D',        // Dark Yellow
    'frontend-layer': '#C62828',     // Dark Red
    'cloud-infrastructure': '#00BCD4', // Cyan
    'core-features': '#9C27B0'       // Purple
};

// Function to get element position relative to the document
function getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
    };
}

// Function to create a connection between two components
function createConnection(fromComponent, toComponent) {
    // Get the source and target elements
    const fromElement = document.querySelector(`[data-component="${fromComponent}"].connection-point.plus`);
    const toElement = document.querySelector(`[data-component="${toComponent}"].connection-point.minus`);
    
    if (!fromElement || !toElement) return null;
    
    // Get positions
    const fromPos = getElementPosition(fromElement);
    const toPos = getElementPosition(toElement);
    
    // Create a unique ID for this connection
    const connectionId = `connection-${fromComponent}-to-${toComponent}`;
    
    // Check if this connection already exists
    if (connections.some(conn => conn.id === connectionId)) {
        return null;
    }
    
    // Get the parent table for color
    const fromTable = fromElement.closest('.feature-table').id;
    
    // Create connection object
    const connection = {
        id: connectionId,
        from: fromComponent,
        to: toComponent,
        fromX: fromPos.x + fromPos.width / 2,
        fromY: fromPos.y + fromPos.height / 2,
        toX: toPos.x + toPos.width / 2,
        toY: toPos.y + toPos.height / 2,
        color: connectionColors[fromTable] || '#81D4FA'
    };
    
    // Add to connections array
    connections.push(connection);
    
    // Draw the connection
    drawConnection(connection);
    
    return connection;
}

// Function to draw a connection between two points
function drawConnection(connection) {
    const svg = document.getElementById('connections-container');
    if (!svg) return;
    
    // Create and add arrowhead marker if it doesn't exist
    if (!document.getElementById('arrowhead')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', '#81D4FA');
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);
    }
    
    // Calculate control points for a curved path
    const dx = connection.toX - connection.fromX;
    const dy = connection.toY - connection.fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Adjust control points based on relative positions
    let controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y;
    
    // If the components are more horizontal than vertical
    if (Math.abs(dx) > Math.abs(dy)) {
        controlPoint1X = connection.fromX + distance/3;
        controlPoint1Y = connection.fromY;
        controlPoint2X = connection.toX - distance/3;
        controlPoint2Y = connection.toY;
    } else {
        // If the components are more vertical than horizontal
        controlPoint1X = connection.fromX;
        controlPoint1Y = connection.fromY + distance/3;
        controlPoint2X = connection.toX;
        controlPoint2Y = connection.toY - distance/3;
    }
    
    // Add some curvature variation based on the connection ID to avoid overlaps
    const idHash = connection.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    
    const curvatureVariation = (idHash % 50) - 25; // Range from -25 to 25
    
    // Create a path element
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Set path attributes with adjusted control points
    path.setAttribute('id', connection.id);
    path.setAttribute('d', `M ${connection.fromX} ${connection.fromY} 
                           C ${controlPoint1X + curvatureVariation} ${controlPoint1Y + curvatureVariation}, 
                             ${controlPoint2X - curvatureVariation} ${controlPoint2Y - curvatureVariation}, 
                             ${connection.toX} ${connection.toY}`);
    path.setAttribute('stroke', connection.color || '#81D4FA');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    
    // Add animation
    path.innerHTML = `
        <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.5s" />
    `;
    
    // Set stroke-dasharray for animation
    path.setAttribute('stroke-dasharray', '4');
    
    // Add path to SVG
    svg.appendChild(path);
}

// Function to redraw all connections (useful when resizing or moving elements)
function redrawConnections() {
    const svg = document.getElementById('connections-container');
    if (!svg) return;
    
    // Clear existing connections
    svg.innerHTML = '';
    
    // Redraw each connection
    connections.forEach(connection => {
        // Update positions based on current element positions
        const fromElement = document.querySelector(`[data-component="${connection.from}"].connection-point.plus`);
        const toElement = document.querySelector(`[data-component="${connection.to}"].connection-point.minus`);
        
        if (fromElement && toElement) {
            const fromPos = getElementPosition(fromElement);
            const toPos = getElementPosition(toElement);
            
            connection.fromX = fromPos.x + fromPos.width / 2;
            connection.fromY = fromPos.y + fromPos.height / 2;
            connection.toX = toPos.x + toPos.width / 2;
            connection.toY = toPos.y + toPos.height / 2;
            
            drawConnection(connection);
        }
    });
}

// Function to save connections to localStorage
function saveConnections() {
    if (connections.length > 0) {
        localStorage.setItem('umlComponentConnections', JSON.stringify(connections));
        showStatus(`${connections.length} connections saved`);
    } else {
        showStatus('No connections to save');
    }
}

// Function to load connections from localStorage
function loadConnections() {
    const savedConnections = localStorage.getItem('umlComponentConnections');
    if (savedConnections) {
        try {
            const loadedConnections = JSON.parse(savedConnections);
            
            // Validate connections before loading
            const validConnections = loadedConnections.filter(conn => {
                const fromElement = document.querySelector(`[data-component="${conn.from}"].connection-point.plus`);
                const toElement = document.querySelector(`[data-component="${conn.to}"].connection-point.minus`);
                return fromElement && toElement;
            });
            
            connections = validConnections;
            redrawConnections();
            showStatus(`${connections.length} connections loaded`);
        } catch (e) {
            console.error('Error loading connections:', e);
            showStatus('Error loading connections');
        }
    }
}

// Function to clear all connections
function clearConnections() {
    connections = [];
    const svg = document.getElementById('connections-container');
    if (svg) {
        svg.innerHTML = '';
    }
    // Clear from localStorage as well
    localStorage.removeItem('umlComponentConnections');
    showStatus('All connections cleared');
}

// Function to show status message
function showStatus(message) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }
}

// Function to initialize connection functionality
function initializeConnections() {
    // Get all connection points
    const plusPoints = document.querySelectorAll('.connection-point.plus');
    const minusPoints = document.querySelectorAll('.connection-point.minus');
    
    // Add click event listeners to plus points (connection sources)
    plusPoints.forEach(point => {
        point.addEventListener('click', () => {
            // If we're already in connection mode, cancel it
            if (connectionMode && activeConnectionSource === point) {
                connectionMode = false;
                activeConnectionSource = null;
                point.classList.remove('active');
                showStatus('Connection canceled');
                return;
            }
            
            // Start connection mode
            connectionMode = true;
            
            // Remove active class from any previously active source
            if (activeConnectionSource) {
                activeConnectionSource.classList.remove('active');
            }
            
            // Set this point as the active source
            activeConnectionSource = point;
            point.classList.add('active');
            
            const componentId = point.getAttribute('data-component');
            showStatus(`Select a destination for connection from ${componentId}`);
        });
    });
    
    // Add click event listeners to minus points (connection targets)
    minusPoints.forEach(point => {
        point.addEventListener('click', () => {
            // Only proceed if we're in connection mode
            if (!connectionMode || !activeConnectionSource) return;
            
            // Get source and target component IDs
            const sourceComponentId = activeConnectionSource.getAttribute('data-component');
            const targetComponentId = point.getAttribute('data-component');
            
            // Don't allow connections to self
            if (sourceComponentId === targetComponentId) {
                showStatus('Cannot connect a component to itself');
                return;
            }
            
            // Create the connection
            const connection = createConnection(sourceComponentId, targetComponentId);
            
            if (connection) {
                showStatus(`Connected ${sourceComponentId} to ${targetComponentId}`);
            } else {
                showStatus('Connection already exists or is invalid');
            }
            
            // Reset connection mode
            connectionMode = false;
            activeConnectionSource.classList.remove('active');
            activeConnectionSource = null;
        });
    });
    
    // Add event listeners to save and clear buttons
    const saveButton = document.getElementById('save-connections');
    const clearButton = document.getElementById('clear-connections');
    
    if (saveButton) {
        saveButton.addEventListener('click', saveConnections);
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', clearConnections);
    }
    
    // Handle window resize to redraw connections
    window.addEventListener('resize', redrawConnections);
    
    // Load any saved connections
    loadConnections();
}

// Load particles.js library dynamically
function loadParticlesJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
        script.onload = () => {
            // Initialize particles with minimal settings for better performance
            particlesJS('particles-js', {
                particles: {
                    number: { value: 40, density: { enable: true, value_area: 1000 } },
                    color: { value: '#81D4FA' },
                    shape: { type: 'circle' },
                    opacity: { value: 0.1, random: true },
                    size: { value: 2, random: true },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: '#81D4FA',
                        opacity: 0.1,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 0.5,
                        direction: 'none',
                        random: true,
                        straight: false,
                        out_mode: 'out',
                        bounce: false
                    }
                },
                interactivity: {
                    detect_on: 'canvas',
                    events: {
                        onhover: { enable: false },
                        onclick: { enable: false },
                        resize: true
                    }
                },
                retina_detect: false
            });
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Load particles.js
    loadParticlesJS().catch(err => console.warn('Particles.js could not be loaded:', err));
    
    // Initialize connections functionality
    initializeConnections();
});

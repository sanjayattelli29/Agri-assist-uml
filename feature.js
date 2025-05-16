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

// Helper function to get the color for a package type
function getPackageColor(packageType) {
    const colorMap = {
        'data-sources': '#4CAF50',
        'data-processing': '#2196F3',
        'ml-development': '#FF9800',
        'model-storage': '#9C27B0',
        'frontend': '#F44336',
        'cloud-infra': '#FFC107',
        'core-features': '#00BCD4',
        'external-integrations': '#607D8B'
    };
    
    return colorMap[packageType] || '#81D4FA'; // Default color if not found
}

// Helper function to get element center
function getElementCenter(element) {
    if (!element) return { x: 0, y: 0 };
    
    const rect = element.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    return {
        x: rect.left + scrollLeft + rect.width / 2,
        y: rect.top + scrollTop + rect.height / 2
    };
}

// Draw a connection between two elements with arrow marks
function drawConnection(fromId, toId, color, svg) {
    // Get elements
    const fromElement = document.getElementById(fromId);
    const toElement = document.getElementById(toId);
    
    // Skip if either element doesn't exist
    if (!fromElement || !toElement) return;
    
    // Get element positions
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();
    
    // Get diagram container position
    const diagram = document.getElementById('diagram');
    const diagramRect = diagram.getBoundingClientRect();
    
    // Find the parent package of each element
    const fromPackage = fromElement.closest('.package');
    const toPackage = toElement.closest('.package');
    
    // Get package positions
    const fromPackageRect = fromPackage ? fromPackage.getBoundingClientRect() : fromRect;
    const toPackageRect = toPackage ? toPackage.getBoundingClientRect() : toRect;
    
    // Calculate positions relative to the diagram
    const fromCenterX = fromRect.left - diagramRect.left + fromRect.width / 2;
    const fromCenterY = fromRect.top - diagramRect.top + fromRect.height / 2;
    const toCenterX = toRect.left - diagramRect.left + toRect.width / 2;
    const toCenterY = toRect.top - diagramRect.top + toRect.height / 2;
    
    // Calculate the direction vector between centers
    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const unitDx = dx / distance;
    const unitDy = dy / distance;
    
    // Calculate intersection points with the package borders
    // Start from the component and go towards the edge of its package
    let fromX, fromY, toX, toY;
    
    // For the starting point (from)
    if (fromPackage) {
        // Check if horizontal or vertical connection is shorter
        if (Math.abs(unitDx) > Math.abs(unitDy)) {
            // Horizontal connection is dominant
            fromX = unitDx > 0 ? 
                fromPackageRect.right - diagramRect.left : 
                fromPackageRect.left - diagramRect.left;
            fromY = fromCenterY;
        } else {
            // Vertical connection is dominant
            fromX = fromCenterX;
            fromY = unitDy > 0 ? 
                fromPackageRect.bottom - diagramRect.top : 
                fromPackageRect.top - diagramRect.top;
        }
    } else {
        fromX = fromCenterX;
        fromY = fromCenterY;
    }
    
    // For the ending point (to)
    if (toPackage) {
        // Check if horizontal or vertical connection is shorter
        if (Math.abs(unitDx) > Math.abs(unitDy)) {
            // Horizontal connection is dominant
            toX = unitDx > 0 ? 
                toPackageRect.left - diagramRect.left : 
                toPackageRect.right - diagramRect.left;
            toY = toCenterY;
        } else {
            // Vertical connection is dominant
            toX = toCenterX;
            toY = unitDy > 0 ? 
                toPackageRect.top - diagramRect.top : 
                toPackageRect.bottom - diagramRect.top;
        }
    } else {
        toX = toCenterX;
        toY = toCenterY;
    }
    
    // Create path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Adjust the curve based on distance
    const curveOffset = Math.min(distance * 0.3, 100);
    
    // Create a curved path with better control points
    let pathData;
    
    // Determine if we should use a straight or curved line based on distance
    if (distance < 100) {
        // For short distances, use a straight line
        pathData = `M ${fromX},${fromY} L ${toX},${toY}`;
    } else {
        // For longer distances, use a curved path
        // Calculate control points based on the direction
        const cp1x = fromX + unitDx * curveOffset;
        const cp1y = fromY + unitDy * curveOffset;
        const cp2x = toX - unitDx * curveOffset;
        const cp2y = toY - unitDy * curveOffset;
        
        pathData = `M ${fromX},${fromY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${toX},${toY}`;
    }
    
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '1.5'); // Reduced from 2.5 to 1.5
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.8'); // Added slight transparency
    
    // Get the package type for the arrowhead
    const fromPackageType = fromPackage ? fromPackage.id : 'default';
    path.setAttribute('marker-end', `url(#arrowhead-${fromPackageType})`);
    
    // Add subtle glow effect
    path.setAttribute('filter', 'url(#glow)');
    
    // Add animation
    path.setAttribute('stroke-dasharray', '4,3'); // Reduced dash size
    path.setAttribute('class', 'animated-path');
    
    // Add path to SVG
    svg.appendChild(path);
}

// Function to draw connections between components in the workflow view
function drawConnections() {
    // Clear existing connections
    const existingSvg = document.getElementById('connections-svg');
    if (existingSvg) {
        existingSvg.remove();
    }
    
    // Create SVG for connections
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'connections-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('class', 'connections-layer');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '10'; // Increased z-index to make arrows appear above components
    
    // Add defs for markers
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
    
    // Add glow filter for arrows
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'glow');
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');
    defs.appendChild(filter);
    
    // Create blur effect - more subtle
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '1'); // Reduced from 2 to 1
    feGaussianBlur.setAttribute('result', 'blur');
    filter.appendChild(feGaussianBlur);
    
    // Create glow effect
    const feComposite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    feComposite.setAttribute('in', 'SourceGraphic');
    feComposite.setAttribute('in2', 'blur');
    feComposite.setAttribute('operator', 'over');
    filter.appendChild(feComposite);
    
    // Define colors for different package types
    const colors = [
        { id: 'arrowhead-data-sources', color: '#4CAF50' },
        { id: 'arrowhead-data-processing', color: '#2196F3' },
        { id: 'arrowhead-ml-development', color: '#FF9800' },
        { id: 'arrowhead-model-storage', color: '#9C27B0' },
        { id: 'arrowhead-frontend', color: '#F44336' },
        { id: 'arrowhead-cloud-infra', color: '#FFC107' },
        { id: 'arrowhead-core-features', color: '#00BCD4' },
        { id: 'arrowhead-external-integrations', color: '#607D8B' }
    ];
    
    // Create marker for each color - reduced size by 50%
    colors.forEach(colorObj => {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', colorObj.id);
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '8');
        marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '4'); // Reduced from 8 to 4
        marker.setAttribute('markerHeight', '4'); // Reduced from 8 to 4
        marker.setAttribute('orient', 'auto');
        defs.appendChild(marker);
        
        const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        arrowPath.setAttribute('fill', colorObj.color);
        marker.appendChild(arrowPath);
    });
    
    // Also create a default arrowhead - reduced size by 50%
    const defaultMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    defaultMarker.setAttribute('id', 'arrowhead');
    defaultMarker.setAttribute('viewBox', '0 0 10 10');
    defaultMarker.setAttribute('refX', '8');
    defaultMarker.setAttribute('refY', '5');
    defaultMarker.setAttribute('markerWidth', '4'); // Reduced from 8 to 4
    defaultMarker.setAttribute('markerHeight', '4'); // Reduced from 8 to 4
    defaultMarker.setAttribute('orient', 'auto');
    defs.appendChild(defaultMarker);
    
    const defaultArrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    defaultArrowPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    defaultArrowPath.setAttribute('fill', '#81D4FA');
    defaultMarker.appendChild(defaultArrowPath);
    
    // Add SVG to diagram container
    const diagramContainer = document.getElementById('diagram');
    if (!diagramContainer) return;
    diagramContainer.appendChild(svg);
    
    // Define connections
    const connections = [
        // Web UI to Backend
        { from: 'crop-prediction', to: 'flask-api', color: getPackageColor('core-features') },
        { from: 'ai-chatbot', to: 'flask-api', color: getPackageColor('core-features') },
        { from: 'pesticide-guide', to: 'flask-api', color: getPackageColor('core-features') },
        { from: 'soil-requirements', to: 'flask-api', color: getPackageColor('core-features') },
        { from: 'crop-rotation', to: 'flask-api', color: getPackageColor('core-features') },
      
        // Backend to Supabase
        { from: 'flask-api', to: 'model-repository', color: getPackageColor('cloud-infra') },
        { from: 'flask-api', to: 'metrics-database', color: getPackageColor('cloud-infra') },
      
        // Chatbot to Gemini API (abstracted as external integration)
        { from: 'ai-chatbot', to: 'research-institutions', color: getPackageColor('core-features') },
      
        // Prediction Engine Flow
        { from: 'crop-prediction', to: 'model-serving', color: getPackageColor('core-features') },
        { from: 'model-serving', to: 'visualization-engine', color: getPackageColor('cloud-infra') },
      
        // Store UI to Supabase Buckets
        { from: 'pesticide-guide', to: 'model-versioning', color: getPackageColor('core-features') },
        { from: 'soil-requirements', to: 'metrics-database', color: getPackageColor('core-features') },
      
        // Admin to Metrics
        { from: 'performance-dashboard', to: 'metrics-database', color: getPackageColor('admin-panel') },
      ];
      
    
    // Draw each connection
    connections.forEach(conn => {
        drawConnection(conn.from, conn.to, conn.color, svg);
    });
}

// Initialize draggable components
function initializeDraggableComponents() {
    const packages = document.querySelectorAll('.package');
    packages.forEach(pkg => {
        makeDraggable(pkg);
        
        // Add drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        pkg.appendChild(dragHandle);
        
        // Ensure package is above SVG layer when dragging
        pkg.addEventListener('mousedown', () => {
            // Bring to front when dragging
            pkg.style.zIndex = '20';
        });
        
        pkg.addEventListener('mouseup', () => {
            // Reset z-index after a short delay to allow for click events
            setTimeout(() => {
                pkg.style.zIndex = '5';
            }, 100);
        });
    });
}

// Make an element draggable
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    
    // Get the drag handle or use the element itself
    const dragHandle = element.querySelector('.drag-handle') || element;
    
    dragHandle.addEventListener('mousedown', dragMouseDown);
    
    function dragMouseDown(e) {
        e.preventDefault();
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Add active dragging class
        element.classList.add('dragging');
        
        // Set dragging state
        isDragging = true;
        
        // Add event listeners for drag and end
        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('mouseup', closeDragElement);
    }
    
    function elementDrag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // Get current position from style
        const currentTop = parseInt(element.style.top) || 0;
        const currentLeft = parseInt(element.style.left) || 0;
        
        // Set the element's new position
        element.style.top = (currentTop - pos2) + 'px';
        element.style.left = (currentLeft - pos1) + 'px';
        
        // Redraw connections when dragging
        if (isDragging) {
            drawConnections();
        }
    }
    
    function closeDragElement() {
        // Remove the dragging class
        element.classList.remove('dragging');
        
        // Reset dragging state
        isDragging = false;
        
        // Remove event listeners
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('mouseup', closeDragElement);
        
        // Final redraw of connections
        drawConnections();
    }
}

// Initialize zoom and pan functionality for the workflow diagram
function initializeZoomPan() {
    const diagram = document.getElementById('diagram');
    if (!diagram) return;
    
    // Initialize variables
    let scale = 1;
    let panning = false;
    let startPoint = { x: 0, y: 0 };
    let currentTranslate = { x: 0, y: 0 };
    
    // Store initial scale and translate values
    diagram.dataset.scale = scale;
    diagram.dataset.translateX = currentTranslate.x;
    diagram.dataset.translateY = currentTranslate.y;
    
    // Mouse wheel for zooming
    diagram.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        // Determine zoom direction
        const delta = e.deltaY < 0 ? 1.1 : 0.9;
        
        // Update scale with limits
        scale *= delta;
        scale = Math.min(Math.max(0.5, scale), 2); // Limit scale between 0.5 and 2
        
        // Update stored values
        diagram.dataset.scale = scale;
        
        // Apply transform
        updateTransform();
    });
    
    // Mouse down to start panning
    diagram.addEventListener('mousedown', function(e) {
        // Only middle mouse button or when holding space
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            e.preventDefault();
            panning = true;
            startPoint = { x: e.clientX, y: e.clientY };
            diagram.style.cursor = 'grabbing';
        }
    });
    
    // Mouse move for panning
    document.addEventListener('mousemove', function(e) {
        if (!panning) return;
        
        const dx = e.clientX - startPoint.x;
        const dy = e.clientY - startPoint.y;
        
        currentTranslate.x += dx;
        currentTranslate.y += dy;
        
        // Update stored values
        diagram.dataset.translateX = currentTranslate.x;
        diagram.dataset.translateY = currentTranslate.y;
        
        // Update start point
        startPoint = { x: e.clientX, y: e.clientY };
        
        // Apply transform
        updateTransform();
    });
    
    // Mouse up to end panning
    document.addEventListener('mouseup', function() {
        panning = false;
        diagram.style.cursor = 'grab';
    });
    
    // Mouse leave to end panning
    diagram.addEventListener('mouseleave', function() {
        panning = false;
        diagram.style.cursor = 'grab';
    });
    
    // Set initial cursor
    diagram.style.cursor = 'grab';
    
    // Function to update the transform
    function updateTransform() {
        diagram.style.transform = `translate(${currentTranslate.x}px, ${currentTranslate.y}px) scale(${scale})`;
    }
}

// Zoom the diagram by a factor
function zoomDiagram(factor) {
    const diagram = document.getElementById('diagram');
    if (!diagram) return;
    
    // Get current scale and translate values
    let scale = parseFloat(diagram.dataset.scale || 1);
    let translateX = parseFloat(diagram.dataset.translateX || 0);
    let translateY = parseFloat(diagram.dataset.translateY || 0);
    
    // Update scale with limits
    scale *= factor;
    scale = Math.min(Math.max(0.5, scale), 2); // Limit scale between 0.5 and 2
    
    // Update stored values
    diagram.dataset.scale = scale;
    
    // Apply transform
    diagram.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// Reset diagram zoom and position
function resetDiagramZoom() {
    const diagram = document.getElementById('diagram');
    if (!diagram) return;
    
    // Reset values
    diagram.dataset.scale = 1;
    diagram.dataset.translateX = 0;
    diagram.dataset.translateY = 0;
    
    // Apply transform
    diagram.style.transform = 'translate(0px, 0px) scale(1)';
}

// Create tooltip element if it doesn't exist
function createTooltip() {
    let tooltip = document.getElementById('component-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'component-tooltip';
        tooltip.className = 'component-tooltip';
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

// Show tooltip with component information
function showComponentTooltip(component) {
    const tooltip = createTooltip();
    const componentId = component.id;
    const componentName = component.textContent;
    
    tooltip.innerHTML = `<strong>${componentName}</strong><br>ID: ${componentId}`;
    
    // Position tooltip near the component
    const rect = component.getBoundingClientRect();
    tooltip.style.left = rect.right + 10 + 'px';
    tooltip.style.top = rect.top + 'px';
    tooltip.style.display = 'block';
}

// Hide component tooltip
function hideComponentTooltip() {
    const tooltip = document.getElementById('component-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Load particles.js
    loadParticlesJS().catch(err => console.warn('Particles.js could not be loaded:', err));
    
    // Navigation functionality
    const navLinks = document.querySelectorAll('.nav-link');
    const pageViews = document.querySelectorAll('.page-view');
    
    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target page
            const targetPage = this.getAttribute('data-page');
            
            // Update active nav link
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            
            // Show the target page view
            pageViews.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetPage + '-view') {
                    view.classList.add('active');
                }
            });
        });
    });
    
    // Initialize draggable components
    initializeDraggableComponents();
    
    // Draw connections immediately
    setTimeout(() => {
        drawConnections();
        initializeZoomPan();
    }, 100);
    
    // Initialize zoom controls
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomResetBtn = document.getElementById('zoom-reset');
    
    if (zoomInBtn && zoomOutBtn && zoomResetBtn) {
        zoomInBtn.addEventListener('click', () => zoomDiagram(1.2));
        zoomOutBtn.addEventListener('click', () => zoomDiagram(0.8));
        zoomResetBtn.addEventListener('click', resetDiagramZoom);
    }
    
    // Add hover effects to components
    const components = document.querySelectorAll('.component');
    components.forEach(component => {
        component.addEventListener('mouseenter', () => showComponentTooltip(component));
        component.addEventListener('mouseleave', hideComponentTooltip);
    });
});

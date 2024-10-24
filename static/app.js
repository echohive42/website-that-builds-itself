let draggedElement = null;
let resizedElement = null;
let resizeHandle = null;
let offset = { x: 0, y: 0 };
let originalSize = { width: 0, height: 0 };
let originalPosition = { x: 0, y: 0 };
let selectedElement = null;

// Add at the top of the file
let pendingRequests = new Map();

// Add request queue management
let requestQueue = new Map();
let processingRequest = false;

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const inputModal = document.getElementById('inputModal');
    const textarea = document.getElementById('componentPrompt');
    const clearButton = document.getElementById('clearButton');

    // Improved drag, resize, and selection functionality
    canvas.addEventListener('mousedown', function(e) {
        const wrapper = e.target.closest('.component-wrapper');
        if (wrapper) {
            if (e.target.classList.contains('resize-handle')) {
                startResize(e, wrapper);
            } else {
                startDrag(e, wrapper);
            }
            selectComponent(wrapper);
        } else {
            deselectComponent();
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (draggedElement) {
            drag(e);
        } else if (resizedElement) {
            resize(e);
        }
    });

    document.addEventListener('mouseup', function() {
        stopDragOrResize();
    });

    // Existing click handler for canvas
    canvas.addEventListener('click', function(e) {
        if (e.target === this) {
            deselectComponent();
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Clear the input and reset its height
            const textarea = document.getElementById('componentPrompt');
            textarea.value = '';
            autoResizeTextarea(textarea);
            
            // Hide the clear button
            clearButton.style.display = 'none';
            clearButton.style.opacity = '0';
            
            // Position and show the input modal
            inputModal.style.left = `${x}px`;
            inputModal.style.top = `${y}px`;
            inputModal.classList.remove('hidden');
            textarea.focus();
        }
    });

    // Existing textarea input handler
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim()) {
                generateComponent(this.value.trim(), inputModal.style.left, inputModal.style.top);
            }
        }
        
        // Auto-resize textarea
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    // Close input when clicking outside
    document.addEventListener('click', function(e) {
        if (!inputModal.contains(e.target) && e.target !== canvas) {
            inputModal.classList.add('hidden');
            textarea.value = '';
            textarea.style.height = 'auto';
        }
    });

    // Add download button event listener
    document.getElementById('downloadButton').addEventListener('click', downloadHTML);

    // Show/hide clear button based on textarea content
    textarea.addEventListener('input', function() {
        clearButton.style.display = this.value.trim() ? 'block' : 'none';
        clearButton.style.opacity = this.value.trim() ? '1' : '0';
    });

    // Clear button functionality
    clearButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        textarea.value = '';
        this.style.display = 'none';
        this.style.opacity = '0';
        autoResizeTextarea(textarea);
    });

    // Auto-resize textarea
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(200, textarea.scrollHeight);
        textarea.style.height = newHeight + 'px';
    }

    // Add input event listener for auto-resize
    textarea.addEventListener('input', function() {
        autoResizeTextarea(this);
    });

    // Initialize height
    autoResizeTextarea(textarea);

    // Add send button functionality
    document.getElementById('sendButton').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const textarea = document.getElementById('componentPrompt');
        if (textarea.value.trim()) {
            generateComponent(textarea.value.trim(), inputModal.style.left, inputModal.style.top);
        }
    });
});

function selectComponent(wrapper) {
    if (selectedElement !== wrapper) {
        deselectComponent();
        selectedElement = wrapper;
        // Only show resize handles, remove the blue outline
        wrapper.querySelectorAll('.resize-handle').forEach(handle => {
            handle.style.display = 'block';
        });
    }
}

function deselectComponent() {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        selectedElement.querySelectorAll('.resize-handle').forEach(handle => {
            handle.style.display = 'none';
        });
        selectedElement = null;
    }
}

function startDrag(e, wrapper) {
    draggedElement = wrapper;
    offset.x = e.clientX - wrapper.offsetLeft;
    offset.y = e.clientY - wrapper.offsetTop;
    wrapper.classList.add('dragging');
    e.preventDefault();
    selectComponent(wrapper);
}

function startResize(e, wrapper) {
    resizedElement = wrapper;
    resizeHandle = e.target;
    originalSize.width = wrapper.offsetWidth;
    originalSize.height = wrapper.offsetHeight;
    originalPosition.x = wrapper.offsetLeft;
    originalPosition.y = wrapper.offsetTop;
    
    // Store initial dimensions if not already stored
    if (!wrapper.dataset.initialWidth) {
        wrapper.dataset.initialWidth = wrapper.offsetWidth;
        wrapper.dataset.initialHeight = wrapper.offsetHeight;
    }
    
    e.preventDefault();
    selectComponent(wrapper);
}

function drag(e) {
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    let newX = e.clientX - offset.x;
    let newY = e.clientY - offset.y;
    
    newX = Math.max(0, Math.min(newX, canvasRect.width - draggedElement.offsetWidth));
    newY = Math.max(0, Math.min(newY, canvasRect.height - draggedElement.offsetHeight));
    
    draggedElement.style.left = `${newX}px`;
    draggedElement.style.top = `${newY}px`;
}

function resize(e) {
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    // Store initial dimensions when starting resize if not already stored
    if (!resizedElement.dataset.initialWidth) {
        resizedElement.dataset.initialWidth = resizedElement.offsetWidth;
        resizedElement.dataset.initialHeight = resizedElement.offsetHeight;
    }
    
    let newWidth, newHeight, newX, newY;
    const minWidth = 50;  // Minimum width
    const minHeight = 50; // Minimum height
    const aspectRatio = resizedElement.dataset.initialWidth / resizedElement.dataset.initialHeight;
    
    // Calculate new dimensions based on resize handle being used
    if (resizeHandle.classList.contains('e') || resizeHandle.classList.contains('se') || resizeHandle.classList.contains('ne')) {
        newWidth = Math.max(minWidth, e.clientX - resizedElement.offsetLeft);
        if (resizeHandle.classList.contains('se') || resizeHandle.classList.contains('ne')) {
            // Maintain aspect ratio when using corner handles
            newHeight = newWidth / aspectRatio;
        }
    }
    
    if (resizeHandle.classList.contains('s') || resizeHandle.classList.contains('se') || resizeHandle.classList.contains('sw')) {
        newHeight = Math.max(minHeight, e.clientY - resizedElement.offsetTop);
        if (!newWidth && (resizeHandle.classList.contains('se') || resizeHandle.classList.contains('sw'))) {
            // Maintain aspect ratio when using corner handles
            newWidth = newHeight * aspectRatio;
        }
    }
    
    if (resizeHandle.classList.contains('w') || resizeHandle.classList.contains('nw') || resizeHandle.classList.contains('sw')) {
        const proposedWidth = Math.max(minWidth, originalSize.width + (originalPosition.x - e.clientX));
        if (proposedWidth !== minWidth) {
            newWidth = proposedWidth;
            newX = e.clientX;
            if (resizeHandle.classList.contains('nw') || resizeHandle.classList.contains('sw')) {
                // Maintain aspect ratio when using corner handles
                newHeight = newWidth / aspectRatio;
            }
        }
    }
    
    if (resizeHandle.classList.contains('n') || resizeHandle.classList.contains('nw') || resizeHandle.classList.contains('ne')) {
        const proposedHeight = Math.max(minHeight, originalSize.height + (originalPosition.y - e.clientY));
        if (proposedHeight !== minHeight) {
            newHeight = proposedHeight;
            newY = e.clientY;
            if (!newWidth && (resizeHandle.classList.contains('nw') || resizeHandle.classList.contains('ne'))) {
                // Maintain aspect ratio when using corner handles
                newWidth = newHeight * aspectRatio;
            }
        }
    }
    
    // Apply scale transform instead of directly setting width/height
    if (newWidth !== undefined || newHeight !== undefined) {
        const scaleX = newWidth / resizedElement.dataset.initialWidth;
        const scaleY = newHeight / resizedElement.dataset.initialHeight;
        
        // Apply transforms
        resizedElement.style.transform = `scale(${scaleX}, ${scaleY})`;
        resizedElement.style.transformOrigin = 'top left';
        
        // Store the current scale for future calculations
        resizedElement.dataset.currentScaleX = scaleX;
        resizedElement.dataset.currentScaleY = scaleY;
    }
    
    // Update position if needed
    if (newX !== undefined) {
        resizedElement.style.left = `${newX}px`;
    }
    if (newY !== undefined) {
        resizedElement.style.top = `${newY}px`;
    }
}

function stopDragOrResize() {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
    resizedElement = null;
    resizeHandle = null;
}

function createControlIcons(wrapper) {
    const controlsDiv = document.createElement('div');
    wrapper.style.outline = 'none';
    wrapper.style.webkitTapHighlightColor = 'transparent';
    controlsDiv.className = 'absolute top-2 right-2 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100';
    
    // Clone button (add this before the other buttons)
    const cloneBtn = document.createElement('button');
    cloneBtn.innerHTML = '<i class="fas fa-clone text-gray-400 hover:text-white"></i>';
    cloneBtn.className = 'p-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors';
    cloneBtn.onclick = (e) => {
        e.stopPropagation();
        
        // Clone the component
        const clone = wrapper.cloneNode(true);
        clone.id = 'component-' + Date.now();
        
        // Add offset to position
        const offsetX = 20;
        const offsetY = 20;
        const currentLeft = parseInt(wrapper.style.left) || 0;
        const currentTop = parseInt(wrapper.style.top) || 0;
        
        clone.style.left = `${currentLeft + offsetX}px`;
        clone.style.top = `${currentTop + offsetY}px`;
        
        // Ensure the clone is on top
        const highestZ = Math.max(0, ...Array.from(document.getElementsByClassName('component-wrapper'))
            .map(el => parseInt(el.style.zIndex) || 0));
        clone.style.zIndex = highestZ + 1;
        
        // Re-attach event listeners to the clone's controls
        clone.querySelector('.absolute.top-2.right-2').remove();
        clone.appendChild(createControlIcons(clone));
        
        document.getElementById('canvas').appendChild(clone);
        selectComponent(clone);
    };

    // Add clone button first in the controls
    controlsDiv.appendChild(cloneBtn);
    
    // Move backward (one layer)
    const moveBackBtn = document.createElement('button');
    moveBackBtn.innerHTML = '<i class="fas fa-arrow-down text-gray-400 hover:text-white"></i>';
    moveBackBtn.className = 'p-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors';
    moveBackBtn.onclick = (e) => {
        e.stopPropagation();
        const currentZ = parseInt(wrapper.style.zIndex) || 1;
        if (currentZ > 1) {
            // Find component in the layer below
            const components = Array.from(document.getElementsByClassName('component-wrapper'));
            const componentBelow = components.find(c => parseInt(c.style.zIndex) === currentZ - 1);
            if (componentBelow) {
                componentBelow.style.zIndex = currentZ;
                wrapper.style.zIndex = currentZ - 1;
            }
        }
        updateComponentLayers();
    };

    // Move forward (one layer)
    const moveForwardBtn = document.createElement('button');
    moveForwardBtn.innerHTML = '<i class="fas fa-arrow-up text-gray-400 hover:text-white"></i>';
    moveForwardBtn.className = 'p-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors';
    moveForwardBtn.onclick = (e) => {
        e.stopPropagation();
        const currentZ = parseInt(wrapper.style.zIndex) || 1;
        // Find component in the layer above
        const components = Array.from(document.getElementsByClassName('component-wrapper'));
        const componentAbove = components.find(c => parseInt(c.style.zIndex) === currentZ + 1);
        if (componentAbove) {
            componentAbove.style.zIndex = currentZ;
            wrapper.style.zIndex = currentZ + 1;
        }
        updateComponentLayers();
    };

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fas fa-edit text-gray-400 hover:text-white"></i>';
    editBtn.className = 'p-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        const existingCode = wrapper.innerHTML;
        const inputModal = document.getElementById('inputModal');
        const textarea = document.getElementById('componentPrompt');
        
        // Get component dimensions and position
        const rect = wrapper.getBoundingClientRect();
        
        // Position input centered horizontally and at the top of the component
        inputModal.style.left = `${rect.left + (rect.width / 2)}px`;
        inputModal.style.top = `${rect.top - 10}px`; // Slightly above the component
        
        // Ensure the input is above the component
        const currentZ = parseInt(wrapper.style.zIndex) || 0;
        inputModal.style.zIndex = currentZ + 10;
        
        // Show input for modification
        inputModal.classList.remove('hidden');
        textarea.focus();
        
        // Store reference to component being edited
        textarea.dataset.editingComponent = 'true';
        textarea.dataset.componentToEdit = wrapper.id;
        
        // Add visual indicator that we're editing this component
        wrapper.classList.add('editing');
    };

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-times text-gray-400 hover:text-red-500"></i>';
    deleteBtn.className = 'p-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        wrapper.remove();
    };

    controlsDiv.appendChild(moveBackBtn);
    controlsDiv.appendChild(moveForwardBtn);
    controlsDiv.appendChild(editBtn);
    controlsDiv.appendChild(deleteBtn);
    
    return controlsDiv;
}

async function processRequestQueue() {
    if (processingRequest) return;
    
    while (requestQueue.size > 0) {
        processingRequest = true;
        const [firstRequestId] = requestQueue.keys();
        const request = requestQueue.get(firstRequestId);
        
        try {
            const response = await fetch('/generate-component', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request.data)
            });
            
            const data = await response.json();
            await handleComponentResponse(data, request);
        } catch (error) {
            console.error('Error processing request:', error);
        } finally {
            // Clean up this request
            if (request.loadingOverlay) {
                request.loadingOverlay.remove();
            }
            requestQueue.delete(firstRequestId);
        }
    }
    
    processingRequest = false;
}

// Update generateComponent function
async function generateComponent(prompt, left, top) {
    const inputModal = document.getElementById('inputModal');
    const textarea = document.getElementById('componentPrompt');
    
    const isModification = textarea.dataset.editingComponent === 'true';
    const componentToEdit = document.getElementById(textarea.dataset.componentToEdit);
    
    // Create a unique request ID
    const requestId = Date.now().toString();
    
    // Create and position loading overlay
    const loadingOverlay = createLoadingOverlay(requestId);
    loadingOverlay.style.left = inputModal.style.left;
    loadingOverlay.style.top = inputModal.style.top;
    document.body.appendChild(loadingOverlay);
    
    // Add request to queue
    requestQueue.set(requestId, {
        data: {
            prompt,
            is_modification: isModification,
            existing_code: isModification ? componentToEdit.innerHTML : null,
            request_id: requestId
        },
        position: { left, top },
        isModification,
        componentToEdit,
        loadingOverlay
    });
    
    // Hide input modal
    inputModal.classList.add('hidden');
    textarea.value = '';
    textarea.dataset.editingComponent = 'false';
    textarea.dataset.componentToEdit = '';
    
    // Process queue
    processRequestQueue();
}

// Add new function to handle component response
async function handleComponentResponse(data, request) {
    const { html, js } = extractComponentAndScript(data.component);
    
    if (html) {
        if (request.isModification && request.componentToEdit) {
            // Handle modification
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = html;
            
            const mainContent = request.componentToEdit.querySelector(':first-child');
            if (mainContent) {
                mainContent.replaceWith(tempContainer.querySelector(':first-child'));
            }
            
            // Re-add controls and handles
            const oldControls = request.componentToEdit.querySelector('.absolute.top-2.right-2');
            if (oldControls) oldControls.remove();
            request.componentToEdit.appendChild(createControlIcons(request.componentToEdit));
            
            request.componentToEdit.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
            const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
            handles.forEach(direction => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${direction}`;
                handle.style.display = 'none';
                request.componentToEdit.appendChild(handle);
            });
            
            if (selectedElement === request.componentToEdit) {
                selectComponent(request.componentToEdit);
            }
        } else {
            // Handle new component
            const wrapper = document.createElement('div');
            wrapper.className = 'component-wrapper group';
            wrapper.id = 'component-' + request.data.request_id;
            wrapper.style.position = 'absolute';
            wrapper.style.left = request.position.left;
            wrapper.style.top = request.position.top;
            
            const highestZ = Math.max(0, ...Array.from(document.getElementsByClassName('component-wrapper'))
                .map(el => parseInt(el.style.zIndex) || 0));
            wrapper.style.zIndex = highestZ + 1;
            
            wrapper.innerHTML = html;
            wrapper.appendChild(createControlIcons(wrapper));
            
            const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
            handles.forEach(direction => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${direction}`;
                handle.style.display = 'none';
                wrapper.appendChild(handle);
            });
            
            document.getElementById('canvas').appendChild(wrapper);
            selectComponent(wrapper);
        }

        if (js) {
            const script = document.createElement('script');
            script.textContent = js;
            document.body.appendChild(script);
        }
    }
}

function extractComponentAndScript(response) {
    const htmlMatch = response.match(/<component>(.*?)<\/component>/s);
    const jsMatch = response.match(/<script>(.*?)<\/script>/s);
    
    return {
        html: htmlMatch ? htmlMatch[1] : null,
        js: jsMatch ? jsMatch[1] : null
    };
}

function updateComponentLayers() {
    const canvas = document.getElementById('canvas');
    const components = Array.from(canvas.getElementsByClassName('component-wrapper'));
    
    // Sort components by their current z-index
    components.sort((a, b) => {
        return (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0);
    });
    
    // Reassign z-indices starting from 1
    components.forEach((component, index) => {
        component.style.zIndex = index + 1;
    });
}

// Update the createLoadingOverlay function
function createLoadingOverlay(requestId) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay active';
    overlay.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner">
                <div></div>
                <div></div>
            </div>
            <div class="loading-text">
                Generating Component<span class="loading-dots"></span>
            </div>
        </div>
    `;
    return overlay;
}

// Add this new function
function downloadHTML() {
    // Get all components
    const components = Array.from(document.getElementsByClassName('component-wrapper'))
        .sort((a, b) => (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0));
    
    // Create a clean version of the components HTML
    const componentsHTML = components.map(component => {
        // Create a clone to manipulate
        const clone = component.cloneNode(true);
        
        // Remove control elements
        clone.querySelectorAll('.resize-handle').forEach(el => el.remove());
        clone.querySelector('.absolute.top-2.right-2').remove(); // Remove control icons
        
        // Preserve positioning but remove draggable classes
        clone.className = 'absolute'; // Keep absolute positioning
        clone.style.position = 'absolute';
        clone.style.left = component.style.left; // Keep original position
        clone.style.top = component.style.top;
        clone.style.width = component.style.width || 'auto';
        clone.style.height = component.style.height || 'auto';
        clone.style.zIndex = component.style.zIndex;
        
        return clone.outerHTML;
    }).join('\n');
    
    // Create the full HTML document with a relative container
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Components</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .canvas-container {
            position: relative;
            min-height: 100vh;
            width: 100%;
            background-color: rgb(17, 24, 39);
            overflow: hidden;
        }
        
        /* Preserve component positioning */
        .absolute {
            position: absolute;
        }
    </style>
</head>
<body class="dark:bg-gray-900 min-h-screen">
    <div class="canvas-container">
        ${componentsHTML}
    </div>
</body>
</html>`;
    
    // Create blob and download
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-components.html';
    
    // Trigger download with animation
    const downloadBtn = document.getElementById('downloadButton');
    downloadBtn.classList.add('scale-95', 'opacity-80');
    
    a.click();
    
    window.URL.revokeObjectURL(url);
    
    // Reset button state
    setTimeout(() => {
        downloadBtn.classList.remove('scale-95', 'opacity-80');
    }, 200);
}

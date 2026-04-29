// Global Variables for UI Controls
let colorPicker;
let sizeSlider;
let opacitySlider; 
let gridCheckbox;  
let symmetryCheckbox; 

// --- Core Concept: Layering ---
// pgGrid: The bottom layer containing the paper background and grid lines.
// pgDrawing: The top layer containing ONLY the user's ink (transparent background).
let pgGrid;    
let pgDrawing; 

function setup() {
  // 1. Initialize the main canvas
  createCanvas(windowWidth, windowHeight - 100);
  
  // 2. Initialize Off-screen Graphics Buffers (Layers)
  pgGrid = createGraphics(width, height);
  pgDrawing = createGraphics(width, height);
  
  // Note: pgDrawing is created transparent by default, 
  // which is perfect for layering on top of the grid.
  
  // --- UI Construction ---
  let controls = createDiv('');
  controls.style('padding', '10px');
  controls.style('background', '#f0f0f0');
  controls.style('display', 'flex');
  controls.style('gap', '15px');
  controls.style('align-items', 'center');
  controls.style('flex-wrap', 'wrap');
  controls.style('font-family', 'sans-serif');

  // Color Picker
  createSpan('🎨 Color:').parent(controls);
  colorPicker = createColorPicker('#ed225d');
  colorPicker.parent(controls);
  
  // Opacity Slider (Alpha Channel)
  createSpan('Opacity:').parent(controls);
  opacitySlider = createSlider(0, 255, 255); // Range 0-255
  opacitySlider.parent(controls);

  // Brush Size Slider
  createSpan('🖌️ Size:').parent(controls);
  sizeSlider = createSlider(1, 100, 10);
  sizeSlider.parent(controls);

  // Logic Toggles
  symmetryCheckbox = createCheckbox('Symmetry Mode', false);
  symmetryCheckbox.parent(controls);
  
  // Grid Toggle with Callback
  gridCheckbox = createCheckbox('Show Grid', true);
  gridCheckbox.parent(controls);
  gridCheckbox.changed(updateGridLayer); // Event Listener: Re-draw grid when changed

  // Action Buttons
  let clearBtn = createButton('Clear (C)');
  clearBtn.parent(controls);
  clearBtn.mousePressed(clearDrawing); // Only clears the ink layer

  let saveBtn = createButton('Save (S)');
  saveBtn.parent(controls);
  saveBtn.mousePressed(saveWork); // Triggers the layer merging and save logic
  
  // Instructions
  let helpDiv = createDiv('Shortcuts: [E] Eraser | [B] Brush | [C] Clear | [Right-Click] Eraser');
  helpDiv.style('font-size', '12px');
  helpDiv.style('color', '#666');
  helpDiv.style('padding', '5px 10px');

  // 3. Render the grid initially
  // Important: This must be called AFTER gridCheckbox is created to avoid "undefined" errors.
  updateGridLayer(); 
}

function draw() {
  // 1. Draw the desk background (darker grey to show canvas bounds)
  background(220); 
  
  // 2. Render Layer 1: Background & Grid
  image(pgGrid, 0, 0);
  
  // 3. Render Layer 2: User Drawing (Ink)
  // Since pgDrawing has a transparent background, the grid shows through.
  image(pgDrawing, 0, 0);
  
  // 4. Render UI Overlay: Cursor Preview
  // This is drawn every frame and not saved to the graphics buffer.
  drawCursorPreview();
}

function mouseDragged() {
  // Boundary Check: Only draw if mouse is inside the canvas
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    
    // Get current state from UI controls
    let size = sizeSlider.value();
    let r = red(colorPicker.color());
    let g = green(colorPicker.color());
    let b = blue(colorPicker.color());
    let a = opacitySlider.value();
    
    pgDrawing.strokeWeight(size);
    pgDrawing.strokeCap(ROUND); // Makes the line ends round and smooth
    
    // --- Eraser Logic ---
    // Check for Right Click OR 'E' key press
    if (mouseButton === RIGHT || keyIsDown(69)) { 
      // erase() sets the blending mode to remove alpha (make pixels transparent)
      pgDrawing.erase(); 
    } else {
      // noErase() restores normal blending mode
      pgDrawing.noErase();
      pgDrawing.stroke(r, g, b, a);
    }

    // Draw the main line
    pgDrawing.line(pmouseX, pmouseY, mouseX, mouseY);

    // --- Symmetry Logic ---
    if (symmetryCheckbox.checked()) {
      let mirrorX = width - mouseX;
      let pMirrorX = width - pmouseX;
      pgDrawing.line(pMirrorX, pmouseY, mirrorX, mouseY);
    }
  }
}

// Function to redraw the background layer (pgGrid)
function updateGridLayer() {
  pgGrid.background(255); // Reset layer to white paper
  
  // Safety check: ensure checkbox exists and is checked
  if (gridCheckbox && gridCheckbox.checked()) {
    pgGrid.stroke(200); // Light grey lines
    pgGrid.strokeWeight(1);
    
    // Draw Vertical Lines using a Loop
    for (let x = 0; x < width; x += 40) {
      pgGrid.line(x, 0, x, height);
    }
    // Draw Horizontal Lines using a Loop
    for (let y = 0; y < height; y += 40) {
      pgGrid.line(0, y, width, y);
    }
  }
}

// Function to clear ONLY the drawing layer
function clearDrawing() {
  pgDrawing.clear(); // Clears all pixels in the graphics buffer to transparent
}

// Function to merge layers and save the image
function saveWork() {
  // 1. Create a temporary graphics buffer to combine layers
  let combined = createGraphics(width, height);
  
  // 2. Draw the Grid Layer first
  combined.image(pgGrid, 0, 0);
  
  // 3. Draw the Drawing Layer on top
  combined.image(pgDrawing, 0, 0);
  
  // 4. Save the combined result
  saveCanvas(combined, 'my_sketch', 'jpg');
}

// Function to draw the cursor indicator (UI only)
function drawCursorPreview() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    push(); // Save current drawing style
    noFill();
    stroke(50);
    strokeWeight(1);
    
    // Draw brush outline
    circle(mouseX, mouseY, sizeSlider.value());
    
    // Draw symmetry indicator if active
    if (symmetryCheckbox.checked()) {
      stroke(150); // Lighter color for the mirror cursor
      circle(width - mouseX, mouseY, sizeSlider.value());
    }
    pop(); // Restore previous drawing style
  }
}

// Event Listener for Keyboard Shortcuts
function keyPressed() {
  if (key === 'c' || key === 'C') {
    clearDrawing();
  }
  if (key === 's' || key === 'S') {
    saveWork();
  }
}

// Handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight - 100);
  
  // Re-create graphics buffers to match new size
  pgGrid = createGraphics(width, height);
  pgDrawing = createGraphics(width, height);
  
  // Redraw grid
  updateGridLayer();
}
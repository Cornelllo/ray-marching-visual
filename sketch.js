let polygons = []; // Array to store all polygon objects
let movingPoint; // Variable to store the moving point object
const RAY_COUNT = 180; // Number of rays emitted by the moving point
const BASE_SPEED = 4; // Speed at which the moving point moves
let debugTiming = false; // Flag to control debug timing output
const GRID_SIZE = 50; // Size of each grid cell
let grid; // Grid to store spatial partitioning data
let paused = false; // Flag to control the pause state

function setup() {
  createCanvas(400, 400); // Create a canvas of size 400x400
  grid = createGrid(width, height, GRID_SIZE); // Create the spatial grid
  movingPoint = new MovingPoint(random(width), random(height)); // Create the moving point at a random position
}

function draw() {
  if (debugTiming) console.time('draw'); // Start measuring time for the draw function if debugging is enabled

  background(0); // Clear the canvas with a black background

  drawGrid(); // Draw the spatial grid

  if (debugTiming) console.time('drawPolygons');
  // Draw all polygons
  for (let polygon of polygons) {
    polygon.display(); // Display each polygon
  }
  if (debugTiming) console.timeEnd('drawPolygons');

  if (!paused) { // Only update the moving point and rays if not paused
    if (debugTiming) console.time('moveAndCastRays');
    // Move the point, check collisions, and cast rays
    movingPoint.move(polygons); // Move the point and check for collisions with polygons
    movingPoint.castRays(grid); // Cast rays to detect intersections with polygons
    if (debugTiming) console.timeEnd('moveAndCastRays');
  }

  movingPoint.display(); // Display the moving point and its rays

  if (debugTiming) console.timeEnd('draw'); // End measuring time for the draw function if debugging is enabled
}

function keyPressed() {
  if (key === 'd' || key === 'D') { // Check if the 'd' key is pressed
    debugTiming = !debugTiming; // Toggle the debugTiming flag
    console.log(`Debug timing is now ${debugTiming ? 'enabled' : 'disabled'}.`); // Log the new state
  }
  if (key === ' ') { // Check if the space bar is pressed
    paused = !paused; // Toggle the paused flag
    console.log(`Paused is now ${paused ? 'enabled' : 'disabled'}.`); // Log the new state
  }
}

function mousePressed() {
  if (mouseButton === LEFT) { // Check if the left mouse button is pressed
    let sides = int(random(5, 11)); // Random number of sides between 5 and 10
    let size = random(20, 100); // Random size between 20 and 100
    let polygon = new Polygon(mouseX, mouseY, sides, size); // Create a new polygon
    polygons.push(polygon); // Add the polygon to the array
    addToGrid(polygon, grid); // Add the polygon to the spatial grid
  }
}

// Create a 2D grid for spatial partitioning
function createGrid(width, height, cellSize) {
  let cols = ceil(width / cellSize); // Calculate the number of columns
  let rows = ceil(height / cellSize); // Calculate the number of rows
  let grid = new Array(cols); // Initialize the grid array
  for (let i = 0; i < cols; i++) { // Loop through each column
    grid[i] = new Array(rows).fill(null).map(() => []); // Initialize each row with an empty array
  }
  return grid; // Return the created grid
}

// Add a polygon to the grid
function addToGrid(polygon, grid) {
  let bounds = polygon.getBounds(); // Get the bounding box of the polygon
  let minCol = floor(bounds.left / GRID_SIZE); // Calculate the minimum column index
  let maxCol = floor(bounds.right / GRID_SIZE); // Calculate the maximum column index
  let minRow = floor(bounds.top / GRID_SIZE); // Calculate the minimum row index
  let maxRow = floor(bounds.bottom / GRID_SIZE); // Calculate the maximum row index

  // Loop through the grid cells that the polygon overlaps
  for (let col = minCol; col <= maxCol; col++) {
    for (let row = minRow; row <= maxRow; row++) {
      grid[col][row].push(polygon); // Add the polygon to each overlapping cell
    }
  }
}

// Draw the grid for visualization
function drawGrid() {
  stroke(40); // Set the stroke color for grid lines
  for (let x = 0; x < width; x += GRID_SIZE) { // Loop through vertical grid lines
    line(x, 0, x, height); // Draw vertical grid lines
  }
  for (let y = 0; y < height; y += GRID_SIZE) { // Loop through horizontal grid lines
    line(0, y, width, y); // Draw horizontal grid lines
  }
}

// Class to represent a polygon with a given position, number of sides, and size
class Polygon {
  constructor(x, y, sides, size) {
    this.position = createVector(x, y); // Set the position of the polygon
    this.sides = sides; // Set the number of sides of the polygon
    this.size = size; // Set the size of the polygon
    this.vertices = []; // Initialize an array to store the vertices of the polygon
    this.generateVertices(); // Generate the vertices of the polygon
  }

  // Generate the vertices of the polygon
  generateVertices() {
    let angleOffset = random(TWO_PI); // Random offset for the starting angle
    for (let i = 0; i < this.sides; i++) { // Loop through each side of the polygon
      let angle = TWO_PI / this.sides * i + angleOffset; // Calculate the angle for each vertex
      let radius = this.size * (0.7 + random(0.6)); // Perturb the radius to create concave shapes
      let x = this.position.x + cos(angle) * radius; // Calculate the x-coordinate of the vertex
      let y = this.position.y + sin(angle) * radius; // Calculate the y-coordinate of the vertex
      this.vertices.push(createVector(x, y)); // Add the vertex to the vertices array
    }
  }

  // Display the polygon
  display() {
    noFill(); // Disable filling for the polygon
    stroke(255); // Set the stroke color to white
    beginShape(); // Begin a new shape
    for (let v of this.vertices) { // Loop through each vertex
      vertex(v.x, v.y); // Add each vertex to the shape
    }
    endShape(CLOSE); // Close the shape
  }

  // Get the bounding box of the polygon
  getBounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; // Initialize min and max values
    for (let v of this.vertices) { // Loop through each vertex
      if (v.x < minX) minX = v.x; // Update minX if the vertex x-coordinate is smaller
      if (v.y < minY) minY = v.y; // Update minY if the vertex y-coordinate is smaller
      if (v.x > maxX) maxX = v.x; // Update maxX if the vertex x-coordinate is larger
      if (v.y > maxY) maxY = v.y; // Update maxY if the vertex y-coordinate is larger
    }
    return { left: minX, top: minY, right: maxX, bottom: maxY }; // Return the bounding box
  }

  // Get the shortest distance from a point to any of the polygon's edges
  getDistance(point) {
    let minDistance = Infinity; // Initialize the minimum distance to infinity
    const len = this.vertices.length; // Cache the length of the vertices array
    for (let i = 0; i < len; i++) { // Loop through each edge of the polygon
      let start = this.vertices[i]; // Start vertex of the edge
      let end = this.vertices[(i + 1) % len]; // End vertex of the edge
      let distance = this.pointLineDistance(point, start, end); // Calculate the distance from the point to the edge
      if (distance < minDistance) {
        minDistance = distance; // Update the minimum distance if the current distance is smaller
      }
    }
    return minDistance; // Return the minimum distance
  }

  // Calculate the distance from a point to a line segment
  pointLineDistance(pt, v1, v2) {
    let lineVector = p5.Vector.sub(v2, v1); // Vector representing the line segment
    let pointVector = p5.Vector.sub(pt, v1); // Vector from the start of the line to the point
    let t = constrain(pointVector.dot(lineVector) / lineVector.magSq(), 0, 1); // Calculate the projection of the point onto the line
    let projection = p5.Vector.add(v1, p5.Vector.mult(lineVector, t)); // Calculate the projection point
    return p5.Vector.dist(pt, projection); // Return the distance from the point to the projection
  }

  // Get the normal vector of the closest edge to a point
  getClosestEdgeNormal(point) {
    let minDistance = Infinity; // Initialize the minimum distance to infinity
    let closestEdgeNormal = createVector(0, 0); // Initialize the closest edge normal vector
    const len = this.vertices.length; // Cache the length of the vertices array
    for (let i = 0; i < len; i++) { // Loop through each edge of the polygon
      let start = this.vertices[i]; // Start vertex of the edge
      let end = this.vertices[(i + 1) % len]; // End vertex of the edge
      let lineVector = p5.Vector.sub(end, start); // Vector representing the line segment
      let pointVector = p5.Vector.sub(point, start); // Vector from the start of the line to the point
      let t = constrain(pointVector.dot(lineVector) / lineVector.magSq(), 0, 1); // Calculate the projection of the point onto the line
      let projection = p5.Vector.add(start, p5.Vector.mult(lineVector, t)); // Calculate the projection point
      let distance = p5.Vector.dist(point, projection); // Calculate the distance from the point to the projection
      if (distance < minDistance) {
        minDistance = distance; // Update the minimum distance if the current distance is smaller
        closestEdgeNormal = createVector(-(end.y - start.y), end.x - start.x).normalize(); // Calculate the normal vector of the closest edge
      }
    }
    return closestEdgeNormal; // Return the normal vector of the closest edge
  }
}

// Class to represent a moving point that emits rays
class MovingPoint {
  constructor(x, y) {
    this.position = createVector(x, y); // Set the position of the moving point
    this.direction = p5.Vector.random2D(); // Set a random initial direction for the moving point
    this.rays = []; // Initialize an array to store the rays emitted by the moving point
    for (let angle = 0; angle < TWO_PI; angle += TWO_PI / RAY_COUNT) { // Loop to create rays at regular intervals around the point
      this.rays.push(new Ray(this.position, angle)); // Create a new ray with the given angle and add it to the rays array
    }
  }

  // Move the point and check for collisions with polygons
  move(polygons) {
    let moveStep = p5.Vector.mult(this.direction, BASE_SPEED); // Calculate the movement step based on the direction and speed
    this.position.add(moveStep); // Move the point

    // Check collision with polygons
    for (let polygon of polygons) { // Loop through each polygon
      let distance = polygon.getDistance(this.position); // Get the distance from the point to the polygon
      if (distance < BASE_SPEED) {
        let normal = polygon.getClosestEdgeNormal(this.position); // Get the normal of the closest edge
        this.position.sub(moveStep); // Move back to the previous position
        this.direction.reflect(normal); // Reflect the direction based on the normal
        moveStep = p5.Vector.mult(this.direction, BASE_SPEED); // Recalculate the movement step with the new direction
        this.position.add(moveStep); // Move with the new direction
      }
    }

    // Bounce off walls
    if (this.position.x < 0 || this.position.x > width) {
      this.direction.x *= -1; // Reverse the x-direction if the point hits the left or right wall
    }
    if (this.position.y < 0 || this.position.y > height) {
      this.direction.y *= -1; // Reverse the y-direction if the point hits the top or bottom wall
    }
  }

  // Cast rays to detect intersections with polygons
  castRays(grid) {
    for (let ray of this.rays) { // Loop through each ray
      ray.march(grid); // Perform ray marching for each ray
    }
  }

  // Display the moving point and its rays
  display() {
    fill(255, 0, 0); // Set the fill color to red
    noStroke(); // Disable stroke
    ellipse(this.position.x, this.position.y, 10, 10); // Draw the moving point as an ellipse
    for (let ray of this.rays) { // Loop through each ray
      ray.display(); // Display each ray
    }
  }
}

// Class to represent a single ray emitted from the moving point
class Ray {
  constructor(origin, angle) {
    this.origin = origin; // Set the origin of the ray
    this.direction = p5.Vector.fromAngle(angle); // Set the direction of the ray based on the given angle
    this.steps = []; // Initialize an array to store the steps of the ray
  }

  // Perform ray marching to detect intersections with polygons
  march(grid) {
    this.steps = []; // Clear the steps array
    let currentPos = this.origin.copy(); // Start from the origin of the ray

    const cols = grid.length; // Get the number of columns in the grid
    const rows = grid[0].length; // Get the number of rows in the grid

    for (let i = 0; i < 20; i++) { // Loop for a fixed number of steps
      let minDistance = Infinity; // Initialize the minimum distance to infinity

      // Determine which grid cell the current position is in
      let col = floor(currentPos.x / GRID_SIZE);
      let row = floor(currentPos.y / GRID_SIZE);

      // Ensure the cell indices are within bounds
      col = constrain(col, 0, cols - 1);
      row = constrain(row, 0, rows - 1);

      // Check only polygons in the current grid cell
      let cellPolygons = grid[col][row];
      for (let polygon of cellPolygons) { // Loop through each polygon in the current grid cell
        let distance = polygon.getDistance(currentPos); // Get the distance from the current position to the polygon
        if (distance < minDistance) {
          minDistance = distance; // Update the minimum distance if the current distance is smaller
        }
      }

      // Stop if no valid minimum distance is found
      if (!isFinite(minDistance)) {
        break; // Exit the loop if no valid distance is found
      }

      this.steps.push(currentPos.copy()); // Add the current position to the steps array

      // Stop if the ray is too close to a polygon
      if (minDistance < 1) {
        break; // Exit the loop if the distance is less than 1
      }

      currentPos.add(p5.Vector.mult(this.direction, minDistance)); // Move the current position in the direction of the ray
    }
  }

  // Display the ray and its steps
  display() {
    stroke(255, 100); // Set the stroke color to a semi-transparent white
    if (this.steps.length > 0) {
      line(this.origin.x, this.origin.y, this.steps[this.steps.length - 1].x, this.steps[this.steps.length - 1].y); // Draw a line from the origin to the last step
    }

    for (let i = 0; i < this.steps.length; i++) { // Loop through each step
      let alpha = map(i, 0, this.steps.length - 1, 255, 50); // Map the alpha value based on the step index
      fill(255, 0, 0, alpha); // Set the fill color with the calculated alpha
      noStroke(); // Disable stroke
      ellipse(this.steps[i].x, this.steps[i].y, 5, 5); // Draw an ellipse at each step
    }
  }
}
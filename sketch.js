let polygons = []; // Array to store all polygon objects
let movingPoint; // Variable to store the moving point object
const RAY_COUNT = 30; // Number of rays emitted by the moving point
const BASE_SPEED = 4; // Speed at which the moving point moves

function setup() {
  createCanvas(400, 400); // Create a canvas of size 400x400
  movingPoint = new MovingPoint(random(width), random(height)); // Create the moving point at a random position
}

function draw() {
  background(0); // Clear the canvas with a black background

  // Draw all polygons
  for (let polygon of polygons) {
    polygon.display(); // Display each polygon
  }

  // Move the point, check collisions, and cast rays
  movingPoint.move(polygons); // Move the point and check for collisions with polygons
  movingPoint.castRays(polygons); // Cast rays to detect intersections with polygons
  movingPoint.display(); // Display the moving point and its rays
}

function mousePressed() {
  if (mouseButton === LEFT) { // Check if the left mouse button is pressed
    let sides = int(random(5, 11)); // Random number of sides between 5 and 10
    let size = random(20, 100); // Random size between 20 and 100
    polygons.push(new Polygon(mouseX, mouseY, sides, size)); // Add a new polygon at the mouse position
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
    for (let i = 0; i < this.sides; i++) {
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
    for (let v of this.vertices) {
      vertex(v.x, v.y); // Add each vertex to the shape
    }
    endShape(CLOSE); // Close the shape
  }

  // Get the shortest distance from a point to any of the polygon's edges
  getDistance(point) {
    let minDistance = Infinity; // Initialize the minimum distance to infinity
    const len = this.vertices.length; // Cache the length of the vertices array
    for (let i = 0; i < len; i++) {
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
    for (let i = 0; i < len; i++) {
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
    for (let angle = 0; angle < TWO_PI; angle += TWO_PI / RAY_COUNT) {
      this.rays.push(new Ray(this.position, angle)); // Create rays at regular intervals around the point
    }
  }

  // Move the point and check for collisions with polygons
  move(polygons) {
    let moveStep = p5.Vector.mult(this.direction, BASE_SPEED); // Calculate the movement step based on the direction and speed
    this.position.add(moveStep); // Move the point

    // Check collision with polygons
    for (let polygon of polygons) {
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
  castRays(polygons) {
    for (let ray of this.rays) {
      ray.march(polygons); // Perform ray marching for each ray
    }
  }

  // Display the moving point and its rays
  display() {
    fill(255, 0, 0); // Set the fill color to red
    noStroke(); // Disable stroke
    ellipse(this.position.x, this.position.y, 10, 10); // Draw the moving point as an ellipse
    for (let ray of this.rays) {
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
  march(polygons) {
    this.steps = []; // Clear the steps array
    let currentPos = this.origin.copy(); // Start from the origin of the ray
    for (let i = 0; i < 20; i++) {
      let minDistance = Infinity; // Initialize the minimum distance to infinity
      for (let polygon of polygons) {
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

    for (let i = 0; i < this.steps.length; i++) {
      let alpha = map(i, 0, this.steps.length - 1, 255, 50); // Map the alpha value based on the step index
      fill(255, 0, 0, alpha); // Set the fill color with the calculated alpha
      noStroke(); // Disable stroke
      ellipse(this.steps[i].x, this.steps[i].y, 5, 5); // Draw an ellipse at each step
    }
  }
}

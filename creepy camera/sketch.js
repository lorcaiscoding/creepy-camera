let state = 1; 
let currentSetup = null;
let currentDraw = null;

var myAsciiArt;
var asciiart_width = 120;
var asciiart_height = 60;
var myCapture;
var gfx;
var ascii_arr;
var mirroredCapture;
var video;
var vScale = 16;
let imageScale = 0.0;
let dotDensity = 0.24;
let dwidth = 0;
let dheight = 0;
let damping = 0.5;
let kRadiusFactor = 0.5;
let kSpeed = 5.0;
let minDistFactor = 2.5;
let dots = 3000;
let catSpeed = 2;
let reference = null;
let catFrames = 8;
let captures = [];
let particles = [];
let capture;

function setup() {
  createCanvas(600, 600);
  frameRate(30);

  if (state === 1) {
    currentSetup = setupState1;
    currentDraw = drawState1;
  } else if (state === 2) {
    currentSetup = setupState2;
    currentDraw = drawState2;
  } else if (state === 3) {
    currentSetup = setupState3;
    currentDraw = drawState3;
  }

  if (currentSetup) {
    currentSetup();
  }

  console.log('Setup completed');
}

function draw() {
  if (currentDraw) {
    currentDraw();
  }
}

function initCaptureDevice() {
  try {
    myCapture = createCapture(VIDEO); 
    myCapture.size(600, 300); 
    myCapture.elt.setAttribute('playsinline', ''); 
    myCapture.hide(); 
    mirroredCapture = createGraphics(myCapture.width, myCapture.height);
    mirroredCapture.noLoop();
  } catch (_err) {
    console.log('[initCaptureDevice] capture error: ' + _err);
  }
}

function setupState1() {
  // Your state 1 setup code
    initCaptureDevice(); 
    gfx = createGraphics(asciiart_width, asciiart_height);
    gfx.pixelDensity(1);
    myAsciiArt = new AsciiArt(this); 
    textAlign(CENTER, CENTER);
    textFont('monospace', 8);
    textStyle(NORMAL);
    noStroke();
    fill(255);
    frameRate(30);
    console.log('Setup1 completed');
}

function drawState1() {
  if (myCapture !== null && myCapture !== undefined) {
    background(0);
    gfx.background(0);

    mirroredCapture.background(0);
    mirroredCapture.push();
    mirroredCapture.scale(-1, 1);
    mirroredCapture.image(myCapture, -mirroredCapture.width, 0);
    mirroredCapture.pop();

    gfx.image(mirroredCapture, 0, 0, gfx.width, gfx.height);
    gfx.filter(POSTERIZE, 5); 
    ascii_arr = myAsciiArt.convert(gfx); 
    myAsciiArt.typeArray2d(ascii_arr, this); 
  } else {
    background(255, 0, 0); 
  }
  console.log('Draw1 function called');
}

function setupState2() {
  // Your state 2 setup code
  pixelDensity(1);
  video = createCapture(VIDEO);
  video.size(width / vScale, height / vScale);
  console.log('Setup2 completed');
}

function drawState2() {
  background(50);
  video.loadPixels();
  for (var y = 0; y < video.height; y++) {
    for (var x = 0; x < video.width; x++) {
      var index = (video.width - x + 1 + (y * video.width)) * 4;
      var r = video.pixels[index + 0];
      var g = video.pixels[index + 1];
      var b = video.pixels[index + 2];
      var bright = (r + g + b) / 3;
      var w = map(bright, 5, 255, 0, vScale);
      noStroke();
      fill(255);
      rectMode(CENTER);
      rect(x * vScale, y * vScale, w, w);
    }
  }
  console.log('Draw2 function called');
}

function setupState3() {
  dwidth = 600;
  dheight = 600;
  createCanvas(600, 600);

  // VIDEO
  capture = createCapture(VIDEO);
  capture.size(dwidth, dheight);
  capture.hide();

  imageScale = width / dwidth;

  for (let i = 0; i < dots; i++) {
    particles[i] = new Particle(random(width), random(height));
  }

  frameRate(24);
  smooth();
  noStroke();

  let medArea = (width * height) / dots;
  medRadius = sqrt(medArea / PI);
  minRadius = medRadius;
  maxRadius = medRadius * medRadius * 1;
  background(255);
  console.log('Setup3 completed');
}

function cat() {
  if (frameCount % catSpeed == 0) {
    let frameCtr = (frameCount / catSpeed) % catFrames;

    reference = capture;
    reference.loadPixels();

    for (let i = 0; i < dots; i++) {
      let px = parseInt(particles[i].x / imageScale);
      let py = parseInt(particles[i].y / imageScale);
      if (px >= 0 && px < dwidth && py >= 0 && py < dheight) {
        let v = reference.pixels[(py * dwidth + (dwidth - px - 1)) * 4]; 
        particles[i].rad = map(v / 255.0, 0, 1, minRadius, maxRadius);
      }
    }
  }

  for (let i = 0; i < dots; ++i) {
    let p = particles[i];
    p.fx = p.fy = p.wt = 0;
    p.vx *= damping;
    p.vy *= damping;
  }

  for (let i = 0; i < dots - 1; ++i) {
    let p = particles[i];
    for (let j = i + 1; j < dots; ++j) {
      let pj = particles[j];
      if (
        i == j ||
        Math.abs(pj.x - p.x) > p.rad * minDistFactor ||
        Math.abs(pj.y - p.y) > p.rad * minDistFactor
      )
        continue;

      let dx = p.x - pj.x;
      let dy = p.y - pj.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      let maxDist = p.rad + pj.rad;
      let diff = maxDist - distance;
      if (diff > 0) {
        let scle = diff / maxDist;
        scle = scle * scle;
        p.wt += scle;
        pj.wt += scle;
        scle = (scle * kSpeed) / distance;
        p.fx += dx * scle;
        p.fy += dy * scle;
        pj.fx -= dx * scle;
        pj.fy -= dy * scle;
      }
    }
  }

  for (let i = 0; i < dots; ++i) {
    let p = particles[i];
    let dx, dy, distance, scle, diff;
    let maxDist = p.rad;
    distance = (dx = p.x - 0);
    dy = 0;
    diff = maxDist - distance;
    if (diff > 0) {
      scle = diff / maxDist;
      scle = scle * scle;
      p.wt += scle;
      scle = (scle * kSpeed) / distance;
      p.fx += dx * scle;
      p.fy += dy * scle;
    }
    dx = p.x - width;
    dy = 0;
    distance = -dx;
    diff = maxDist - distance;
    if (diff > 0) {
      scle = diff / maxDist;
      scle = scle * scle;
      p.wt += scle;
      scle = (scle * kSpeed) / distance;
      p.fx += dx * scle;
      p.fy += dy * scle;
    }

    distance = (dy = p.y - 0);
    dx = 0;
    diff = maxDist - distance;
    if (diff > 0) {
      scle = diff / maxDist;
      scle = scle * scle;
      p.wt += scle;
      scle = (scle * kSpeed) / distance;
      p.fx += dx * scle;
      p.fy += dy * scle;
    }

    dy = p.y - height;
    dx = 0;
    distance = -dy;
    diff = maxDist - distance;
    if (diff > 0) {
      scle = diff / maxDist;
      scle = scle * scle;
      p.wt += scle;
      scle = (scle * kSpeed) / distance;
      p.fx += dx * scle;
      p.fy += dy * scle;
    }
    if (p.wt > 0) {
      p.vx += p.fx / p.wt;
      p.vy += p.fy / p.wt;
    }
    p.x += p.vx;
    p.y += p.vy;
  }
}


class Particle {
  constructor(_x, _y) {
    this.x = _x;
    this.y = _y;
    this.vx = 0;
    this.vy = 0;
    this.rad = 1;
    this.fx = 0;
    this.fy = 0;
    this.wt = 0;
  }
}

function drawState3() {
  cat();
  background(255, 50);
  noStroke();
  fill(10);
  for (let i = 0; i < dots; ++i) {
    circle(particles[i].x, particles[i].y, medRadius * 1);
  }
  console.log('Draw3 function called');
}

function mouseClicked() {
  state = (state % 3) + 1;
  setup();
}

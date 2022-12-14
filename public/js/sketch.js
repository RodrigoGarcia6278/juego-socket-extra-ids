let starts = false;
let delay = 12;
let delayed = 12;
let numAliens = 8;
let playerOne = false;
let Aliens = [];
let otherBombs = [];
let score = 0;
let otherScore = 0;
let grey = [100,100,100];
let blue = [66,149,245];
let pink = [255,149,245];
let explosions = [];
let otherExplosions = [];

socket.emit("start");

socket.on('playerOne', () => {
  playerOne = true;
  socket.emit("createAliens",Aliens);
});

socket.on('dc', () => {
  playerOne = false;
  starts = false;
  Aliens = [];
  otherBombs = [];
  Bombs = [];
  score = 0; 
  otherScore = 0;
  setup();
});

socket.on('begin',(aliens) => {
  for(let i = 0; i < numAliens; i++){
    if(aliens[i] != undefined && Aliens[i] != undefined){
      Aliens[i].x = aliens[i].x;
      Aliens[i].y = aliens[i].y;
    }
  }
  starts = true;
});

socket.on('updated', (data) => {
  while(data != undefined && data.Aliens.length < Aliens.length){
    Aliens.splice(Aliens.length-1,1);
    for(let i = 0; i < data.Aliens.length; i++){
      Aliens[i].x = data.Aliens[i].x;
      Aliens[i].y = data.Aliens[i].y;
      Aliens[i].xDir = data.Aliens[i].xDir;
      Aliens[i].yDir = data.Aliens[i].yDir;
    }
  }
  
  if(data.ship != undefined) {
    otherShip.x = data.ship.x;
  }
  else {
    otherShip = undefined;
  }
  
  if(data.hitBomb > -1){
    otherBombs.splice(data.hitBomb,1);
  }
  for(let i = 0; i < data.Bombs.length; i++){
    if(otherBombs[i] == undefined){
      let extraBomb = new Bomb(data.Bombs[i].x,data.Bombs[i].y);
      otherBombs.push(extraBomb);
    }
  }

  for(let w = 0; w < data.explosions.length; w++) {
    if(otherExplosions[w] == undefined){
      let explosion = new Explosion(data.explosions[w].x,data.explosions[w].y);
      otherExplosions.push(explosion);
    }
  } 

  otherScore = data.score;
});

function setup() {
  var canvas = createCanvas(700, 500); 
  canvas.parent('sketch-holder');
  ship = new Ship(false);
  otherShip = new Ship(true);
  for(let i = 0; i < numAliens; i++){
    let a = new Alien(random(0,width),random(0,height/2),20);
    Aliens.push(a);
  }
  Bombs = [];
  textSize(20);
}

function draw() {
  background('#222222');
  if(!starts){
    return;
  }
  let string = [
    ["score: ", grey],
    [score + " ", blue],
    [otherScore , pink],
  ];
  drawtext(10, 20, string );
  fill(100,100,100)

  if(Aliens.length == 0 && otherShip != undefined && ship != undefined){
    for(let i = 0; i < numAliens; i++){
      let a = new Alien(random(0,width),random(0,height/2),20);
      Aliens.push(a);
    }
    socket.emit("start");
  }
  else {
    for(let i = 0; i < Aliens.length; i++) {
      Aliens[i].show();
      Aliens[i].move(); 
      if(Aliens[i].hit(ship)){
        ship = undefined;
        Aliens.splice(i,1);
        i--;
      }
    }
  }

  fill(pink); 
  for(let i = 0; i < otherBombs.length; i++) {
    otherBombs[i].show();
    otherBombs[i].move();
    if(otherBombs[i].y < 0){
      otherBombs.splice(i,1);
      i--;
      continue;
    }
  }

  for(let i = 0; i < otherExplosions.length; i++) {
    if(otherExplosions[i].show()){
      otherExplosions.splice(i,1);
      i--;
    }
  }

  let hitBomb = -1;
  fill(blue);
  for(let i = 0; i < Bombs.length; i++) {
    Bombs[i].show();
    Bombs[i].move(); 
    
    if(Bombs[i].y < 0){
      Bombs.splice(i,1);
      i--;
      continue;
    }
    
    for(let w = 0; w < Aliens.length; w++) {
      if(Bombs[i].hit(Aliens[w])){
        let explosion = new Explosion(Aliens[w].x,Aliens[w].y)
        explosions.push(explosion);
        Aliens.splice(w,1);
        Bombs.splice(i,1);
        hitBomb = i;
        w--;
        i--;
        score++;
        break;
      }
    }
  }
   for(let w = 0; w < explosions.length; w++) {
    if(explosions[w].show()){
      explosions.splice(w,1);
      w--;
    }
  } 
  delayed++;

  if(ship != undefined){
    ship.show();
  }
  if(otherShip != undefined){
    otherShip.show();
  }

  let data = { 
    Aliens: Aliens,
    Bombs: Bombs,
    ship: ship,
    explosions: explosions,
    score: score,
    hitBomb: hitBomb
  }
  socket.emit("update",data);
}

function mouseMoved() {
  if(ship != undefined){
    ship.move(); 
  }
}

function mouseDragged() {
  if(ship != undefined){
    ship.move(); 
  }
}
function touchStarted() {
  if(delayed >= delay && ship != undefined) {
      ball = new Bomb(ship.x+20,ship.y+20);  
      Bombs.push(ball);  
      delayed = 0;
  }
}

function drawtext( x, y, text_array ) {
  let pos_x = x;
  for ( let i = 0; i < text_array.length; ++ i ) {
    let part = text_array[i];
    let t = part[0];
    let c = part[1];
    let w = textWidth( t );
    fill( c );
    text( t, pos_x, y);
    pos_x += w;
  }
}

$( document ).ready(function() {

  var canvas = document.getElementById('canvas1');
  var ctx = canvas.getContext('2d');
  var glob_radius = 7;
  var shapes = [];



  function createBall (x, y, vx, vy, ax, ay, radius, color) {
    var ball = {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      ax: ax,
      ay: ay,
      radius: radius,
      color: color,
      fade: 'in',
      draw: function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(' + this.color.r+',' +
                                  this.color.b+',' +
                                  this.color.g+',' +
                                  this.color.a+')';
        ctx.fill();
      }
    };
    return ball;
  }

  function rand_num_between(low, high, round) {
    var num = Math.random();
    num *= (high - low);
    num += low;
    if (round) {
      num = Math.floor(num)
    }
    return num;
  }

  function draw() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var key_val = Math.random();
    if (key_val > 0.95) {
      var color = {
        'r': 160,
        'g': rand_num_between(150, 255, round=true),
        'b': rand_num_between(0, 50, round=true),
        'a': 0.001
      }
      var new_ball = createBall(
        x=rand_num_between((canvas.width * 0.25), (canvas.width * 0.75), round=true),
        y=rand_num_between((canvas.width * 0.25), (canvas.height * 0.75), round=true),
        vx=rand_num_between(-1, 1),
        vy=rand_num_between(-1, 1),
        ax=rand_num_between(-0.1, 0.1),
        ay=rand_num_between(-0.1, 0.1),
        radius=glob_radius,
        color=color
      );
      shapes.push(new_ball);
    }

    if (shapes.length > 0) {
      for (i = 0; i < shapes.length; i++) {
        var shape = shapes[i];
        if (shape.color.a > 0.0) {
          shape.draw();
          shape = fadeinout(shape, 0.01)
          // shape.vx -= shape.ax;
          // shape.vy -= shape.ay;
          shape.x += shape.vx;
          shape.y += shape.vy;
        }
        else {
          shapes.splice(i, 1);
        }
      }
    }
    window.requestAnimationFrame(
      function () {
        // Create a random postion for the ball here.
        draw();
      }
    );
  }

  function fadeinout(shape, step) {
    if (shape.fade == 'in' && shape.color.a >= 1.0) {
      shape.fade = 'out';
    }
    if (shape.fade == 'in') {
      shape = fadein(shape, step);
    }
    else {
      shape = fadeout(shape, step);
    }
    return shape
  }

  function fadeout(shape, step) {
    shape.color.a -= step;
    return shape;
  }

  function fadein(shape, step) {
    shape.color.a += step;
    return shape;
  }

  draw();

});

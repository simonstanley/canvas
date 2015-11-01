$( document ).ready(function() {

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var glob_radius = 2;
    var shapes = [];
    var frame = 0;

    function createCanvasBall (x, y, vx, vy, ax, ay, radius, color) {
    // A Canvas Ball is measured in 0-1 in width (x) and height (y) regardles
    // of the window width and height.
    // vx and vy are measured in seconds to cross the canvas on their axis.
    var pxl_x = x * canvas.width;
    var pxl_y = y * canvas.height;
    var pxl_vx = Math.floor((canvas.width / 59.) * vx);
    var pxl_vy = Math.floor((canvas.height / 59.) * vy);
    var ball = {
        x: pxl_x,
        y: pxl_y,
        vx: pxl_vx,
        vy: pxl_vy,
        x3: rand_num_between(-0.000003, -0.000001),
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

    function fadeout(shape, step) {
        shape.color.a -= step;
    return shape;
    }

    function fadein(shape, step) {
        shape.color.a += step;
    return shape;
    }

    function movePosition(shape, stepx, stepy) {
        shape.x += stepx
        //shape.y += stepy
        var x3 = shape.x3;
        var x2 = -0.000011;
        var x1 = 1;
        var c  = 141;
        shape.y = (
            (x3 * Math.pow(shape.x, 3)) +
            (x2 * Math.pow(shape.x, 2)) +
            (x1 * shape.x) +
            c
        );
        return shape;
    }

    function percentToPxlPosition(shape, x, y) {
        shape.x = canvas.width * x;
        shape.y = canvas.height * (1.0 - y);
        return shape;
    }
    function PxlToPercentPosition(shape, x, y) {
        shape.x = x / canvas.width;
        shape.y = 1.0 - (y / canvas.height);
        return shape;
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

    function animate() {
        //ctx.clearRect(0,0, canvas.width, canvas.height);

        // For full window.
        // canvas.width = window.innerWidth;
        // canvas.height = window.outerHeight;

        ball = percentToPxlPosition(
            ball,
            path_coords[frame].x,
            path_coords[frame].y
        )
        ball.draw();

        frame += 1;
        if (frame < 1000) {
            window.requestAnimationFrame(
                function () {
                    animate();
                }
            );
        }
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

    function path(markers, curve, npoints) {

      var xmkrs = [];
      var ymkrs = [];
      for (var i = 0; i < markers.length; i++) {
          xmkrs.push(markers[i][0]);
          ymkrs.push(markers[i][1]);
      }
      var xstart = xmkrs[0];
      var xstep = (xmkrs[(xmkrs.length-1)] - xstart) / (npoints - 1);
      var xpnts = [];
      for (i = 0; i < npoints; i++) {
          xpnts.push(xstart + (i * xstep));
      }

      var pnts = [];
      for (var i = 0; i < xpnts.length; i++) {
          var x = xpnts[i];
          var y = 0.0;
          for (var j = 0; j < xmkrs.length; j++) {
              var dnum = calcDenum(x, xmkrs, j);
              var num = calcNum(xmkrs, j);
              var product = dnum / num;
              y += ymkrs[j] * product;
          }
          pnts.push([x, y]);
      }
      return pnts;
    }
    function calcDenum(x, pnts, pnt_indx) {
      var dnum = 1;
      for (i = 0; i < pnts.length; i++) {
          if (i != pnt_indx) {
              dnum *= (x - pnts[i]);
          }
      }
      return dnum;
    }
    function calcNum(pnts, pnt_indx) {
      var num = 1;
      var x = pnts[pnt_indx];
      for (i = 0; i < pnts.length; i++) {
          if (i != pnt_indx) {
              num *= (pnts[pnt_indx] - pnts[i]);
          }
      }
      return num;
    }

    function drawMarker(crd) {
        var mrk_clr = {'r': 255, 'b': 0, 'g': 0, 'a': 1}
        var mrkr = createCanvasBall(
          x=crd.x,
          y=crd.y,
          vx=0.2,
          vy=0.2,
          ax=0,
          ay=0,
          radius=glob_radius+4,
          color=mrk_clr
        );
        mrkr = percentToPxlPosition(
          mrkr,
          crd.x,
          crd.y
        )
        mrkr.draw();
    }

    var color = {'r': 0, 'b': 0, 'g': 0, 'a': 1}
    var ball = createCanvasBall(
    x=0.1,
    y=0.8,
    vx=0.2,
    vy=0.2,
    ax=0,
    ay=0,
    radius=glob_radius,
    color=color
    );

    var mrkrs = [];
    var path_crds;
    canvas.addEventListener("mousedown", getPosition, false);

    function getPosition(event)
    {
        var x = event.x;
        var y = event.y;
        x -= canvas.offsetLeft;
        y -= canvas.offsetTop;

        // Translate x y into percent vals

        var crd = coord(x, y);
        crd = PxlToPercentPosition(crd, x, y)

        mrkrs.push(crd);
        drawMarker(crd);

        if (mrkrs.length == 5) {
            path_coords = curvePath(mrkrs);
            animate();
        }

    }
});

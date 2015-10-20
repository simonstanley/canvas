/* CanvasAnimation
 *
 * JavaScript package for creating animations on the canvas element.
 *
 */

var rnd_prc = 5;

///////////////////////////////////////////////////////////////////////////////
/*
 * COORDINATE
 */
function coord(x, y) {
    // Single point in 2D plane
    var coord = {
        x: Number((x).toFixed(rnd_prc)),
        y: Number((y).toFixed(rnd_prc)),
        addVector: function(vec) {
            return addVec(this, vec);
        },
        subtractVector: function(vec) {
            return subVec(this, vec);
        }
    };
    return coord;
}

// FUNCTIONS //
function addVec(crd, vec) {
    return coord(crd.x + vec.x, crd.y + vec.y);
}
function subVec(crd, vec) {
    return coord(crd.x - vec.x, crd.y - vec.y);
}
function coordsMidPoint(coord1, coord2) {
    return coord(
        (coord1.x + coord2.x) / 2.0,
        (coord1.y + coord2.y) / 2.0
    )
}


///////////////////////////////////////////////////////////////////////////////
/*
 * VECTOR
 */
function vector(x, y) {
    // Single step in 2D plane
    var vec = {
        x: Number((x).toFixed(rnd_prc)),
        y: Number((y).toFixed(rnd_prc)),
        length: function() {
            return calcVecLength(this);
        },
        unit: function() {
            return calcUnitVec(this);
        },
        eq: function () {
            return calcLineEq(coord(0,0), this);
        }
    }
    return vec;
}

// FUNCTIONS //
function calcVecLength(vec) {
    return Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
}
function calcUnitVec(vec) {
    return vector((vec.x / vec.length()), (vec.y / vec.length()));
}
function calcVec(coord1, coord2) {
    var x_diff = coord2.x - coord1.x;
    var y_diff = coord2.y - coord1.y;
    return vector(x_diff, y_diff);
}


///////////////////////////////////////////////////////////////////////////////
/*
 * STRAIGHT LINE
 */
function line(coord1, coord2) {
    // Straight line from coord1 to coord2 (meaning it has a direction).
    var line = {
        coord1: coord1,
        coord2: coord2,
        vector: function() {
            return calcVec(this.coord1, this.coord2);
        },
        unit: function() {
         return calcUnitVec(this.vector());
        },
        eq: function () {
         return calcLineEq(this.coord1, this.coord2);
        },
        length: function() {
         return calcVecLength(this.vector());
        },
        inverse: function(crd) {
         return calcEqInverse(this.eq(), crd);
        },
        midpoint: function() {
         return coordsMidPoint(this.coord1, this.coord2);
        }
        }
    return line;
}

function lineEq(grad, cnst, vline) {
    // Given by y = (grad * x) + cnst (unless its a vertical line)
    // grad and cnst are null if its a vertical line.
    if (vline == null) {
        grad = Number((grad).toFixed(rnd_prc));
        cnst = Number((cnst).toFixed(rnd_prc));
    }
    var eq = {
        grad: grad,
        cnst: cnst,
        vline: vline, // vline value represents equation x=vline
        calcY: function(x) {
            return calcLineY(this, x);
        },
        calcX: function(y) {
            return calcLineX(this, y);
        }
    }
    return eq;
}

// FUNCTIONS //
function calcLineEq(coord1, coord2) {
    if (coord1.x == coord2.x) {
      if (coord1.y == coord2.y) {
        // coord1 and coord2 are the same.
        return null;
      }
      // Vertical line. Create a special vline case as it can't be described
      // with y = (grad * x) + cnst
      var grad = null;
      var cnst = null;
      var vline = coord1.x;
    }
    else {
      var grad = (coord2.y - coord1.y) / (coord2.x - coord1.x);
      var cnst = coord1.y - (grad * coord1.x);
      var vline = null;
    }
    return lineEq(grad, cnst, vline);
}
function calcLineY(eq, x) {
    if (eq.vline) {
        if (eq.vline == x) {
            // y can be any value.
            return inf;
        }
        else {
            // x not on line.
            return null;
        }
    }
    else {
        return (eq.grad * x) + eq.cnst;
    }
}
function calcLineX(eq, y) {
    if (eq.grad) {
        // If grad is not null or 0.
        return (y - eq.cnst) / eq.grad;
    }
    else {
        if (eq.grad == null) {
            // Dealing with vertical line.
            return vline;
        }
        else if (eq.grad == 0) {
            // Dealing with horizontal line.
            if (y == eq.cnst) {
                // x can be any value.
                return inf;
            }
            else {
                // y not on line.
                return null;
            }
        }
    }
}
function calcEqInverse(eq, crd) {
    // Calculate inverse (adjacent) equation that passes through given coord.
    if (eq.grad) {
      // If grad is not null or 0.
      var inv_grad = -1.0 / eq.grad;
      var inv_cnst = crd.y - (inv_grad * crd.x);
      var vline = null;
    }
    else {
      if (eq.grad == null) {
        // Dealing with vertical line, change to horizontal.
        var inv_grad = 0.0;
        var inv_cnst = crd.y;
        var vline = null;
      }
      else if (eq.grad == 0) {
        // Dealing with horizontal line, change to vertical.
        var inv_grad = null;
        var inv_cnst = null;
        var vline = crd.x;
      }
    }
    return lineEq(inv_grad, inv_cnst, vline);
}
function moveEq(eq, crd) {
    var cnst = crd.y - (eq.grad * crd.x);
    return lineEq(eq.grad, cnst);
}


///////////////////////////////////////////////////////////////////////////////
/*
 * CURVED LINE
 */
function curvedLine(srt, end, cntr) {
    // A curved line defined by quadratic bezier curve with start, end and
    // control point.
    var curve = {
        srt: srt,
        end: end,
        cntr: cntr,
        calcCrd: function(t) {
            // 0 < t < 1 returns coords on curve between srt and end.
            var x = (
                (Math.pow(1.0 - t, 2) * this.srt.x) +
                (2 * t * (1.0 - t) * this.cntr.x) +
                (Math.pow(t, 2) * this.end.x)
            );
            var y = (
                (Math.pow(1.0 - t, 2) * this.srt.y) +
                (2 * t * (1.0 - t) * this.cntr.y) +
                (Math.pow(t, 2) * this.end.y)
            );
            return coord(x, y);
        },
        length: function() {
            return calcQuadLength(this.srt, this.end, this.cntr);
        }
    }
    return curve;
}

// FUNCTIONS //
function quadEq(fac2, fac1, cnst) {
    // Represents equation y = (fac2 * x^2) + (fac1 * x) + cnst
    var eq  = {
        fac2: fac2,
        fac1: fac1,
        cnst: cnst,
        calcY: function(x) {
            return calcQuadY(this, x);
        },
        calcX: function(y) {
            return calcQuadX(this, y);
        }
    }
    return eq;
}
function calcQuadY(quadEq, x) {
    return (quadEq.fac2 * Math.pow(x, 2)) + (quadEq.fac1 * x) + quadEq.cnst;
}
function calcQuadX(quadEq, y) {
    // This is the quadratic formula.
    var p1 = Math.pow(quadEq.fac1, 2) - (4 * quadEq.fac2 * (quadEq.cnst - y));
    var p2 = 2 * quadEq.fac2;
    var p12 = Math.sqrt(p1) / p2;
    return [(-1.0 * quadEq.fac2) + p12, (-1.0 * quadEq.fac2) - p12];
}
function calcQuadLength(srt, end, cntr) {
    // Ref: http://www.malczak.linuxpl.com/blog/quadratic-bezier-curve-length/
    var ax = srt.x - (2 * cntr.x) + end.x;
    var bx = (2 * cntr.x) - (2 * srt.x);
    var ay = srt.y - (2 * cntr.y) + end.y;
    var by = (2 * cntr.y) - (2 * srt.y);

    var A = 4 * (Math.pow(ax, 2) + Math.pow(ay, 2));
    var B = 4 * ((ax * bx) + (ay * by));
    var C = Math.pow(bx, 2) + Math.pow(by, 2);

    var sec1 = 1 / (8 * Math.pow(A, (3 / 2)));
    var sec2 = 4 * (Math.pow(A, (3 / 2)) * Math.sqrt(A + B + C));
    var sec3 = (2 * Math.sqrt(A) * B) * (Math.sqrt(A + B + C) - Math.sqrt(C));
    var sec4 = (4 * C * A) - Math.pow(B, 2);
    var sec5 = (2 * Math.sqrt(A)) + (B / Math.sqrt(A)) + (2 * Math.sqrt(A + B + C));
    var sec6 = (B / Math.sqrt(A)) + (2 * Math.sqrt(C));

    return sec1 * (sec2 + sec3 + (sec4 * Math.log(Math.abs(sec5 / sec6))));
}


///////////////////////////////////////////////////////////////////////////////
/*
 * CURVED PATH
 */
function curvePath(crds, step_size) {
    var path_crds = [];
    var t_err_pct = 0.0;
    for (var i = 0; i < (crds.length - 1); i++) {
        // If change in direction is the same.
        // Establish the two tangent equations for this and next point.
        // Start by getting this and the next line.
        var this_line = line(crds[i], crds[i+1]);
        var next_line;
        if (i+2 < crds.length) {
            // I.e i+1 is not the end point.
            var next_line = line(crds[i+1], crds[i+2])
        }
        else {
            next_line = null;
        }
        if (next_line) {
            // Not end of path
            if (!crds[i+1].dir_switch) {
                crds[i+1].tng_eq = calcTangent(this_line, next_line);
                // Establish the direction change of lines, lines are assigned a
                // clockwise = true or false attribute.
                crds[i+1].clockwise = isClockwise(this_line, next_line);
            }

            if (!crds[i].tng_eq) {
                // Start of path
                var this_line_mid = this_line.midpoint();
                crds[i].tng_eq = this_line.inverse(this_line_mid);
                crds[i].clockwise = crds[i+1].clockwise;
            }
            else {
                // Mid path
                if ((!crds[i].dir_switch && !crds[i+1].dir_switch) &&
                    crds[i].clockwise != crds[i+1].clockwise) {
                    // If change in direction changes.
                    // Curve between the two crds must be split into two with
                    // Mid tangent line being the mean acute angle of this and
                    // next tangents and placed at the mid point.
                    var xcrd = this_line.midpoint();

                    // Split the line into two sections. Take the midpoint of
                    // each line and calculate where adjecent line at midpoint
                    // meets the tangent equation of its neighbouring point.
                    // These two meeting points (from each section) give the
                    // line with the required gradient for the new tng_eq at
                    // the switch point.
                    var sec1mid = coordsMidPoint(crds[i], xcrd);
                    var sec2mid = coordsMidPoint(xcrd, crds[i+1]);
                    var sec1tng = this_line.inverse(sec1mid);
                    var sec2tng = this_line.inverse(sec2mid);
                    var tng_ln_srt = solveEquations(crds[i].tng_eq, sec1tng);
                    var tng_ln_end = solveEquations(crds[i+1].tng_eq, sec2tng);
                    var pre_tng_ln = line(tng_ln_srt, tng_ln_end);
                    var xcrd_tng = moveEq(pre_tng_ln.eq(), xcrd);

                    xcrd.tng_eq = xcrd_tng;
                    xcrd.dir_switch = true;

                    // Add the extra coord to the path and continue in loop.
                    new_crds = [];
                    for (var k = 0; k < crds.length; k++) {
                        new_crds.push(crds[k]);
                        if (k == i) {
                            new_crds.push(xcrd);
                        }
                    }
                    crds = new_crds;
                    i-=1;
                    continue;
                }
                if (crds[i+1].tng_eq.calcY(crds[i].x) == crds[i].y) {
                    crds[i+1].tng_eq = calcEqInverse(crds[i].tng_eq, crds[i+1]);
                    crds[i+1].dir_switch = true;
                }
            }
        }
        else {
            // End of path
            var this_line_mid = this_line.midpoint();
            crds[i+1].tng_eq = this_line.inverse(this_line_mid);
            crds[i+1].clockwise = crds[i].clockwise;
        }
        var this_quad_crd = solveEquations(crds[i].tng_eq, crds[i+1].tng_eq);
        if (this_quad_crd == crds[i] || this_quad_crd == crds[i+1]) {

        }
        var quad_crv = curvedLine(crds[i], crds[i+1], this_quad_crd);
        var quad_len = quad_crv.length();

        //


        // Calculate step sizes in t
        var t_step = step_size / quad_len;
        var t_crds = [];
        var t_pos = t_step * t_err_pct;
        for (var t = t_pos; t < 1.0; t+=t_step) {
            t_crds.push(t);
        }
        t_err_pct = (t - 1.0) / t_step;
        for (var j = 0; j < t_crds.length; j++) {
            path_crds.push(quad_crv.calcCrd(t_crds[j]));
        }
        console.log(crds[i].tng_eq);
        //console.log("y="+crds[i+1].tng_eq.grad+"x +"+crds[i+1].tng_eq.cnst);
    }
    return path_crds
}

// FUNCTIONS //
function calcTangent(line1, line2) {
    // line1.coord2 must equal line2.coord1
    var mkr_top = line1.coord2.addVector(line1.unit());
    var mkr_bot = line2.coord1.addVector(line2.unit());
    var mid_crd = coordsMidPoint(mkr_top, mkr_bot);
    var tng_ln = line(line1.coord2, mid_crd);
    return tng_ln.eq();
}
function isClockwise(line1, line2) {
    var vec1 = line1.vector();
    var vec2 = line2.vector();
    // The point on line of vec1 where x = vec2.x
    var vec1y2 = vec1.eq().calcY(vec2.x);
    if (vec1.x > 0) {
        if (vec2.y < vec1y2) {
            return true;
        }
        else if (vec2.y > vec1y2) {
            return false;
        }
        else {
            // vec1 and vec2 are the same.
            return null;
        }
    }
    else if (vec1.x < 0) {
        if (vec2.y < vec1y2) {
            return false;
        }
        else if (vec2.y > vec1y2) {
            return true;
        }
        else {
            // vec1 and vec2 are the same direction.
            return null;
        }
    }
    else {
        // vec1 is vertical
        if (vec1.y > 0) {
            if (vec2.x > 0) {
                return true;
            }
            else if (vec2.x < 0) {
                return false;
            }
            else {
                // vec1 and vec2 are the same direction.
                return null;
            }
        }
        if (vec1.y < 0) {
            if (vec2.x > 0) {
                return false;
            }
            else if (vec2.x < 0) {
                return true;
            }
            else {
                // vec1 and vec2 are the same direction.
                return null;
            }
        }
        else {
            // vec1 is (0, 0), no direction.
            return null;
        }
    }
}
function solveEquations(eq1, eq2) {
    if (eq1.grad == eq2.grad) {
        if (eq1.cnst == eq2.cnst && eq1.vline == eq2.vline) {
            // Lines are the same.
            return inf;
        }
        else {
            // Lines are parallel and will not solve.
            return null;
        }
    }
    if (eq1.vline && !eq2.vline) {
        // eq1 is vertical
        var x = eq1.vline;
        var y = eq2.calcY(x);
    }
    else if (eq2.vline && !eq1.vline) {
        // eq2 is vertical
        var x = eq2.vline;
        var y = eq1.calcY(x);
    }
    else if (eq1.grad == 0.0) {
        // eq1 is horizontal
        var y = eq1.cnst;
        var x = eq2.calcX(y);
    }
    else if (eq2.grad == 0.0) {
        // eq2 is horizontal
        var y = eq2.cnst;
        var x = eq1.calcX(y);
    }
    else {
        var y = (
            eq2.cnst - ( (eq2.grad * eq1.cnst) / eq1.grad ) ) /
            (1.0 - (eq2.grad / eq1.grad));
        var x = eq1.calcX(y);
    }
    return coord(x, y);
}

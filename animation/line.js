/* CanvasAnimation
 *
 * JavaScript package for creating animations on the canvas element.
 *
 */

var req_seg_len = 0.001;
var rnd_prc = 6;
var str_ln_damp_val = 1.2;

///////////////////////////////////////////////////////////////////////////////
/*
 * COORDINATE
 */
function coord(x, y, t) {
    // Single point in 2D plane
    if (t) {
        t =  Number((t).toFixed(rnd_prc));
    }
    var coord = {
        x: Number((x).toFixed(rnd_prc)),
        y: Number((y).toFixed(rnd_prc)),
        t: t,
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
            return Infinity;
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
            return eq.vline;
        }
        else if (eq.grad == 0) {
            // Dealing with horizontal line.
            if (y == eq.cnst) {
                // x can be any value.
                return Infinity;
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
function calcTngInverse(ln, damp) {
    // The mirror angle along the line. Resulting equation goes through end
    // line coord.
    var line_mid = ln.midpoint();
    var tng_crss = solveEquations(ln.coord1.tng_eq, ln.inverse(line_mid));
    if (damp) {
        var midln = line(line_mid, tng_crss);
        var midvec = midln.vector()
        midvec = vector( (midvec.x / damp), (midvec.y / damp) );
        tng_crss = line_mid.addVector(midvec);
    }
    var tng_ln = line(tng_crss, ln.coord2);
    return tng_ln.eq();

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
    return [
        ((-1.0 * quadEq.fac1) + Math.sqrt(p1)) / p2,
        ((-1.0 * quadEq.fac1) - Math.sqrt(p1)) / p2
    ];
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
function curvePath(mrkrs, init_sp) {
    var crv_path = {};
    crv_path.crds = [];
    crv_path.lines = [];
    crv_path.curves = [];

    var percnt_xtr = 0.0;
    var req_seg_len_int = 0.0;

    for (var i = 0; i < (mrkrs.length - 1); i++) {
        // If change in direction is the same.
        // Establish the two tangent equations for this and next point.
        // Start by getting this and the next line.
        var this_line = line(mrkrs[i], mrkrs[i+1]);
        this_line.ln_eq = this_line.eq();
        var next_line;
        if (i+2 < mrkrs.length) {
            // I.e i+1 is not the end point.
            var next_line = line(mrkrs[i+1], mrkrs[i+2])
            next_line.ln_eq = next_line.eq();
        }
        else {
            next_line = null;
        }
        if (next_line) {
            // Not end of path

            // If next coord is a normal (given) coord.
            if (!mrkrs[i+1].dir_switch) {

                // If this and next lines are straight
                if (this_line.ln_eq.grad == next_line.ln_eq.grad) {
                    if (mrkrs[i].tng_eq) {
                        // Mid path straight line
                        if (mrkrs[i].tng_eq.grad == this_line.ln_eq.grad) {
                            // This tangent straight with line
                            mrkrs[i+1].tng_eq = mrkrs[i].tng_eq;
                            mrkrs[i+1].dir_switch = true;
                        }
                        else {
                            // This tangent at angle
                            mrkrs[i+1].tng_eq = calcTngInverse(
                                this_line,
                                str_ln_damp_val
                            );
                            mrkrs[i+1].dir_switch = true;
                        }
                    }
                    else {
                        // Start of path straight line
                        mrkrs[i].tng_eq = this_line.ln_eq;
                        mrkrs[i].dir_switch = true;
                        mrkrs[i+1].tng_eq = this_line.ln_eq;
                        mrkrs[i+1].dir_switch = true;
                    }
                }
                // If this and next lines are angled.
                else {
                    mrkrs[i+1].tng_eq = calcTangent(this_line, next_line);
                    // Establish the direction change of lines, lines are assigned a
                    // clockwise = true or false attribute.
                    mrkrs[i+1].clockwise = isClockwise(this_line, next_line);
                }
            }

            if (!mrkrs[i].tng_eq) {
                // Start of path non-straight path
                var this_line_mid = this_line.midpoint();
                mrkrs[i].tng_eq = this_line.inverse(this_line_mid);
                mrkrs[i].clockwise = mrkrs[i+1].clockwise;
            }
            else {
                // Mid path
                if ((!mrkrs[i].dir_switch && !mrkrs[i+1].dir_switch) &&
                    mrkrs[i].clockwise != mrkrs[i+1].clockwise) {
                    // If change in direction changes.
                    // Curve between the two mrkrs must be split into two with
                    // Mid tangent line being the mean acute angle of this and
                    // next tangents and placed at the mid point.
                    var xcrd = this_line.midpoint();


                    var next_quad_crd = solveEquations(mrkrs[i].tng_eq, mrkrs[i+1].tng_eq);
                    var next_quad_crv = curvedLine(mrkrs[i+1], mrkrs[i+2], next_quad_crd);
                    var full_quad_len = next_quad_crv.length() + quad_len;
                    var secs = mrkrs[i+2].t - mrkrs[i].t;
                    this_line.a = calcAcceleration(mrkrs[i].spd, full_quad_len, secs);

                    mrkrs[i+1].spd = calcFinalSp(mrkrs[i].spd, this_line.a, secs);

                    var secs = mrkrs[i+1].t - mrkrs[i].t;
                    var line_acc;
                    if (i == 0) {
                        if (!init_sp) {
                            line_acc = 0.0;
                        }
                        else {
                            line_acc = calcAcceleration(init_sp, this_line.length(), secs);
                        }
                    }
                    else {
                        line_acc = calcAcceleration(mrkrs[i].spd, this_line.length(), secs);
                    }
                    var half_len = this_line.length() / 2.0;
                    // d = vit + 1/2at^2
                    var t_sols = quadEq(
                        (line_acc * 0.5),
                        mrkrs[i].spd,
                        (-1.0 * half_len)).calcX(0.0);
                    if (t_sols[0] > 0.0 && t_sols[1] > 0.0) {
                        if (mrkrs[i].t + t_sols[0] < mrkrs[i+1].t) {
                            xcrd.t = mrkrs[i].t + t_sols[0];
                        }
                        else {
                            xcrd.t = mrkrs[i].t + t_sols[1];
                        }
                    }
                    else {
                        if (t_sols[0] > 0.0) {
                            xcrd.t = mrkrs[i].t + t_sols[0];
                        }
                        else {
                            // It is assumed this is positive
                            xcrd.t = mrkrs[i].t + t_sols[1];
                        }
                    }

                    // Split the line into two sections. Take the midpoint of
                    // each line and calculate where adjecent line at midpoint
                    // meets the tangent equation of its neighbouring point.
                    // These two meeting points (from each section) give the
                    // line with the required gradient for the new tng_eq at
                    // the switch point.
                    var sec1mid = coordsMidPoint(mrkrs[i], xcrd);
                    var sec2mid = coordsMidPoint(xcrd, mrkrs[i+1]);
                    var sec1tng = this_line.inverse(sec1mid);
                    var sec2tng = this_line.inverse(sec2mid);
                    var tng_ln_srt = solveEquations(mrkrs[i].tng_eq, sec1tng);
                    var tng_ln_end = solveEquations(mrkrs[i+1].tng_eq, sec2tng);
                    var pre_tng_ln = line(tng_ln_srt, tng_ln_end);
                    var xcrd_tng = moveEq(pre_tng_ln.eq(), xcrd);
                    //var xcrd_tng = pre_tng_ln.eq();

                    xcrd.tng_eq = xcrd_tng;
                    xcrd.dir_switch = true;

                    // Add the extra coord to the path and continue in loop.
                    new_mrkrs = [];
                    for (var k = 0; k < mrkrs.length; k++) {
                        new_mrkrs.push(mrkrs[k]);
                        if (k == i) {
                            new_mrkrs.push(xcrd);
                        }
                    }
                    mrkrs = new_mrkrs;
                    i-=1;
                    continue;
                }
            }
        }
        else {
            // End of path
            var this_line_mid = this_line.midpoint();
            mrkrs[i+1].tng_eq = this_line.inverse(this_line_mid);
            mrkrs[i+1].clockwise = mrkrs[i].clockwise;
        }

        if (!mrkrs[i].tng_eq) {
            // Only two points
            var this_quad_crd = this_line.midpoint();
        }
        else {
            if (mrkrs[i].tng_eq.calcY(mrkrs[i+1].x) == mrkrs[i+1].y ||
                mrkrs[i].tng_eq.calcX(mrkrs[i+1].y) == mrkrs[i+1].x) {
                var this_quad_crd = this_line.midpoint();
                mrkrs[i+1].tng_eq = this_line.ln_eq;
            }
            else {
                var this_quad_crd = solveEquations(mrkrs[i].tng_eq, mrkrs[i+1].tng_eq);
            }
        }
        var quad_crv = curvedLine(mrkrs[i], mrkrs[i+1], this_quad_crd);
        var quad_len = quad_crv.length();
        if (!quad_len) {
            // Quad curve is straight line
            var quad_len = this_line.length();
        }

        if (mrkrs[i+1].dir_switch) {
            // Then mrkrs[i+1] has no t
            // work out full curve.
            var next_quad_crd = solveEquations(mrkrs[i+1].tng_eq, mrkrs[i+2].tng_eq);
            var next_quad_crv = curvedLine(mrkrs[i+1], mrkrs[i+2], next_quad_crd);
            var full_quad_len = next_quad_crv.length() + quad_len;
            var secs = mrkrs[i+2].t - mrkrs[i].t;
            this_line.a = calcAcceleration(mrkrs[i].spd, full_quad_len, secs);

            mrkrs[i+1].spd = calcFinalSp(mrkrs[i].spd, this_line.a, secs);
        }
        else {
            // Calculate acceleration value for this_line
            var secs = mrkrs[i+1].t - mrkrs[i].t;
            if (i == 0) {
                if (!init_sp) {
                    this_line.a = 0.0;
                    mrkrs[i+1].spd = quad_len / secs;
                }
                else {
                    this_line.a = calcAcceleration(init_sp, quad_len, secs);
                    mrkrs[i+1].spd = calcFinalSp(init_sp, this_line.a, secs);
                }
            }
            else {
                this_line.a = calcAcceleration(mrkrs[i].spd, quad_len, secs);
                mrkrs[i+1].spd = calcFinalSp(mrkrs[i].spd, this_line.a, secs);
            }
        }











        // t_step can be thought of as a percentage value.
        var t_step = Number((req_seg_len / quad_len).toFixed(8));
        if (req_seg_len_int > 0.0) {
            // The First point is not at mrkrs[i]
            // Initial t value.
            var t_val = t_step * percnt_xtr;
            var init_this_crd = quad_crv.calcCrd(t_val);

            var act_seg_len = line(mrkrs[i], init_this_crd).length();
            var t_adj_val = req_seg_len_int / act_seg_len;
            var adj_t_val = t_val * t_adj_val;
            var this_crd = quad_crv.calcCrd(adj_t_val);

            var seg_len = line(mrkrs[i], this_crd).length();
            if (this_line.a != 0.0) {
                var secs_sols = quadEq(
                    (this_line.a * 0.5),
                    mrkrs[i].spd,
                    (-1.0 * seg_len)).calcX(0.0);
                if (secs_sols[0] > 0.0) {
                    var seg_t = secs_sols[0];
                }
                else {
                    // It is assumed this is positive
                    var seg_t = secs_sols[1];
                }
                //console.log(seg_t);
                this_crd.spd = mrkrs[i].spd + (this_line.a * seg_t);
            }
            else {
                this_crd.spd = mrkrs[i].spd;
            }
        }
        else {
            var adj_t_val = 0.0;
            var this_crd = mrkrs[i]
            if (!init_sp) {
                this_crd.spd = mrkrs[i+1].spd;
            }
            else {
                this_crd.spd = init_sp;
            }
        }
        crv_path.crds.push(this_crd);
        var prev_crd = this_crd;
        var prev_t = adj_t_val;
        adj_t_val += t_step;
        for (var t=adj_t_val; t <= (1.0+t_step); t+=t_step) {
            var init_this_crd = quad_crv.calcCrd(t);
            var act_seg_len = line(prev_crd, init_this_crd).length();
            var t_adj_val = req_seg_len / act_seg_len;
            t = prev_t + ((t - prev_t) * t_adj_val);

            if (t <= 1.0) {
                var this_crd = quad_crv.calcCrd(t);

                var seg_len = line(prev_crd, this_crd).length();
                if (this_line.a != 0.0) {
                    var secs_sols = quadEq(
                        (this_line.a * 0.5),
                        prev_crd.spd,
                        (-1.0 * seg_len)).calcX(0.0);
                    if (secs_sols[0] > 0.0) {
                        var seg_t = secs_sols[0];
                    }
                    else {
                        // It is assumed this is positive
                        var seg_t = secs_sols[1];
                    }
                    this_crd.spd = prev_crd.spd + (this_line.a * seg_t);
                }
                else {
                    this_crd.spd = mrkrs[i].spd;
                }

                crv_path.crds.push(this_crd);
                prev_crd = this_crd;
                prev_t = t;
            }
            else {
                var xtra_end_len = line(prev_crd, mrkrs[i+1]).length();
                req_seg_len_int = req_seg_len - xtra_end_len;
            }
        }
        percnt_xtr = Number(((t - 1.0) / t_step).toFixed(8));
    }
    return crv_path.crds;
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
            return Infinity;
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

function calcAcceleration(vi, d, t) {
    return (2 * (d - (vi * t))) / Math.pow(t, 2);
}
function calcFinalSp(vi, a, t) {
    return vi + (a * t);
}

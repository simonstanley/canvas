/*
 * CURVED PATH
 */
function curvePath(mrkrs, init_sp) {
    if (mrkrs.length == 1) {
        return mrkrs[0];
    }
    if (mrkrs.length == 2) {
        return SingleStrLinePath(mrkr[0], mrkr[1], init_sp);
    }
    if (mrkrs.length >= 3) {
        return quadLinePath(mrkrs, init_sp);
    }
}

function SingleStrLinePath(strt_crd, end_crd, init_sp) {
    var str_path = {};

    var ln = line(strt_crd, end_crd);
    ln.len = ln.length();
    var secs = ln.coord2.t - ln.coord1.t;
    if (typeof init_sp != 'undefined') {
        ln.coord1.spd = init_sp;
        ln.a = calcAcceleration(ln.coord1.spd, ln.len, secs);
        ln.coord2.spd = calcFinalSp(ln.coord1.spd, ln.a, secs);
    }
    else {
        ln.a = 0.0;
        ln.coord1.spd = ln.len / secs;
        ln.coord2.spd = ln.coord1.spd;
    }

    str_path.markers = [ln.coord1, ln.coord2];
    str_path.line = ln;
    str_path.coords = calcPathCoords(ln);
    return str_path
}

function quadLinePath(mrkrs, init_sp) {
    var crv_path = {};
    crv_path.markers = [];
    crv_path.coords = [];
    crv_path.lines = [];
    crv_path.curves = [];

    for (var i = 0; i < (mrkrs.length - 1); i++) {
        /*
         / Work through the markers in pairs to be able to gather all required
         / information.
         /
         / Each marker needs:
         / - tng_eq     - The line tangent equation to calculate the quad_crds
         / - clockwise  - Given by true or false representing the direction of
         /                the curve and hence whether theere is a change.
         / - dir_switch - Given by true or false, this true for markers that
         /                change the direction.
        */
        var mrkr0 = mrkrs[i];
        var mrkr1 = mrkrs[i+1]; // Always true because i < (mrkrs.length - 1)
        var mrkr2;
        var line0 = line(mrkr0, mrkr1);
        var line1;
        var curv0;

        if (mrkrs[i+2]) {
            // line0 is not the last line.
            mrkr2 = mrkrs[i+2];
            line1 = line(mrkr1, mrkr2);
            if (i == 0) {
                // line0 is the first line.
                // The first line is never a switch in direction as is has no
                // intial direction.

                // We want the first quad_crd to be centred between the two
                // first markers, therefore set the first marker's (mrkro)
                // tng_eq to be perpendicular to line0 at its midpoint so where
                // this and the second marker's (mrkr1) tng_eq meet is our
                // quad_crd.
                var line0_mid = line0.midpoint();
                mrkr0.tng_eq = line0.inverse(line0_mid);
                //mrkr0.clockwise = mrkr1.clockwise;
                mrkr0.dir_switch = false;
            }

            if (!mrkr1.dir_switch) {
                // If next marker is a normal (given) marker there are two
                // cases that can be. This line and the next are in line with
                // each other (straight) or at an angle. We need this
                // information to correctly decide what the tangent equation
                // for mrkr1 should be.

                // If this and next line are straight.
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




            mrkr1.clockwise = isClockwise(line0, line1);


        }
        else {
            // line0 is the last line.

            // We want the last quad_crd to be centred between the two last
            // markers, therefore set the last marker's (mrkr1) tng_eq to be
            // perpendicular to line0 at its midpoint so where this and the
            // penultimate marker's (mrkr0) tng_eq meet is our quad_crd.
            var line0_mid = line0.midpoint();
            mrkr1.tng_eq = line0.inverse(line0_mid);
            mrkr1.clockwise = mrkr0.clockwise;
            mrkr1.dir_switch = false;

            crv_path.markers.push(mrkr1);
        }
    }
}

function calcPathCoords(ln) {
    var crds = [];
    var this_crd = ln.coord1;
    crds.push(this_crd);
    var prev_crd = this_crd;

    var num_steps = Number((ln.len / req_seg_len).toFixed(rnd_prc));
    var step_x = (ln.coord2.x - ln.coord1.x) / num_steps;
    var step_y = (ln.coord2.y - ln.coord1.y) / num_steps;
    var step_vec = vector(step_x, step_y);

    for (var i=0; i<=num_steps; i+=1) {
        var this_crd = prev_crd.addVector(step_vec);

        if (ln.a != 0.0) {
            var secs_sols = quadEq(
                (ln.a * 0.5),
                prev_crd.spd,
                (-1.0 * req_seg_len)).calcX(0.0);
            if (secs_sols[0] > 0.0) {
                var seg_t = secs_sols[0];
            }
            else {
                // It is assumed this is positive
                var seg_t = secs_sols[1];
            }
            this_crd.spd = prev_crd.spd + (ln.a * seg_t);
        }
        else {
            this_crd.spd = prev_crd.spd;
        }

        crds.push(this_crd);
        prev_crd = this_crd;
    }
    return crds;
}

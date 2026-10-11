use crate::scene::GN;

pub struct Solver {
    pub pre_re: Vec<f32>,
    pub pre_im: Vec<f32>,
    pub t: f32,
}

impl Solver {
    pub fn new() -> Solver {
        Solver { pre_re: Vec::new(), pre_im: Vec::new(), t: 0.0 }
    }
}

/// Leapfrog paraxial wave step over refractive index n with absorbing mask.
/// psi_{n+1} = psi_{n-1} + 2*cdt*i*lap(psi_n), then phase/absorb/sponge kicks.
pub fn wave_step(
    re: &mut [f32],
    im: &mut [f32],
    s: &mut Solver,
    n: &[f32],
    mask: &[f32],
    w: usize,
    h: usize,
    omega: f32,
) {
    let ncells = w * h;
    if s.pre_re.len() != ncells {
        s.pre_re = re.to_vec();
        s.pre_im = im.to_vec();
    }
    let cdt = 0.10f32;
    let mut new_re = re.to_vec();
    let mut new_im = im.to_vec();
    for y in 0..h {
        for x in 0..w {
            let i = y * w + x;
            let xm = x.saturating_sub(1);
            let xp = (x + 1).min(w - 1);
            let ym = y.saturating_sub(1) * w;
            let yp = (y + 1).min(h - 1) * w;
            let lr = re[y * w + xm] + re[y * w + xp] + re[ym + x] + re[yp + x] - 4.0 * re[i];
            let li = im[y * w + xm] + im[y * w + xp] + im[ym + x] + im[yp + x] - 4.0 * im[i];
            let mut nr = s.pre_re[i] - 2.0 * cdt * li;
            let mut ni = s.pre_im[i] + 2.0 * cdt * lr;
            let gx = ((x * GN) / w).min(GN - 1);
            let gy = ((y * GN) / h).min(GN - 1);
            let gi = gy * GN + gx;
            let phi = omega * (n[gi] - 1.0);
            let cf = phi.cos();
            let sf = phi.sin();
            let rr = nr * cf - ni * sf;
            let ii = nr * sf + ni * cf;
            nr = rr;
            ni = ii;
            if mask[gi] > 0.5 {
                nr *= 0.55;
                ni *= 0.55;
            }
            let bx = x.min(w - 1 - x);
            let by = y.min(h - 1 - y);
            let b = bx.min(by);
            if b < 4 {
                let f = 0.88 + 0.03 * b as f32;
                nr *= f;
                ni *= f;
            }
            if nr > 3.0 { nr = 3.0; } else if nr < -3.0 { nr = -3.0; }
            if ni > 3.0 { ni = 3.0; } else if ni < -3.0 { ni = -3.0; }
            new_re[i] = nr;
            new_im[i] = ni;
        }
    }
    let dr = 0.35f32;
    let cr = (omega * s.t).cos() * dr;
    let ci = (omega * s.t).sin() * dr;
    for y in 0..h {
        let i = y * w + 1;
        new_re[i] += cr;
        new_im[i] += ci;
    }
    s.pre_re.copy_from_slice(re);
    s.pre_im.copy_from_slice(im);
    re.copy_from_slice(&new_re);
    im.copy_from_slice(&new_im);
    s.t += 1.0;
}

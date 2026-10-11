use crate::scene::GN;

pub struct Solver {
    pub rev: bool,
    pub drive: bool,
    pub sponge: bool,
    pub pre_re: Vec<f32>,
    pub pre_im: Vec<f32>,
    pub t: f32,
    scratch_re: Vec<f32>,
    scratch_im: Vec<f32>,
}

impl Solver {
    pub fn new() -> Solver {
        Solver { drive: true, rev: false, sponge: true, pre_re: Vec::new(), pre_im: Vec::new(), t: 0.0, scratch_re: Vec::new(), scratch_im: Vec::new() }
    }
}

/// Generic leapfrog paraxial step over any shape; drive on face coord0==1; sponge at edges.
pub fn leapfrog(
    re: &mut [f32],
    im: &mut [f32],
    pre: &mut Vec<f32>,
    pim: &mut Vec<f32>,
    shape: &[usize],
    omega: f32,
    t: f32,
    cdt: f32,
    nk: &[f32],
    mk: &[f32],
    gn: usize,
) {
    let n = re.len();
    if pre.len() != n {
        pre.resize(n, 0.0);
        pim.resize(n, 0.0);
    }
    let nd = shape.len();
    let mut strides = vec![1usize; nd];
    for k in (0..nd - 1).rev() {
        strides[k] = strides[k + 1] * shape[k + 1];
    }
    let mut nr = re.to_vec();
    let mut ni = im.to_vec();
    for i in 0..n {
        let mut lr = 0.0f32;
        let mut li = 0.0f32;
        let mut rem = i;
        let mut edge = false;
        for k in 0..nd {
            let c = rem / strides[k];
            rem %= strides[k];
            if c == 0 || c == shape[k] - 1 {
                edge = true;
            }
            if c > 0 {
                lr += re[i - strides[k]] - re[i];
                li += im[i - strides[k]] - im[i];
            }
            if c < shape[k] - 1 {
                lr += re[i + strides[k]] - re[i];
                li += im[i + strides[k]] - im[i];
            }
        }
        let mut a = pre[i] - 2.0 * cdt * li;
        let mut b = pim[i] + 2.0 * cdt * lr;
        if !nk.is_empty() && gn > 0 {
            let mut rem2 = i;
            let mut gi = 0usize;
            let mut mul = 1usize;
            for k in 0..nd {
                let c = rem2 / strides[k];
                rem2 %= strides[k];
                let gc = ((c * gn) / shape[k]).min(gn - 1);
                gi += gc * mul;
                mul *= gn;
            }
            let phi = omega * (nk[gi] - 1.0);
            let cf = phi.cos();
            let sf = phi.sin();
            let rr = a * cf + b * sf;
            let ii = -a * sf + b * cf;
            a = rr;
            b = ii;
            if mk[gi] > 0.5 {
                a *= 0.55;
                b *= 0.55;
            }
        }
        if edge {
            a *= 0.9;
            b *= 0.9;
        }
        nr[i] = a;
        ni[i] = b;
    }
    let s0 = strides[0];
    let c = (omega * t).cos() * 0.3;
    let s = -(omega * t).sin() * 0.3;
    for i in 0..n {
        if (i / s0) % shape[0] == 1 {
            nr[i] += c;
            ni[i] += s;
        }
    }
    pre.copy_from_slice(re);
    pim.copy_from_slice(im);
    re.copy_from_slice(&nr);
    im.copy_from_slice(&ni);
}

/// 2D field step with refractive phase kick, mask absorption, sponge (legacy path).
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
    if s.pre_re.len() != ncells || s.scratch_re.len() != ncells {
        s.pre_re = re.to_vec();
        s.pre_im = im.to_vec();
        s.scratch_re = re.to_vec();
        s.scratch_im = im.to_vec();
    }
    let cdt = 0.10f32;
    let nr = &mut s.scratch_re;
    let ni = &mut s.scratch_im;
    let (sr, si): (&[f32], &[f32]) = if s.rev { (&s.pre_re, &s.pre_im) } else { (re, im) };
    for y in 0..h {
        for x in 0..w {
            let i = y * w + x;
            let xm = x.saturating_sub(1);
            let xp = (x + 1).min(w - 1);
            let ym = y.saturating_sub(1) * w;
            let yp = (y + 1).min(h - 1) * w;
            let lr = sr[y * w + xm] + sr[y * w + xp] + sr[ym + x] + sr[yp + x] - 4.0 * sr[i];
            let li = si[y * w + xm] + si[y * w + xp] + si[ym + x] + si[yp + x] - 4.0 * si[i];
            let (mut a, mut b) = if s.rev {
                (re[i] + 2.0 * cdt * li, im[i] - 2.0 * cdt * lr)
            } else {
                (s.pre_re[i] - 2.0 * cdt * li, s.pre_im[i] + 2.0 * cdt * lr)
            };
            let gx = ((x * GN) / w).min(GN - 1);
            let gy = ((y * GN) / h).min(GN - 1);
            let gi = gy * GN + gx;
            if !s.rev {
                let phi = omega * (n[gi] - 1.0);
                let cf = phi.cos();
                let sf = phi.sin();
                let rr = a * cf + b * sf;
                let ii = -a * sf + b * cf;
                a = rr;
                b = ii;
                if mask[gi] > 0.5 {
                    a *= 0.55;
                    b *= 0.55;
                }
            }
            let bx = x.min(w - 1 - x);
            let by = y.min(h - 1 - y);
            let bd = bx.min(by);
            let band = (w / 24).max(4);
            if bd < band && s.sponge {
                let f = 0.86 + 0.14 * (bd as f32 / band as f32);
                a *= f;
                b *= f;
            }
            nr[i] = a.clamp(-3.0, 3.0);
            ni[i] = b.clamp(-3.0, 3.0);
        }
    }
    if s.drive {
        let dr = 0.35f32;
        let cr0 = (omega * s.t).cos() * dr;
        let ci0 = -(omega * s.t).sin() * dr;
        for y in 0..h {
            let yy = (y as f32 + 0.5) / h as f32 - 0.5;
            let env = (-(yy * yy) / (2.0 * 0.18 * 0.18)).exp();
            let i = y * w + 1;
            nr[i] += cr0 * env;
            ni[i] += ci0 * env;
        }
    }
    if s.rev {
        let old_pre_re = s.pre_re.clone();
        let old_pre_im = s.pre_im.clone();
        s.pre_re.copy_from_slice(nr);
        s.pre_im.copy_from_slice(ni);
        re.copy_from_slice(&old_pre_re);
        im.copy_from_slice(&old_pre_im);
    } else {
        s.pre_re.copy_from_slice(re);
        s.pre_im.copy_from_slice(im);
        re.copy_from_slice(nr);
        im.copy_from_slice(ni);
    }
    s.t += 1.0;
}






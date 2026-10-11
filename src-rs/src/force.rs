use crate::scene::GN;

pub const MAX_SOURCES: usize = 4;
pub const MAX_TRAILS: usize = 1024;
pub const V_MAX: f32 = 0.02;

#[repr(C)]
#[derive(Copy, Clone, Debug, Default)]
pub struct Trail {
    pub x: f32,
    pub y: f32,
    pub hue: u32,
    pub age: f32,
}

#[repr(C)]
#[derive(Copy, Clone, Debug)]
pub struct Source {
    pub x: f32,
    pub y: f32,
    pub strength: f32,
    pub kind: u32,
}

impl Default for Source {
    fn default() -> Self {
        Source { x: 0.5, y: 0.5, strength: 0.0, kind: 0 }
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct Particle {
    pub x: f32,
    pub y: f32,
    pub vx: f32,
    pub vy: f32,
    pub alive: bool,
    pub hue: u32,
}

#[derive(Clone, Copy, Debug)]
pub struct Registry {
    pub w: [f32; 4],
    pub on: [bool; 4],
}

impl Default for Registry {
    fn default() -> Self {
        Registry { w: [1.0, 1.0, 1.0, 1.0], on: [true, true, false, true] }
    }
}

pub const HUES: [[f32; 3]; 4] = [
    [0.1, 0.9, 0.9],
    [1.0, 0.6, 0.1],
    [0.9, 0.2, 0.8],
    [0.6, 0.6, 0.65],
];

pub fn grad_phase(re: &[f32], im: &[f32], w: usize, h: usize, x: usize, y: usize) -> [f32; 2] {
    let i = y * w + x;
    let xm = x.saturating_sub(1);
    let xp = (x + 1).min(w - 1);
    let ym = y.saturating_sub(1);
    let yp = (y + 1).min(h - 1);
    let rho = re[i] * re[i] + im[i] * im[i];
    if rho < 1e-9 {
        return [0.0, 0.0];
    }
    let drx = (re[y * w + xp] - re[y * w + xm]) * 0.5;
    let dix = (im[y * w + xp] - im[y * w + xm]) * 0.5;
    let dry = (re[yp * w + x] - re[ym * w + x]) * 0.5;
    let diy = (im[yp * w + x] - im[ym * w + x]) * 0.5;
    [
        (re[i] * dix - im[i] * drx) / rho,
        (re[i] * diy - im[i] * dry) / rho,
    ]
}

/// Returns (net force, dominance index) for a particle at (x, y) in uv units.
pub fn force_at(
    x: f32,
    y: f32,
    re: &[f32],
    im: &[f32],
    w: usize,
    h: usize,
    mask: &[f32],
    sources: &[Source],
    reg: &Registry,
    custom_mag: f32,
    prog: Option<&[crate::expr::Op]>,
) -> ([f32; 2], u32) {
    let mut f = [[0.0f32; 2]; 4];
    if reg.on[0] {
        let ix = ((x * w as f32) as usize).min(w - 1);
        let iy = ((y * h as f32) as usize).min(h - 1);
        let g = grad_phase(re, im, w, h, ix, iy);
        f[0] = [g[0] * 0.006, g[1] * 0.006];
    }
    if reg.on[1] || reg.on[2] {
        for s in sources {
            if s.strength.abs() < 1e-6 {
                continue;
            }
            let dx = s.x - x;
            let dy = s.y - y;
            let d2 = dx * dx + dy * dy + 1e-4;
            let inv = 1.0 / (d2 * d2.sqrt());
            if s.kind == 0 && reg.on[1] {
                let g = 0.0015 * s.strength * inv;
                f[1][0] += dx * g;
                f[1][1] += dy * g;
            }
            if s.kind == 1 && reg.on[2] {
                let g = -0.0015 * s.strength * inv;
                f[2][0] += dx * g;
                f[2][1] += dy * g;
            }
        }
    }
    if reg.on[3] {
        let gx = ((x * GN as f32) as usize).min(GN - 1);
        let gy = ((y * GN as f32) as usize).min(GN - 1);
        let xm = gx.saturating_sub(1);
        let xp = (gx + 1).min(GN - 1);
        let ym = gy.saturating_sub(1);
        let yp = (gy + 1).min(GN - 1);
        let mx = (mask[gy * GN + xp] - mask[gy * GN + xm]) * 0.5;
        let my = (mask[yp * GN + gx] - mask[ym * GN + gx]) * 0.5;
        f[3] = [-mx * 0.004, -my * 0.004];
    }
    let mut net = [0.0f32; 2];
    let mut dom = 0u32;
    let mut best = -1.0f32;
    for i in 0..4 {
        let wi = if reg.on[i] { reg.w[i] } else { 0.0 };
        net[0] += wi * f[i][0];
        net[1] += wi * f[i][1];
        let m = (f[i][0] * f[i][0] + f[i][1] * f[i][1]).sqrt() * wi;
        if m > best {
            best = m;
            dom = i as u32;
        }
    }
    if let Some(pr) = prog {
        let mut cd = f32::MAX;
        let mut cx = 0.0f32;
        let mut cy = 0.0f32;
        for s in sources {
            let dx = x - s.x;
            let dy = y - s.y;
            let d2 = dx * dx + dy * dy + 1e-4;
            if d2 < cd {
                cd = d2;
                cx = dx;
                cy = dy;
            }
        }
        if cd < f32::MAX {
            let d = cd.sqrt();
            let mag = crate::expr::eval(pr, d) * 0.0005;
            net[0] += cx / d * mag;
            net[1] += cy / d * mag;
        }
    } else if custom_mag.abs() > 1e-9 {
        let mut cd = 0.0f32;
        let mut ci = 0usize;
        for (idx, s) in sources.iter().enumerate() {
            let dx = x - s.x;
            let dy = y - s.y;
            let d2 = dx * dx + dy * dy + 1e-4;
            if ci == 0 || d2 < cd {
                cd = d2;
                ci = idx;
            }
        }
        let s = &sources[ci];
        let dx = x - s.x;
        let dy = y - s.y;
        let d = cd.sqrt();
        let mag = custom_mag * 0.001 / cd;
        net[0] += dx / d * mag;
        net[1] += dy / d * mag;
    }
    (net, dom)
}

pub fn integrate(p: &mut Particle, f: [f32; 2], dt: f32) {
    p.vx += f[0] * dt;
    p.vy += f[1] * dt;
    let sp = (p.vx * p.vx + p.vy * p.vy).sqrt();
    if sp > V_MAX {
        p.vx *= V_MAX / sp;
        p.vy *= V_MAX / sp;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 {
        p.alive = false;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_weights_give_zero_force() {
        let re = vec![1.0f32; 64];
        let im = vec![0.0f32; 64];
        let mask = vec![0.0f32; GN * GN];
        let src = [Source { x: 0.5, y: 0.5, strength: 1.0, kind: 0 }; MAX_SOURCES];
        let reg = Registry { w: [0.0; 4], on: [true; 4] };
        let (f, _) = force_at(0.3, 0.3, &re, &im, 8, 8, &mask, &src, &reg, 0.0, None);
        assert!(f[0].abs() < 1e-9 && f[1].abs() < 1e-9);
    }

    #[test]
    fn gravity_pulls_toward_source() {
        let re = vec![0.0f32; 64];
        let im = vec![0.0f32; 64];
        let mask = vec![0.0f32; GN * GN];
        let src = [Source { x: 0.8, y: 0.5, strength: 1.0, kind: 0 }; MAX_SOURCES];
        let reg = Registry { w: [0.0, 1.0, 0.0, 0.0], on: [false, true, false, false] };
        let (f, dom) = force_at(0.3, 0.5, &re, &im, 8, 8, &mask, &src, &reg, 0.0, None);
        assert!(f[0] > 0.0);
        assert_eq!(dom, 1);
    }

    #[test]
    fn integrator_clamps_speed() {
        let mut p = Particle { x: 0.5, y: 0.5, vx: 0.0, vy: 0.0, alive: true, hue: 0 };
        for _ in 0..500 {
            integrate(&mut p, [10.0, 0.0], 1.0);
        }
        let sp = (p.vx * p.vx + p.vy * p.vy).sqrt();
        assert!(sp <= V_MAX + 1e-6);
    }
}


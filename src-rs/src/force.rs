use crate::expr;

pub const MAX_SOURCES: usize = 6;
pub const MAX_TRAILS: usize = 1024;
pub const V_MAX: f32 = 0.1;
pub const LAW_BRUSH: u8 = 7;

pub const LAW_GUID: u8 = 0;
pub const LAW_GRAV: u8 = 1;
pub const LAW_COUL: u8 = 2;
pub const LAW_BOUND: u8 = 3;
pub const LAW_VORTEX: u8 = 4;
pub const LAW_CUSTOM: u8 = 5;
pub const LAW_QP: u8 = 6;

#[repr(C)]
#[derive(Copy, Clone, Debug, Default)]
pub struct Trail {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub hue: u32,
}

#[repr(C)]
#[derive(Copy, Clone, Debug)]
pub struct Source {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub strength: f32,
    pub kind: u32,
}

impl Default for Source {
    fn default() -> Self {
        Source { x: 0.5, y: 0.5, z: 0.5, strength: 0.0, kind: 0 }
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct Particle {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub vx: f32,
    pub vy: f32,
    pub vz: f32,
    pub alive: bool,
    pub hue: u32,
}

#[derive(Clone, Copy, Debug)]
pub struct Registry {
    pub w: [f32; 4],
    pub on: [bool; 4],
    pub slots: [u8; 4],
}

impl Default for Registry {
    fn default() -> Self {
        Registry { w: [1.0, 1.0, 1.0, 1.0], on: [true, true, false, true], slots: [LAW_GUID, LAW_GRAV, LAW_COUL, LAW_BOUND] }
    }
}

impl Registry {
    pub fn swap_slots(&mut self, i: usize, j: usize) {
        if i < 4 && j < 4 {
            self.slots.swap(i, j);
        }
    }
}

pub const HUES: [[f32; 3]; 5] = [
    [0.1, 0.9, 0.9],
    [1.0, 0.6, 0.1],
    [0.9, 0.2, 0.8],
    [0.6, 0.6, 0.65],
    [1.0, 0.95, 0.7],
];

/// Net force from 4 slots; each slot's law chosen by reg.slots[i].
/// `grad` = guidance gradient (caller-scaled), `maskg` = boundary gradient (caller-scaled).
pub fn net_force(
    pos: [f32; 3],
    grad: [f32; 3],
    maskg: [f32; 3],
    sources: &[Source],
    reg: &Registry,
    custom_mag: f32,
    prog: Option<&[expr::Op]>,
    brush: &[f32],
) -> ([f32; 3], u32) {
    let mut f = [[0.0f32; 3]; 4];
    for slot in 0..4 {
        if !reg.on[slot] {
            continue;
        }
        match reg.slots[slot] {
            LAW_GUID => f[slot] = grad,
            LAW_BOUND => f[slot] = [-maskg[0], -maskg[1], -maskg[2]],
            LAW_GRAV | LAW_COUL => {
                for s in sources {
                    if s.strength.abs() < 1e-6 {
                        continue;
                    }
                    let dx = s.x - pos[0];
                    let dy = s.y - pos[1];
                    let dz = s.z - pos[2];
                    let d2 = dx * dx + dy * dy + dz * dz + 4e-3;
                    let inv = 1.0 / (d2 * d2.sqrt());
                    let sign = if reg.slots[slot] == LAW_GRAV { 1.0 } else { -s.strength.signum() };
                    let g = 0.0015 * s.strength.abs() * sign * inv;
                    f[slot][0] += dx * g;
                    f[slot][1] += dy * g;
                    f[slot][2] += dz * g;
                }
            }
            LAW_BRUSH => {
                if !brush.is_empty() {
                    let gx = (pos[0] * 48.0).clamp(0.0, 47.0);
                    let gy = (pos[1] * 48.0).clamp(0.0, 47.0);
                    let ix = gx as usize;
                    let iy = gy as usize;
                    let i = iy * 48 + ix;
                    f[slot] = [brush[i * 2] * 0.004, brush[i * 2 + 1] * 0.004, 0.0];
                }
            }
            LAW_VORTEX => {
                let mut cd = f32::MAX;
                let mut c = [0.0f32; 3];
                for s in sources {
                    let dx = pos[0] - s.x;
                    let dy = pos[1] - s.y;
                    let dz = pos[2] - s.z;
                    let d2 = dx * dx + dy * dy + dz * dz + 4e-3;
                    if d2 < cd {
                        cd = d2;
                        c = [dx, dy, dz];
                    }
                }
                let d = cd.sqrt();
                f[slot] = [-c[1] / d * 0.002 / cd, c[0] / d * 0.002 / cd, 0.0];
            }
            _ => {
                let mut cd = f32::MAX;
                let mut c = [0.0f32; 3];
                for s in sources {
                    let dx = pos[0] - s.x;
                    let dy = pos[1] - s.y;
                    let dz = pos[2] - s.z;
                    let d2 = dx * dx + dy * dy + dz * dz + 4e-3;
                    if d2 < cd {
                        cd = d2;
                        c = [dx, dy, dz];
                    }
                }
                let d = cd.sqrt();
                let mag = match prog {
                    Some(pr) => expr::eval(pr, d) * 0.0005,
                    None => custom_mag * 0.001 / cd,
                };
                f[slot] = [c[0] / d * mag, c[1] / d * mag, c[2] / d * mag];
            }
        }
    }
    let mut net = [0.0f32; 3];
    let mut dom = 0u32;
    let mut best = -1.0f32;
    for i in 0..4 {
        let wi = if reg.on[i] { reg.w[i] } else { 0.0 };
        net[0] += wi * f[i][0];
        net[1] += wi * f[i][1];
        net[2] += wi * f[i][2];
        let m = (f[i][0] * f[i][0] + f[i][1] * f[i][1] + f[i][2] * f[i][2]).sqrt() * wi;
        if m > best {
            best = m;
            dom = i as u32;
        }
    }
    (net, dom)
}

pub fn integrate(p: &mut Particle, f: [f32; 3], dt: f32) {
    p.vx += f[0] * dt;
    p.vy += f[1] * dt;
    p.vz += f[2] * dt;
    let sp = (p.vx * p.vx + p.vy * p.vy + p.vz * p.vz).sqrt();
    if sp > V_MAX {
        let k = V_MAX / sp;
        p.vx *= k;
        p.vy *= k;
        p.vz *= k;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    if p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z < 0.0 || p.z > 1.0 {
        p.alive = false;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn reg_w(w: [f32; 4]) -> Registry {
        Registry { w, on: [true; 4], slots: [LAW_GUID, LAW_GRAV, LAW_COUL, LAW_BOUND] }
    }

    #[test]
    fn zero_weights_give_zero_force() {
        let src = [Source { x: 0.5, y: 0.5, z: 0.5, strength: 1.0, kind: 0 }; MAX_SOURCES];
        let reg = reg_w([0.0; 4]);
        let (f, _) = net_force([0.3, 0.3, 0.3], [0.1, 0.1, 0.0], [0.0, 0.0, 0.0], &src, &reg, 0.0, None, &[]);
        assert!(f.iter().all(|v| v.abs() < 1e-9));
    }

    #[test]
    fn swap_equal_weights_invariant() {
        let src = [Source { x: 0.8, y: 0.5, z: 0.5, strength: 1.0, kind: 0 }; MAX_SOURCES];
        let mut r1 = reg_w([1.0, 1.0, 1.0, 1.0]);
        r1.on = [true, true, false, false];
        let mut r2 = r1;
        r2.swap_slots(0, 1);
        let g = [0.05, 0.0, 0.0];
        let m = [0.0, 0.0, 0.0];
        let (f1, _) = net_force([0.3, 0.5, 0.5], g, m, &src, &r1, 0.0, None, &[]);
        let (f2, _) = net_force([0.3, 0.5, 0.5], g, m, &src, &r2, 0.0, None, &[]);
        for k in 0..3 {
            assert!((f1[k] - f2[k]).abs() < 1e-6);
        }
    }

    #[test]
    fn gravity_pulls_toward_source() {
        let src = [Source { x: 0.8, y: 0.5, z: 0.5, strength: 1.0, kind: 0 }; MAX_SOURCES];
        let mut reg = reg_w([0.0, 1.0, 0.0, 0.0]);
        reg.on = [false, true, false, false];
        let (f, dom) = net_force([0.3, 0.5, 0.5], [0.0; 3], [0.0; 3], &src, &reg, 0.0, None, &[]);
        assert!(f[0] > 0.0);
        assert_eq!(dom, 1);
    }

    #[test]
    fn integrator_clamps_speed() {
        let mut p = Particle { x: 0.5, y: 0.5, z: 0.5, vx: 0.0, vy: 0.0, vz: 0.0, alive: true, hue: 0 };
        for _ in 0..500 {
            integrate(&mut p, [10.0, 0.0, 0.0], 1.0);
        }
        let sp = (p.vx * p.vx + p.vy * p.vy + p.vz * p.vz).sqrt();
        assert!(sp <= V_MAX + 1e-6);
    }
}




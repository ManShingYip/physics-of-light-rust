use wasm_bindgen::prelude::*;

mod expr;
mod force;
mod scene;
mod solver;

#[wasm_bindgen]
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

pub const MAX_COMMITS: usize = 256;
const VACUUM_EPS: f32 = 1e-6;
const HIST_BINS: usize = 24;

#[repr(C)]
#[derive(Copy, Clone, Debug, Default)]
pub struct Commit {
    pub x: f32,
    pub y: f32,
    pub t: f32,
    pub _pad: f32,
}

struct XorShift64(u64);

impl XorShift64 {
    fn new(seed: u64) -> Self {
        Self(if seed == 0 { 0x9E3779B97F4A7C15 } else { seed })
    }
    #[inline]
    fn next_f32(&mut self) -> f32 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        ((self.0 >> 40) as f32) / 16777216.0
    }
}

#[wasm_bindgen]
pub struct WaveEngine {
    width: u32,
    height: u32,
    time: f32,
    real: Vec<f32>,
    imag: Vec<f32>,
    commits: Vec<Commit>,
    scene: scene::Scene,
    solver: solver::Solver,
    scene_id: u32,
    p_barrier: f32,
    p_sep: f32,
    p_k: f32,
    particles: Vec<force::Particle>,
    trails: Vec<force::Trail>,
    sources: Vec<force::Source>,
    reg: force::Registry,
    custom_mag: f32,
    custom_prog: Option<Vec<expr::Op>>,
    tick: u64,
    force_grid: Vec<f32>,
    lensing: bool,
    dims: DimFields,
    last_obs: f32,
    rays: Vec<force::Particle>,
    rays_on: bool,
    projs: Vec<f32>,
    disp_on: bool,
    chr_re: Vec<f32>,
    chr_im: Vec<f32>,
    chb_re: Vec<f32>,
    chb_im: Vec<f32>,
    sol_r: solver::Solver,
    sol_b: solver::Solver,
    disp_rgb: Vec<f32>,
    re3: Vec<f32>,
    im3: Vec<f32>,
    pre3: Vec<f32>,
    pim3: Vec<f32>,
    scene3: scene::Scene3,
    dim3: bool,
    res3: usize,
    points: Vec<f32>,
    raster: Vec<u8>,
    cam: [f32; 5],
    splats: Vec<f32>,
    batch: bool,
    brush: Vec<f32>,
    avg: Vec<f32>,
}

struct DimFields {
    pub sizes: [usize; 4],
    pub re: [Vec<f32>; 4],
    pub im: [Vec<f32>; 4],
    pub pre: [Vec<f32>; 4],
    pub pim: [Vec<f32>; 4],
    pub t: f32,
}

impl DimFields {
    fn new() -> DimFields {
        let sizes = [128usize, 4096, 13824, 20736];
        DimFields {
            sizes,
            re: [vec![0.0; sizes[0]], vec![0.0; sizes[1]], vec![0.0; sizes[2]], vec![0.0; sizes[3]]],
            im: [vec![0.0; sizes[0]], vec![0.0; sizes[1]], vec![0.0; sizes[2]], vec![0.0; sizes[3]]],
            pre: [vec![0.0; sizes[0]], vec![0.0; sizes[1]], vec![0.0; sizes[2]], vec![0.0; sizes[3]]],
            pim: [vec![0.0; sizes[0]], vec![0.0; sizes[1]], vec![0.0; sizes[2]], vec![0.0; sizes[3]]],
            t: 0.0,
        }
    }
}

fn hist_of_commits(commits: &[Commit], obs: f32) -> [f32; HIST_BINS] {
    let mut h = [0.0f32; HIST_BINS];
    for c in commits {
        if (c.x - obs).abs() < 0.02 {
            let b = ((c.y * HIST_BINS as f32) as usize).min(HIST_BINS - 1);
            h[b] += 1.0;
        }
    }
    h
}

fn hist_of_rho_col(re: &[f32], im: &[f32], w: usize, h: usize, ix: usize) -> [f32; HIST_BINS] {
    let mut out = [0.0f32; HIST_BINS];
    for y in 0..h {
        let rho = re[y * w + ix] * re[y * w + ix] + im[y * w + ix] * im[y * w + ix];
        let b = ((y as f32 / h as f32) * HIST_BINS as f32) as usize;
        out[b.min(HIST_BINS - 1)] += rho;
    }
    out
}

fn count_peaks(h: &[f32; HIST_BINS]) -> u32 {
    let mut mx = 0.0f32;
    for v in h.iter() {
        if *v > mx {
            mx = *v;
        }
    }
    if mx < 1e-6 {
        return 0;
    }
    let mut peaks = 0u32;
    for i in 1..HIST_BINS - 1 {
        if h[i] > 0.25 * mx && h[i] >= h[i - 1] && h[i] > h[i + 1] {
            peaks += 1;
        }
    }
    peaks
}

fn centroid(h: &[f32; HIST_BINS]) -> f32 {
    let mut s = 0.0f32;
    let mut w = 0.0f32;
    for (i, v) in h.iter().enumerate() {
        s += (i as f32 + 0.5) / HIST_BINS as f32 * v;
        w += v;
    }
    if w < 1e-6 {
        0.5
    } else {
        s / w
    }
}

#[wasm_bindgen]
impl WaveEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> WaveEngine {
        let w = width.max(1);
        let h = height.max(1);
        let n = (w as usize) * (h as usize);
        let mut e = WaveEngine {
            width: w,
            height: h,
            time: 0.0,
            real: vec![0.0; n],
            imag: vec![0.0; n],
            commits: Vec::new(),
            scene: scene::preset(5, 0.3, 0.2, 60.0),
            solver: solver::Solver::new(),
            scene_id: 5,
            p_barrier: 0.3,
            p_sep: 0.2,
            p_k: 60.0,
            particles: Vec::new(),
            trails: Vec::new(),
            sources: vec![
                force::Source { x: 0.68, y: 0.32, z: 0.5, strength: 1.0, kind: 0 },
                force::Source::default(),
                force::Source::default(),
                force::Source::default(),
            ],
            reg: force::Registry::default(),
            custom_mag: 0.0,
            custom_prog: None,
            tick: 0,
            force_grid: vec![0.0; 48 * 48 * 10],
            lensing: false,
            dims: DimFields::new(),
            last_obs: 0.5,
            rays: Vec::new(),
            rays_on: false,
            projs: vec![0.0; 96 * 96 * 3],
            disp_on: false,
            chr_re: vec![0.0; 9216],
            chr_im: vec![0.0; 9216],
            chb_re: vec![0.0; 9216],
            chb_im: vec![0.0; 9216],
            sol_r: solver::Solver::new(),
            sol_b: solver::Solver::new(),
            disp_rgb: vec![0.0; n * 6],
            re3: vec![0.0; 32768],
            im3: vec![0.0; 32768],
            pre3: vec![0.0; 32768],
            pim3: vec![0.0; 32768],
            scene3: scene::preset3(5, 0.3, 0.2),
            dim3: false,
            res3: 32,
            points: Vec::new(),
            raster: vec![0u8; 192 * 192 * 4],
            cam: [0.7, 0.5, 1.6, 0.0, 0.0],
            splats: Vec::new(),
            batch: false,
            brush: vec![0.0; 48 * 48 * 2],
            avg: vec![0.0; n],
        };
        e.solver.pre_re = e.real.clone();
        e.solver.pre_im = e.imag.clone();
        e
    }

    pub fn step(&mut self, dt: f32) {
        self.time += dt;
        let omega = 0.10 + self.p_k * 0.0016;
        let mut n = self.scene.n.clone();
        if self.lensing {
            for gy in 0..48 {
                for gx in 0..48 {
                    let u = (gx as f32 + 0.5) / 48.0;
                    let v = (gy as f32 + 0.5) / 48.0;
                    let mut phi = 0.0f32;
                    for s in self.sources.iter() {
                        if s.kind == 0 && s.strength.abs() > 1e-6 {
                            let d2 = (u - s.x) * (u - s.x) + (v - s.y) * (v - s.y) + 0.01;
                            phi += -0.06 * s.strength / d2.sqrt();
                        }
                    }
                    n[gy * 48 + gx] += phi;
                    if n[gy * 48 + gx] < 0.2 {
                        n[gy * 48 + gx] = 0.2;
                    }
                }
            }
        }
        let mask = self.scene.mask.clone();
        let w = self.width as usize;
        let h = self.height as usize;
        for _ in 0..2 {
            solver::wave_step(&mut self.real, &mut self.imag, &mut self.solver, &n, &mask, w, h, omega);
            self.advect_flux();
            if self.disp_on {
                let mut nr = n.clone();
                let mut nb = n.clone();
                for v in nr.iter_mut() {
                    *v = 1.0 + (*v - 1.0) * 0.75;
                }
                for v in nb.iter_mut() {
                    *v = 1.0 + (*v - 1.0) * 1.3;
                }
                solver::wave_step(&mut self.chr_re, &mut self.chr_im, &mut self.sol_r, &nr, &mask, w, h, omega);
                solver::wave_step(&mut self.chb_re, &mut self.chb_im, &mut self.sol_b, &nb, &mask, w, h, omega);
            }
        }
        if self.disp_on && self.tick % 3 == 0 {
            for i in 0..w * h {
                let rr = self.chr_re[i] * self.chr_re[i] + self.chr_im[i] * self.chr_im[i];
                let gg = self.real[i] * self.real[i] + self.imag[i] * self.imag[i];
                let bb = self.chb_re[i] * self.chb_re[i] + self.chb_im[i] * self.chb_im[i];
                self.disp_rgb[i * 3] = rr / (rr + 0.85) * 1.5;
                self.disp_rgb[i * 3 + 1] = gg / (gg + 0.85) * 1.5;
                self.disp_rgb[i * 3 + 2] = bb / (bb + 0.85) * 1.5;
            }
        }
        let shapes: [&[usize]; 4] = [&[128], &[64, 64], &[24, 24, 24], &[12, 12, 12, 12]];
        for di in 0..4 {
            solver::leapfrog(
                &mut self.dims.re[di], &mut self.dims.im[di], &mut self.dims.pre[di], &mut self.dims.pim[di],
                shapes[di], omega, self.dims.t, 0.10, &[], &[], 0,
            );
        }
        for i in 0..(w * h) {
            let rho = self.real[i] * self.real[i] + self.imag[i] * self.imag[i];
            self.avg[i] += 0.05 * (rho - self.avg[i]);
        }
        self.dims.t += 1.0;
        if self.dim3 {
            let r = self.res3;
            let shape3 = [r, r, r];
            let n3 = self.scene3.n.clone();
            let m3 = self.scene3.mask.clone();
            for _ in 0..2 {
                solver::leapfrog(&mut self.re3, &mut self.im3, &mut self.pre3, &mut self.pim3, &shape3, omega, self.solver.t, 0.10, &n3, &m3, 24);
            }
        }
        self.step_force(dt);
        self.step_rays(dt);
    }

    /// Advect guidance particles by discrete flux velocity (equivariant pair).
    pub fn advect_flux(&mut self) {
        if !(self.reg.on.iter().zip(self.reg.slots.iter()).any(|(&o, &s)| o && s == force::LAW_GUID)) {
            return;
        }
        let w = self.width as usize;
        let h = self.height as usize;
        let pr = self.solver.pre_re.clone();
        let pi = self.solver.pre_im.clone();
        for p in self.particles.iter_mut() {
            if !p.alive {
                continue;
            }
            let fx = (p.x * w as f32).clamp(0.0, (w - 1) as f32);
            let fy = (p.y * h as f32).clamp(0.0, (h - 1) as f32);
            let x0 = fx as usize;
            let y0 = fy as usize;
            let x1 = (x0 + 1).min(w - 1);
            let y1 = (y0 + 1).min(h - 1);
            let tx = fx - x0 as f32;
            let ty = fy - y0 as f32;
            let v00 = flux_vel2(&pr, &pi, &self.real, &self.imag, w, h, x0, y0);
            let v10 = flux_vel2(&pr, &pi, &self.real, &self.imag, w, h, x1, y0);
            let v01 = flux_vel2(&pr, &pi, &self.real, &self.imag, w, h, x0, y1);
            let v11 = flux_vel2(&pr, &pi, &self.real, &self.imag, w, h, x1, y1);
            let vx = (v00[0] * (1.0 - tx) + v10[0] * tx) * (1.0 - ty) + (v01[0] * (1.0 - tx) + v11[0] * tx) * ty;
            let vy = (v00[1] * (1.0 - tx) + v10[1] * tx) * (1.0 - ty) + (v01[1] * (1.0 - tx) + v11[1] * tx) * ty;
            p.x += vx / w as f32;
            p.y += vy / h as f32;
            if p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 {
                p.alive = false;
            }
        }
    }

    pub fn step_force(&mut self, dt: f32) {
        self.tick += 1;
        let w = self.width as usize;
        let h = self.height as usize;
        let mask = self.scene.mask.clone();
        let sources = self.sources.clone();
        let reg = self.reg;
        let mut reg2 = reg;
        for i in 0..4 {
            if reg2.slots[i] == force::LAW_GUID {
                reg2.on[i] = false;
            }
        }
        let cm = self.eff_custom();
        let prog = self.custom_prog.clone();
        for p in self.particles.iter_mut() {
            if !p.alive {
                continue;
            }
            let mut dom = 0u32;
            for _sub in 0..2 {
                let (grad, maskg) = if self.dim3 {
                    let r = self.res3;
                    let ix = ((p.x * r as f32) as usize).min(r - 1);
                    let iy = ((p.y * r as f32) as usize).min(r - 1);
                    let iz = ((p.z * r as f32) as usize).min(r - 1);
                    (grad3(&self.re3, &self.im3, r, ix, iy, iz), maskg3(&self.scene3.mask, r, ix, iy, iz))
                } else {
                    let ix = ((p.x * w as f32) as usize).min(w - 1);
                    let iy = ((p.y * h as f32) as usize).min(h - 1);
                    let g = grad2(&self.real, &self.imag, w, h, ix, iy);
                    let mg = maskg2(&mask, (ix * 48) / w, (iy * 48) / h);
                    ([g[0], g[1], 0.0], [mg[0], mg[1], 0.0])
                };
                let grad = [grad[0] * 0.006, grad[1] * 0.006, grad[2] * 0.006];
                let maskg = [maskg[0] * 0.004, maskg[1] * 0.004, maskg[2] * 0.004];
                let (mut f, d) = force::net_force([p.x, p.y, p.z], grad, maskg, &sources, &reg2, cm, prog.as_deref(), &self.brush);
                dom = d;
                for si in 0..4 {
                    if reg.on[si] && reg.slots[si] == force::LAW_QP {
                        let ix2 = ((p.x * w as f32) as usize).min(w - 1);
                        let iy2 = ((p.y * h as f32) as usize).min(h - 1);
                        let qv = qp_force(&self.real, &self.imag, w, h, ix2, iy2);
                        f[0] += reg.w[si] * qv[0] * 0.0008;
                        f[1] += reg.w[si] * qv[1] * 0.0008;
                    }
                }
                force::integrate(p, f, dt * 0.5);
            }
            p.hue = dom;
            if self.tick % 2 == 0 && p.alive {
                self.trails.push(force::Trail { x: p.x, y: p.y, z: p.z, hue: p.hue });
            }
        }        while self.trails.len() > force::MAX_TRAILS {
            self.trails.remove(0);
        }
        self.particles.retain(|p| p.alive);
        if self.tick % 6 == 0 && !self.batch {
            self.compute_force_grid();
        }
    }

    fn eff_custom(&self) -> f32 {
        self.custom_mag
    }

    fn compute_force_grid(&mut self) {
        let w = self.width as usize;
        let h = self.height as usize;
        let mask = self.scene.mask.clone();
        let sources = self.sources.clone();
        let reg = self.reg;
        let cm = self.eff_custom();
        let mut g = vec![0.0f32; 48 * 48 * 10];
        for gy in 0..48 {
            for gx in 0..48 {
                let u = (gx as f32 + 0.5) / 48.0;
                let v = (gy as f32 + 0.5) / 48.0;
                let mut acc = [0.0f32; 2];
                for fi in 0..4 {
                    let saved = reg.on;
                    let mut r2 = reg;
                    for k in 0..4 {
                        r2.on[k] = k == fi && saved[k];
                        r2.w[k] = if k == fi { 1.0 } else { 0.0 };
                    }
                    let g0 = grad2(&self.real, &self.imag, w, h, (u * w as f32) as usize % w, (v * h as f32) as usize % h); let mg0 = maskg2(&mask, (u * 48.0) as usize % 48, (v * 48.0) as usize % 48); let (f, _) = force::net_force([u, v, 0.5], [g0[0] * 0.006, g0[1] * 0.006, 0.0], [mg0[0] * 0.004, mg0[1] * 0.004, 0.0], &sources, &r2, 0.0, None, &self.brush);
                    let o = (gy * 48 + gx) * 10 + fi * 2;
                    g[o] = f[0];
                    g[o + 1] = f[1];
                    acc[0] += reg.w[fi] * f[0] * if saved[fi] { 1.0 } else { 0.0 };
                    acc[1] += reg.w[fi] * f[1] * if saved[fi] { 1.0 } else { 0.0 };
                }
                let g1 = grad2(&self.real, &self.imag, w, h, (u * w as f32) as usize % w, (v * h as f32) as usize % h); let mg1 = maskg2(&mask, (u * 48.0) as usize % 48, (v * 48.0) as usize % 48); let (net, _) = force::net_force([u, v, 0.5], [g1[0] * 0.006, g1[1] * 0.006, 0.0], [mg1[0] * 0.004, mg1[1] * 0.004, 0.0], &sources, &reg, cm, None, &self.brush);
                let o = (gy * 48 + gx) * 10 + 8;
                g[o] = net[0];
                g[o + 1] = net[1];
                let _ = acc;
            }
        }
        self.force_grid = g;
    }

    pub fn force_grid_ptr(&self) -> *const f32 {
        self.force_grid.as_ptr()
    }

    pub fn force_grid_len(&self) -> u32 {
        self.force_grid.len() as u32
    }

    pub fn spawn(&mut self, n: u32, seed: u64) {
        let mut rng = XorShift64::new(seed);
        let w = self.width as usize;
        let h = self.height as usize;
        // |psi|^2-born spread spawn: x uniform, y from that column's CDF.
        // Represents a steady stream in quantum equilibrium (equivariance).
        for _ in 0..n {
            if self.particles.len() >= 256 {
                break;
            }
            let xs = 0.02 + rng.next_f32() * 0.96;
            let ix = ((xs * w as f32) as usize).min(w - 1);
            let mut acc = 0.0f32;
            let mut cdf = [0.0f32; 256];
            let mut m = 0usize;
            while m < h.min(256) {
                let i = m * w + ix;
                acc += self.real[i] * self.real[i] + self.imag[i] * self.imag[i];
                cdf[m] = acc;
                m += 1;
            }
            let y = if acc > 1e-9 {
                let target = rng.next_f32() * acc;
                let mut lo = 0usize;
                let mut hi = m - 1;
                while lo < hi {
                    let mid = (lo + hi) / 2;
                    if cdf[mid] < target {
                        lo = mid + 1;
                    } else {
                        hi = mid;
                    }
                }
                lo as f32 / m as f32
            } else {
                rng.next_f32()
            };
            let jy = (rng.next_f32() - 0.5) / h as f32;
            self.particles.push(force::Particle {
                x: xs,
                y: (y + jy).clamp(0.0, 1.0),
                z: if self.dim3 { rng.next_f32() } else { 0.5 },
                vx: 0.004,
                vy: 0.0,
                vz: 0.0,
                alive: true,
                hue: 0,
            });
        }
    }

    pub fn trails_ptr(&self) -> *const f32 {
        self.trails.as_ptr() as *const f32
    }

    pub fn trails_f32_len(&self) -> u32 {
        (self.trails.len() * 4) as u32
    }

    pub fn trails_len(&self) -> u32 {
        self.trails.len() as u32
    }

    pub fn particles_len(&self) -> u32 {
        self.particles.len() as u32
    }

    /// Kill particles inside mask cells (ballistic/corpuscular absorption).
    pub fn kill_in_mask(&mut self) {
        let mask = self.scene.mask.clone();
        for p in self.particles.iter_mut() {
            let gx = ((p.x * 48.0) as usize).min(47);
            let gy = ((p.y * 48.0) as usize).min(47);
            if mask[gy * 48 + gx] > 0.5 {
                p.alive = false;
            }
        }
        self.particles.retain(|p| p.alive);
    }

    /// Uniform source emission (corpuscular honesty): knows nothing of the field.
    pub fn spawn_uniform(&mut self, n: u32, seed: u64) {
        let mut rng = XorShift64::new(seed);
        for _ in 0..n {
            if self.particles.len() >= 256 {
                break;
            }
            self.particles.push(force::Particle {
                x: 0.02 + rng.next_f32() * 0.96,
                y: rng.next_f32(),
                z: 0.5,
                vx: 0.004,
                vy: 0.0,
                vz: 0.0,
                alive: true,
                hue: 0,
            });
        }
    }

    fn hist_from_trails(&self, obs: f32) -> [f32; HIST_BINS] {
        let mut h = [0.0f32; HIST_BINS];
        for t in self.trails.iter() {
            if (t.x - obs).abs() < 0.02 {
                let b = ((t.y * HIST_BINS as f32) as usize).min(HIST_BINS - 1);
                h[b] += 1.0;
            }
        }
        h
    }

    pub fn set_source(&mut self, i: u32, x: f32, y: f32, strength: f32, kind: u32) {
        let i = (i as usize).min(force::MAX_SOURCES - 1);
        self.sources[i] = force::Source { x, y, z: 0.5, strength, kind };
    }

    pub fn source_x(&self, i: u32) -> f32 {
        self.sources[(i as usize).min(force::MAX_SOURCES - 1)].x
    }

    pub fn source_y(&self, i: u32) -> f32 {
        self.sources[(i as usize).min(force::MAX_SOURCES - 1)].y
    }

    pub fn set_weight(&mut self, i: u32, w: f32) {
        let i = (i as usize).min(3);
        self.reg.w[i] = w.clamp(0.0, 4.0);
    }

    pub fn set_force_on(&mut self, i: u32, on: bool) {
        let i = (i as usize).min(3);
        self.reg.on[i] = on;
    }

    pub fn set_custom(&mut self, mag: f32) {
        self.custom_mag = mag.clamp(-4.0, 4.0);
    }

    pub fn set_custom_expr(&mut self, src: &str) -> bool {
        match expr::parse(src) {
            Ok(prog) => {
                self.custom_prog = Some(prog);
                true
            }
            Err(_) => false,
        }
    }

    pub fn set_lensing(&mut self, on: bool) {
        self.lensing = on;
    }

    pub fn set_disp(&mut self, on: bool) {
        self.disp_on = on;
        self.chr_re.fill(0.0);
        self.chr_im.fill(0.0);
        self.chb_re.fill(0.0);
        self.chb_im.fill(0.0);
        self.sol_r = solver::Solver::new();
        self.sol_b = solver::Solver::new();
    }

    pub fn avg_ptr(&self) -> *const f32 {
        self.avg.as_ptr()
    }

    pub fn avg_len(&self) -> u32 {
        self.avg.len() as u32
    }

    pub fn disp_ptr(&self) -> *const f32 {
        self.disp_rgb.as_ptr()
    }

    pub fn disp_len(&self) -> u32 {
        self.disp_rgb.len() as u32
    }

    pub fn set_batch(&mut self, on: bool) {
        self.batch = on;
    }

    pub fn set_rays(&mut self, on: bool) {
        self.rays_on = on;
        if on && self.rays.is_empty() {
            for i in 0..180 {
                let y = (i as f32 + 0.5) / 180.0;
                self.rays.push(force::Particle { x: 0.01, y, z: 0.5, vx: 0.006, vy: 0.0, vz: 0.0, alive: true, hue: 4 });
            }
        }
        if !on {
            self.rays.clear();
        }
    }

    /// Geometric rays bent by grad(n) (eikonal toy) -> caustics (S-SOLVER-RAY).
    pub fn step_rays(&mut self, dt: f32) {
        if !self.rays_on {
            return;
        }
        let n = self.scene.n.clone();
        for p in self.rays.iter_mut() {
            if !p.alive {
                continue;
            }
            let gx = ((p.x * 48.0) as usize).min(47);
            let gy = ((p.y * 48.0) as usize).min(47);
            let xm = gx.saturating_sub(1);
            let xp = (gx + 1).min(47);
            let ym = gy.saturating_sub(1);
            let yp = (gy + 1).min(47);
            let dnx = (n[gy * 48 + xp] - n[gy * 48 + xm]) * 0.5;
            let dny = (n[yp * 48 + gx] - n[ym * 48 + gx]) * 0.5;
            p.vx += dnx * 0.06 * dt;
            p.vy += dny * 0.06 * dt;
            let sp = (p.vx * p.vx + p.vy * p.vy).sqrt();
            if sp > 0.012 {
                p.vx *= 0.012 / sp;
                p.vy *= 0.012 / sp;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if p.x > 1.0 || p.x < 0.0 || p.y < 0.0 || p.y > 1.0 {
                p.alive = false;
            }
            if self.tick % 2 == 0 && p.alive {
                self.trails.push(force::Trail { x: p.x, y: p.y, z: 0.5, hue: 4 });
            }
        }
        self.rays.retain(|p| p.alive);
        if self.rays_on && self.rays.len() < 40 && self.tick % 60 == 0 {
            for i in 0..60 {
                let y = ((self.tick / 60) as f32 * 0.1 + i as f32 / 60.0) % 1.0;
                self.rays.push(force::Particle { x: 0.01, y, z: 0.5, vx: 0.006, vy: 0.0, vz: 0.0, alive: true, hue: 4 });
            }
        }
    }

    /// On-demand projections (S-PROJ-* + S-GLUE): separable full-step DFT.
    /// slots: [0]=|FFT|2, [1]=Wigner slice, [2]=path density, [3]=glue mismatch.
    pub fn compute_projs(&mut self) {
        let w = self.width as usize;
        let h = self.height as usize;
        let n = w * h;
        let tau = 6.2831853;
        let hann = |i: usize, n: usize| -> f32 {
            if n <= 1 {
                1.0
            } else {
                0.5 - 0.5 * (tau * i as f32 / (n - 1) as f32).cos()
            }
        };
        let mut tr = vec![0.0f32; n];
        let mut ti = vec![0.0f32; n];
        for y in 0..h {
            let wy = hann(y, h);
            for kx in 0..w {
                let mut sr = 0.0f32;
                let mut si = 0.0f32;
                for x in 0..w {
                    let wv = wy * hann(x, w);
                    let pr = self.real[y * w + x] * wv;
                    let pi = self.imag[y * w + x] * wv;
                    let ph = -tau * ((x * kx) as f32 / w as f32);
                    let c = ph.cos();
                    let s2 = ph.sin();
                    sr += pr * c - pi * s2;
                    si += pr * s2 + pi * c;
                }
                tr[y * w + kx] = sr;
                ti[y * w + kx] = si;
            }
        }
        let mut kr = vec![0.0f32; n];
        let mut ki = vec![0.0f32; n];
        for ky in 0..h {
            for kx in 0..w {
                let mut sr = 0.0f32;
                let mut si = 0.0f32;
                for y in 0..h {
                    let ph = -tau * ((y * ky) as f32 / h as f32);
                    let c = ph.cos();
                    let s2 = ph.sin();
                    sr += tr[y * w + kx] * c - ti[y * w + kx] * s2;
                    si += tr[y * w + kx] * s2 + ti[y * w + kx] * c;
                }
                kr[ky * w + kx] = sr;
                ki[ky * w + kx] = si;
            }
        }
        let mut kproj = vec![0.0f32; n];
        for i in 0..n {
            kproj[i] = (kr[i] * kr[i] + ki[i] * ki[i]) / (n as f32 * n as f32);
        }
        let mut kmax = 1e-9f32;
        for v in kproj.iter() {
            if *v > kmax {
                kmax = *v;
            }
        }
        for v in kproj.iter_mut() {
            *v /= kmax;
        }
        // S-GLUE: low-pass reconstruction residual = high-k structure (edges/fringes/obstructions)
        let kcut = (w / 8).max(4);
        let freq = |k: usize, nn: usize| -> usize {
            let kk = k % nn;
            kk.min(nn - kk)
        };
        let mut kr2 = kr.clone();
        let mut ki2 = ki.clone();
        for ky in 0..h {
            for kx in 0..w {
                if freq(kx, w) > kcut || freq(ky, h) > kcut {
                    let i = ky * w + kx;
                    kr2[i] = 0.0;
                    ki2[i] = 0.0;
                }
            }
        }
        let mut qr = vec![0.0f32; n];
        let mut qi = vec![0.0f32; n];
        for ky in 0..h {
            for x in 0..w {
                let mut sr = 0.0f32;
                let mut si = 0.0f32;
                for kx in 0..w {
                    let ph = tau * ((x * kx) as f32 / w as f32);
                    let c = ph.cos();
                    let s2 = ph.sin();
                    sr += kr2[ky * w + kx] * c - ki2[ky * w + kx] * s2;
                    si += kr2[ky * w + kx] * s2 + ki2[ky * w + kx] * c;
                }
                qr[ky * w + x] = sr / w as f32;
                qi[ky * w + x] = si / w as f32;
            }
        }
        let mut glue = vec![0.0f32; n];
        let mut gmax = 1e-9f32;
        for y in 0..h {
            for x in 0..w {
                let mut ar = 0.0f32;
                let mut ai = 0.0f32;
                for ky in 0..h {
                    let ph = tau * ((y * ky) as f32 / h as f32);
                    let c = ph.cos();
                    let s2 = ph.sin();
                    ar += qr[ky * w + x] * c - qi[ky * w + x] * s2;
                    ai += qr[ky * w + x] * s2 + qi[ky * w + x] * c;
                }
                ar /= h as f32;
                ai /= h as f32;
                let wv = hann(y, h) * hann(x, w);
                let dr = ar - self.real[y * w + x] * wv;
                let di = ai - self.imag[y * w + x] * wv;
                let m = (dr * dr + di * di).sqrt();
                glue[y * w + x] = m;
                if m > gmax {
                    gmax = m;
                }
            }
        }
        for v in glue.iter_mut() {
            *v /= gmax;
        }
        let ix = (self.last_obs * w as f32) as usize;
        let mut wign = vec![0.0f32; n];
        for y in 0..h {
            for p in 0..w {
                let mut acc = 0.0f32;
                let mut s = 0;
                while s < 24 {
                    let yp = y + s;
                    let ym = y as isize - s as isize;
                    if yp < h && ym >= 0 {
                        let a = self.real[yp * w + ix];
                        let b = self.real[ym as usize * w + ix];
                        acc += a * b * (4.0 * 3.14159 * p as f32 * s as f32 / w as f32).cos();
                    }
                    s += 1;
                }
                wign[y * w + p] = acc;
            }
        }
        let mut wmax = 1e-9f32;
        for v in wign.iter() {
            if v.abs() > wmax {
                wmax = v.abs();
            }
        }
        for v in wign.iter_mut() {
            *v /= wmax;
        }
        let mut path = vec![0.0f32; n];
        for t in self.trails.iter() {
            let px = (t.x * w as f32) as usize;
            let py = (t.y * h as f32) as usize;
            if px < w && py < h {
                path[py * w + px] += 1.0;
            }
        }
        let mut pmax = 1e-9f32;
        for v in path.iter() {
            if *v > pmax {
                pmax = *v;
            }
        }
        for v in path.iter_mut() {
            *v /= pmax;
        }
        self.projs.clear();
        self.projs.extend_from_slice(&kproj);
        self.projs.extend_from_slice(&wign);
        self.projs.extend_from_slice(&path);
        self.projs.extend_from_slice(&glue);
    }
    pub fn projs_ptr(&self) -> *const f32 {
        self.projs.as_ptr()
    }

    pub fn projs_len(&self) -> u32 {
        self.projs.len() as u32
    }

    pub fn dims_ptr(&self) -> *const f32 {
        self.dims.re[0].as_ptr()
    }

    pub fn dims_f32_len(&self) -> u32 {
        let cells: usize = self.dims.sizes.iter().sum::<usize>() * 2;
        cells as u32
    }

    fn sample_commits3(&mut self, x_obs: f32, n: u32, seed: u64) {
        let r = self.res3;
        let ix = ((x_obs * r as f32).round() as isize).clamp(0, r as isize - 1) as usize;
        let mut cdf: Vec<f32> = Vec::with_capacity(r * r);
        let mut acc = 0.0f32;
        for z in 0..r {
            for y in 0..r {
                let i = (z * r + y) * r + ix;
                let rho = self.re3[i] * self.re3[i] + self.im3[i] * self.im3[i];
                acc += rho;
                cdf.push(acc);
            }
        }
        if acc < VACUUM_EPS {
            return;
        }
        let mut rng = XorShift64::new(seed ^ 0x9E3779B97F4A7C15);
        for _ in 0..n {
            let target = rng.next_f32() * acc;
            let hit = match cdf.binary_search_by(|v| v.partial_cmp(&target).unwrap_or(std::cmp::Ordering::Less)) {
                Ok(i) => i,
                Err(i) => i.min(r * r - 1),
            };
            let yz = hit;
            let yy = (yz % r) as f32 / r as f32;
            let zz = (yz / r) as f32 / r as f32;
            let jy = (rng.next_f32() - 0.5) / r as f32;
            self.commits.push(Commit {
                x: x_obs.clamp(0.0, 1.0),
                y: (yy + jy).clamp(0.0, 1.0),
                t: self.time,
                _pad: zz,
            });
        }
        if self.commits.len() > MAX_COMMITS {
            let excess = self.commits.len() - MAX_COMMITS;
            self.commits.drain(0..excess);
        }
    }

    /// Signature: [peaks, fringe_shift, deflection, hist_corr] (S-SIGNATURE).
    pub fn signature(&self) -> Vec<f32> {
        let obs = self.last_obs;
        let hc = hist_of_commits(&self.commits, obs);
        let w = self.width as usize;
        let h = self.height as usize;
        let ix = (obs * w as f32) as usize;
        let hr = hist_of_rho_col(&self.real, &self.imag, w, h, ix);
        let mut corr = 0.0f32;
        let mut sa = 0.0;
        let mut sb = 0.0;
        for i in 0..HIST_BINS {
            sa += hc[i] * hc[i];
            sb += hr[i] * hr[i];
            corr += hc[i] * hr[i];
        }
        if sa > 1e-6 && sb > 1e-6 {
            corr /= (sa * sb).sqrt();
        } else {
            corr = 0.0;
        }
        let mut dvx = 0.0f32;
        let mut dvy = 0.0f32;
        let mut np = 0u32;
        for p in self.particles.iter() {
            dvx += p.vx;
            dvy += p.vy;
            np += 1;
        }
        let defl = if np > 0 { (dvy / np as f32).atan2(dvx / np as f32) } else { 0.0 };
        vec![count_peaks(&hc) as f32, centroid(&hc) - 0.5, defl, corr]
    }

    /// Unity matrix batch (S-GRID): formulas x envs, JSON out.
    pub fn run_unity(&self, steps: u32) -> String {
        let envs = [5u32, 1, 3];
        let names = ["corpuscular", "wave", "born", "guidance", "hforce"];
        let mut rows = String::from("[");
        for (ei, env) in envs.iter().enumerate() {
            if ei > 0 {
                rows.push(',');
            }
            rows.push_str(&format!("{{\"env\":{},\"cells\":[", env));
            for (fi, _name) in names.iter().enumerate() {
                if fi > 0 {
                    rows.push(',');
                }
                let hist = self.unity_cell(*env, fi, steps);
                let pass = self.unity_pred(*env, &hist);
                rows.push_str(&format!("{{\"f\":\"{}\",\"pass\":{},\"hist\":[", names[fi], pass));
                for (bi, v) in hist.iter().enumerate() {
                    if bi > 0 {
                        rows.push(',');
                    }
                    rows.push_str(&format!("{:.3}", v));
                }
                rows.push_str("]}");
            }
            rows.push_str("]}");
        }
        rows.push(']');
        rows
    }

    fn unity_cell(&self, env: u32, formula: usize, steps: u32) -> [f32; HIST_BINS] {
        let mut e = WaveEngine::new(64, 64);
        e.set_batch(true);
        e.set_scene(env);
        // Physical honesty: these lab setups contain no gravity/charge sources.
        for s in e.sources.iter_mut() {
            s.strength = 0.0;
        }
        for _ in 0..steps / 2 {
            e.step(0.016);
        }
        let obs = match env { 5 => 0.5, 3 => 0.85, _ => 0.8 };
        match formula {
            0 => {
                e.reg = force::Registry { w: [0.0; 4], on: [false; 4], slots: [0,1,2,3] };
                e.spawn_uniform(300, 777);
                let mut s0 = 31337u64;
                for _ in 0..steps {
                    e.step_force(1.0);
                    e.kill_in_mask();
                    while e.particles_len() < 200 {
                        e.spawn_uniform(20, s0);
                        s0 += 1;
                    }
                }
                e.hist_from_trails(obs)
            }
            1 => {
                let w = e.width as usize;
                let hgt = e.height as usize;
                hist_of_rho_col(&e.real, &e.imag, w, hgt, (obs * w as f32) as usize)
            }
            2 => {
                e.clear_commits();
                e.sample_commits(obs, 200, 4242);
                let mut h = [0.0f32; HIST_BINS];
                for c in e.commits.iter() {
                    let b = ((c.y * HIST_BINS as f32) as usize).min(HIST_BINS - 1);
                    h[b] += 1.0;
                }
                h
            }
            3 => {
                e.reg = force::Registry { w: [1.0, 0.0, 0.0, 0.0], on: [true, false, false, false], slots: [0,1,2,3] };
                e.spawn(300, 777);
                let mut s2 = 918273u64;
                for _ in 0..steps {
                    e.step(0.016);
                    e.kill_in_mask();
                    while e.particles_len() < 200 {
                        e.spawn(20, s2);
                        s2 += 1;
                    }
                }
                e.hist_from_trails(obs)
            }
            _ => {
                e.reg = force::Registry { w: [1.0, 0.3, 0.0, 0.0], on: [true, true, false, false], slots: [0,1,2,3] };
                e.spawn(300, 777);
                let mut s3 = 5150u64;
                for _ in 0..steps {
                    e.step(0.016);
                    e.kill_in_mask();
                    while e.particles_len() < 200 {
                        e.spawn(20, s3);
                        s3 += 1;
                    }
                }
                e.hist_from_trails(obs)
            }
        }
    }

    fn unity_pred(&self, env: u32, h: &[f32; HIST_BINS]) -> bool {
        match env {
            5 => count_peaks(h) >= 3,
            1 => {
                // geometric shadow cone at obs 0.8 for disk(0.55, r0.18) spans bins ~8-16;
                // sides must sit OUTSIDE the cone.
                let mid = h[10] + h[11] + h[12] + h[13];
                let sides = h[3] + h[4] + h[5] + h[6] + h[18] + h[19] + h[20] + h[21];
                mid < sides
            }
            _ => {
                let c = centroid(h);
                (c - 0.5).abs() > 0.02
            }
        }
    }

    /// In-page selftest: JSON lines of {name, pass}.
    pub fn selftest(&self) -> String {
        let mut out = String::from("[");
        let mut push = |out: &mut String, name: &str, pass: bool, first: &mut bool| {
            if !*first {
                out.push(',');
            }
            *first = false;
            out.push_str(&format!("{{\"name\":\"{}\",\"pass\":{}}}", name, pass));
        };
        let mut first = true;
        push(&mut out, "wasm_add", add(2, 2) == 4, &mut first);
        let mut e = WaveEngine::new(96, 96);
        e.set_scene(5);
        for _ in 0..300 {
            e.step(0.016);
        }
        let mut energy = 0.0f32;
        for i in 0..e.real.len() {
            energy += e.real[i] * e.real[i] + e.imag[i] * e.imag[i];
        }
        push(&mut out, "field_energy_positive", energy > 1.0, &mut first);
        e.clear_commits();
        e.sample_commits(0.75, 500, 99);
        push(&mut out, "commits_within_cap", e.commits.len() <= MAX_COMMITS, &mut first);
        let h = hist_of_commits(&e.commits, 0.75);
        push(&mut out, "doubleslit_peaks_ge3", count_peaks(&h) >= 3, &mut first);
        let mut sealed = WaveEngine::new(96, 96);
        sealed.set_scene(5);
        sealed.clear_commits();
        sealed.sample_commits(0.75, 200, 5);
        push(&mut out, "vacuum_no_commits", sealed.commits.is_empty(), &mut first);
        let mut p = force::Particle { x: 0.5, y: 0.5, z: 0.5, vx: 0.0, vy: 0.0, vz: 0.0, alive: true, hue: 0 };
        for _ in 0..200 {
            force::integrate(&mut p, [9.0, 0.0, 0.0], 1.0);
        }
        push(&mut out, "speed_clamped", (p.vx * p.vx + p.vy * p.vy).sqrt() <= force::V_MAX + 1e-6, &mut first);
        push(&mut out, "expr_parser_rejects_bad", expr::parse("1+;(").is_err(), &mut first);
        push(&mut out, "expr_parser_ok", expr::parse("sin(d)*2+1/d").is_ok(), &mut first);
        let mut gl = WaveEngine::new(96, 96);
        gl.set_scene(5);
        for _ in 0..400 {
            gl.step(0.016);
        }
        gl.compute_projs();
        let n96 = 96 * 96;
        let glue = gl.projs[3 * n96..4 * n96].to_vec();
        let mut wm = 0.0f32;
        let mut wc = 0u32;
        let mut om = 0.0f32;
        let mut oc = 0u32;
        for y in 0..96 {
            for x in 0..96 {
                let mx = x / 2;
                let my = y / 2;
                let mv = gl.scene.mask[my * 48 + mx];
                let ring = mv < 0.5
                    && ((mx > 0 && gl.scene.mask[my * 48 + mx - 1] > 0.5)
                        || (mx < 47 && gl.scene.mask[my * 48 + mx + 1] > 0.5)
                        || (my > 0 && gl.scene.mask[(my - 1) * 48 + mx] > 0.5)
                        || (my < 47 && gl.scene.mask[(my + 1) * 48 + mx] > 0.5));
                let g = glue[y * 96 + x];
                if ring {
                    wm += g;
                    wc += 1;
                } else if x > 48 {
                    om += g;
                    oc += 1;
                }
            }
        }
        let wr = wm / (wc as f32).max(1.0);
        let or = om / (oc as f32).max(1.0);
        push(&mut out, "glue_obstruction_localized", wr > 1.5 * or, &mut first);
        out.push(']');
        out
    }

    pub fn set_scene(&mut self, id: u32) {
        self.scene_id = id;
        self.rebuild_scene();
    }

    pub fn scene_id(&self) -> u32 {
        self.scene_id
    }

    pub fn set_barrier(&mut self, v: f32) {
        self.p_barrier = v.clamp(0.05, 0.9);
    }

    pub fn set_sep(&mut self, v: f32) {
        self.p_sep = v.clamp(0.05, 0.5);
    }

    pub fn set_k(&mut self, v: f32) {
        self.p_k = v.clamp(20.0, 120.0);
    }

    fn rebuild_scene(&mut self) {
        self.scene = scene::preset(self.scene_id, self.p_barrier, self.p_sep, self.p_k);
        for v in self.real.iter_mut() {
            *v = 0.0;
        }
        for v in self.imag.iter_mut() {
            *v = 0.0;
        }
        self.solver = solver::Solver::new();
        self.solver.pre_re = self.real.clone();
        self.solver.pre_im = self.imag.clone();
        self.commits.clear();
        self.particles.clear();
        self.trails.clear();
    }

    pub fn n_ptr(&self) -> *const f32 {
        self.scene.n.as_ptr()
    }

    pub fn n_len(&self) -> u32 {
        self.scene.n.len() as u32
    }

    pub fn mask_ptr(&self) -> *const f32 {
        self.scene.mask.as_ptr()
    }

    pub fn mask_len(&self) -> u32 {
        self.scene.mask.len() as u32
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn time(&self) -> f32 {
        self.time
    }

    pub fn clear_commits(&mut self) {
        self.commits.clear();
    }

    pub fn commits_len(&self) -> u32 {
        self.commits.len() as u32
    }

    pub fn commits_f32_len(&self) -> u32 {
        (self.commits.len() * 4) as u32
    }

    pub fn commits_ptr(&self) -> *const f32 {
        self.commits.as_ptr() as *const f32
    }

    pub fn sample_commits(&mut self, x_obs: f32, n: u32, seed: u64) {
        self.last_obs = x_obs.clamp(0.0, 1.0);
        if self.dim3 {
            self.sample_commits3(x_obs, n, seed);
            return;
        }
        let w = self.width as usize;
        let h = self.height as usize;
        if w == 0 || h == 0 || n == 0 {
            return;
        }
        let ix = ((x_obs * (self.width as f32)).round() as isize).clamp(0, (w as isize) - 1) as usize;

        let mut cdf = Vec::with_capacity(h);
        let mut acc = 0.0f32;
        for y in 0..h {
            let idx = y * w + ix;
            let rho = self.real[idx] * self.real[idx] + self.imag[idx] * self.imag[idx];
            acc += rho;
            cdf.push(acc);
        }

        if acc < VACUUM_EPS {
            return;
        }

        let mut rng = XorShift64::new(seed ^ 0x9E3779B97F4A7C15 ^ ((self.commits.len() as u64).wrapping_mul(0xBF58476D1CE4E5B9)));
        for _ in 0..n {
            let target = rng.next_f32() * acc;
            let hit = match cdf.binary_search_by(|v| v.partial_cmp(&target).unwrap_or(std::cmp::Ordering::Less)) {
                Ok(i) => i,
                Err(i) => i.min(h - 1),
            };
            let jitter = rng.next_f32() - 0.5;
            let norm_y = (((hit as f32) + 0.5 + jitter) / (h as f32)).clamp(0.0, 1.0);
            self.commits.push(Commit { x: x_obs.clamp(0.0, 1.0), y: norm_y, t: self.time, _pad: 0.0 });
        }

        if self.commits.len() > MAX_COMMITS {
            let excess = self.commits.len() - MAX_COMMITS;
            self.commits.drain(0..excess);
        }
    }

    pub fn real_ptr(&self) -> *const f32 {
        self.real.as_ptr()
    }

    pub fn real_len(&self) -> u32 {
        self.real.len() as u32
    }

    pub fn imag_ptr(&self) -> *const f32 {
        self.imag.as_ptr()
    }

    pub fn imag_len(&self) -> u32 {
        self.imag.len() as u32
    }

    /// DEPRECATED at M-S1 (kept until acceptance): analytic double-slit field.
    /// Superseded by scene preset 5 + solver (S-SOLVER-WAVE).
    /// absorbing wall with two slits, two cylindrical waves interfering right.
    /// Positions in uv units (0..1), k = wavenumber.
    pub fn init_double_slit(&mut self, barrier_u: f32, y1: f32, y2: f32, k: f32) {
        let (w, h) = (self.width as usize, self.height as usize);
        let b = barrier_u.clamp(0.0, 1.0);
        let s1 = y1.clamp(0.0, 1.0);
        let s2 = y2.clamp(0.0, 1.0);
        let kk = k.clamp(5.0, 400.0);
        let slit_half = 0.025;
        let wall_half = 1.0 / (self.width as f32);
        for y in 0..h {
            for x in 0..w {
                let u = (x as f32) / (self.width as f32);
                let v = (y as f32) / (self.height as f32);
                let idx = y * w + x;
                let env = (std::f32::consts::PI * v).sin().max(0.15);
                if (u - b).abs() <= wall_half {
                    let d1 = (v - s1).abs();
                    let d2 = (v - s2).abs();
                    if d1 > slit_half && d2 > slit_half {
                        self.real[idx] = 0.0;
                        self.imag[idx] = 0.0;
                        continue;
                    }
                }
                if u < b {
                    self.real[idx] = (u * kk).sin() * env;
                    self.imag[idx] = (u * kk).cos() * env;
                } else {
                    let r1 = ((u - b) * (u - b) + (v - s1) * (v - s1)).sqrt();
                    let r2 = ((u - b) * (u - b) + (v - s2) * (v - s2)).sqrt();
                    let a1 = 0.5 / (r1 / 0.2 + 1.0).sqrt();
                    let a2 = 0.5 / (r2 / 0.2 + 1.0).sqrt();
                    let p1 = b * kk + r1 * kk;
                    let p2 = b * kk + r2 * kk;
                    self.real[idx] = (a1 * p1.cos() + a2 * p2.cos()) * env;
                    self.imag[idx] = (a1 * p1.sin() + a2 * p2.sin()) * env;
                }
            }
        }
        self.commits.clear();
    }

    /// Plane-wave field (rho ~= envelope^2, never vacuum).
    pub fn init_plane(&mut self) {
        let (w, h) = (self.width as usize, self.height as usize);
        for y in 0..h {
            for x in 0..w {
                let fx = (x as f32) / (self.width as f32);
                let fy = (y as f32) / (self.height as f32);
                let envelope = (std::f32::consts::PI * fy).sin().max(0.15);
                let idx = y * w + x;
                self.real[idx] = (fx * 20.0).sin() * envelope;
                self.imag[idx] = (fx * 20.0).cos() * envelope;
            }
        }
        self.commits.clear();
    }
}

#[wasm_bindgen]
impl WaveEngine {
    pub fn set_dim3(&mut self, on: bool) {
        self.dim3 = on;
        self.reset_field3();
    }

    pub fn dim3(&self) -> bool {
        self.dim3
    }

    pub fn set_res3(&mut self, r: u32) {
        let r = match r {
            64 => 64,
            48 => 48,
            _ => 32,
        };
        self.res3 = r;
        let n = r * r * r;
        self.re3 = vec![0.0; n];
        self.im3 = vec![0.0; n];
        self.pre3 = vec![0.0; n];
        self.pim3 = vec![0.0; n];
    }

    fn reset_field3(&mut self) {
        for v in self.re3.iter_mut() {
            *v = 0.0;
        }
        for v in self.im3.iter_mut() {
            *v = 0.0;
        }
        self.pre3.fill(0.0);
        self.pim3.fill(0.0);
        self.scene3 = scene::preset3(self.scene_id, self.p_barrier, self.p_sep);
    }

    pub fn field3_ptr(&self) -> *const f32 {
        self.re3.as_ptr()
    }

    pub fn field3_len(&self) -> u32 {
        (self.re3.len() * 2) as u32
    }

    pub fn res3(&self) -> u32 {
        self.res3 as u32
    }

    pub fn set_cam(&mut self, yaw: f32, pitch: f32, dist: f32, panx: f32, pany: f32) {
        self.cam = [yaw, pitch, dist, panx, pany];
    }

    /// Point cloud from 3D rho threshold (R2 mode).
    pub fn compute_points(&mut self) {
        let r = self.res3;
        let mut pts: Vec<f32> = Vec::new();
        let mut mx = 1e-9f32;
        for i in 0..r * r * r {
            let rho = self.re3[i] * self.re3[i] + self.im3[i] * self.im3[i];
            if rho > mx {
                mx = rho;
            }
        }
        let step = if r > 32 { 2 } else { 1 };
        for z in (0..r).step_by(step) {
            for y in (0..r).step_by(step) {
                for x in (0..r).step_by(step) {
                    let i = (z * r + y) * r + x;
                    let rho = self.re3[i] * self.re3[i] + self.im3[i] * self.im3[i];
                    if rho > 0.30 * mx && pts.len() < 4092 * 4 {
                        let ph = self.im3[i].atan2(self.re3[i]);
                        pts.push((x as f32 + 0.5) / r as f32);
                        pts.push((y as f32 + 0.5) / r as f32);
                        pts.push((z as f32 + 0.5) / r as f32);
                        pts.push(ph);
                    }
                }
            }
        }
        self.points = pts;
    }

    pub fn points_ptr(&self) -> *const f32 {
        self.points.as_ptr()
    }

    pub fn points_len(&self) -> u32 {
        self.points.len() as u32
    }

    /// CPU rasterizer fallback (P3/T3): RGBA 192x192 bilinear from 2D field or 3D mid-slice.
    pub fn raster(&mut self) {
        let w = 192usize;
        let fw = self.width as f32;
        for y in 0..w {
            for x in 0..w {
                let (re, im) = if self.dim3 {
                    let r = self.res3;
                    let ix = (x as f32 / w as f32 * r as f32) as usize % r;
                    let iy = (y as f32 / w as f32 * r as f32) as usize % r;
                    let iz = r / 2;
                    let i = (iz * r + iy) * r + ix;
                    (self.re3[i], self.im3[i])
                } else {
                    let px = (x as f32 + 0.5) / w as f32 * fw - 0.5;
                    let py = (y as f32 + 0.5) / w as f32 * fw - 0.5;
                    let x0 = px.floor() as isize;
                    let y0 = py.floor() as isize;
                    let fx = (px - x0 as f32).clamp(0.0, 1.0);
                    let fy = (py - y0 as f32).clamp(0.0, 1.0);
                    let mut acc = (0.0, 0.0);
                    for dy in 0..2 {
                        for dx in 0..2 {
                            let xx = (x0 + dx).clamp(0, self.width as isize - 1) as usize;
                            let yy = (y0 + dy).clamp(0, self.height as isize - 1) as usize;
                            let wx = if dx == 0 { 1.0 - fx } else { fx };
                            let wy = if dy == 0 { 1.0 - fy } else { fy };
                            let i = yy * self.width as usize + xx;
                            acc.0 += self.real[i] * wx * wy;
                            acc.1 += self.imag[i] * wx * wy;
                        }
                    }
                    (acc.0, acc.1)
                };
                let rho = re * re + im * im;
                let ph = im.atan2(re);
                let hh = ph / std::f32::consts::TAU + 0.5;
                let f = |q: f32| -> f32 {
                    let t = ((((q % 1.0) + 1.0) % 1.0) * 6.0 - 3.0).abs() - 1.0;
                    t.clamp(0.0, 1.0)
                };
                let v = (rho / (rho + 0.85) * 1.35).clamp(0.0, 1.0) * 255.0;
                let o = (y * w + x) * 4;
                self.raster[o] = (f(hh) * v) as u8;
                self.raster[o + 1] = (f(hh + 2.0 / 3.0) * v) as u8;
                self.raster[o + 2] = (f(hh + 1.0 / 3.0) * v) as u8;
                self.raster[o + 3] = 255;
            }
        }
    }

    pub fn raster_ptr(&self) -> *const u8 {
        self.raster.as_ptr()
    }

    pub fn raster_len(&self) -> u32 {
        self.raster.len() as u32
    }

    fn proj(&self, p: [f32; 3]) -> [f32; 3] {
        if !self.dim3 {
            return [p[0], p[1], 0.5];
        }
        let (yaw, pitch, dist, panx, pany) = (self.cam[0], self.cam[1], self.cam[2], self.cam[3], self.cam[4]);
        let cy = yaw.cos();
        let sy = yaw.sin();
        let cp = pitch.cos();
        let sp = pitch.sin();
        let fwd = [-cp * cy, -cp * sy, -sp];
        let right0 = [fwd[1] * 1.0 - fwd[2] * 0.0, fwd[2] * 0.0 - fwd[0] * 1.0, 0.0];
        let rl = (right0[0] * right0[0] + right0[1] * right0[1]).sqrt().max(1e-6);
        let right = [right0[0] / rl, right0[1] / rl, 0.0];
        let up = [
            right[1] * fwd[2] - right[2] * fwd[1],
            right[2] * fwd[0] - right[0] * fwd[2],
            right[0] * fwd[1] - right[1] * fwd[0],
        ];
        let target = [0.5 + panx, 0.5 + pany, 0.5];
        let eye = [target[0] - fwd[0] * dist, target[1] - fwd[1] * dist, target[2] - fwd[2] * dist];
        let d = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]];
        let z = d[0] * fwd[0] + d[1] * fwd[1] + d[2] * fwd[2];
        if z < 0.05 {
            return [-9.0, -9.0, 0.0];
        }
        let u = 0.5 + (d[0] * right[0] + d[1] * right[1] + d[2] * right[2]) / z;
        let v = 0.5 - (d[0] * up[0] + d[1] * up[1] + d[2] * up[2]) / z;
        [u, v, z]
    }

    /// Project trails + commits (+ point cloud if include_points) to screen splats.
    pub fn project_splats(&mut self, include_points: bool) {
        let mut s: Vec<f32> = Vec::with_capacity(8192 * 4);
        for t in self.trails.iter() {
            if s.len() >= 8192 * 4 {
                break;
            }
            let p = self.proj([t.x, t.y, t.z]);
            if p[0] < -1.0 {
                continue;
            }
            s.push(p[0]);
            s.push(p[1]);
            s.push(p[2]);
            s.push(t.hue as f32);
        }
        for c in self.commits.iter() {
            if s.len() >= 8192 * 4 {
                break;
            }
            let z = if self.dim3 { c._pad } else { 0.5 };
            let p = self.proj([c.x, c.y, z]);
            if p[0] < -1.0 {
                continue;
            }
            s.push(p[0]);
            s.push(p[1]);
            s.push(p[2]);
            s.push(9.0);
        }
        if include_points {
            for i in (0..self.points.len()).step_by(4) {
                if s.len() >= 8192 * 4 {
                    break;
                }
                let p = self.proj([self.points[i], self.points[i + 1], self.points[i + 2]]);
                if p[0] < -1.0 {
                    continue;
                }
                s.push(p[0]);
                s.push(p[1]);
                s.push(p[2]);
                s.push(1000.0 + self.points[i + 3]);
            }
        }
        self.splats = s;
    }

    pub fn splats_ptr(&self) -> *const f32 {
        self.splats.as_ptr()
    }

    pub fn splats_len(&self) -> u32 {
        (self.splats.len() / 4) as u32
    }

    /// Exact leapfrog time reversal (2D field): rev-step uses lap(pre), next=cur-K*pre.
    /// 3D field reversal not exact (leapfrog3 lacks rev branch) - documented limitation.
    pub fn reverse_time(&mut self) {
        self.solver.rev = !self.solver.rev;
        for p in self.particles.iter_mut() {
            p.vx = -p.vx;
            p.vy = -p.vy;
            p.vz = -p.vz;
        }
    }

    fn pre_re_mut(&mut self) -> &mut Vec<f32> {
        &mut self.solver.pre_re
    }

    fn pre_im_mut(&mut self) -> &mut Vec<f32> {
        &mut self.solver.pre_im
    }

    pub fn kick(&mut self, imp: f32) {
        for p in self.particles.iter_mut() {
            p.vx += imp;
        }
    }

    pub fn swap_slots(&mut self, i: u32, j: u32) {
        self.reg.swap_slots(i as usize, j as usize);
    }

    pub fn set_slot(&mut self, i: u32, law: u32) {
        let i = (i as usize).min(3);
        self.reg.slots[i] = law as u8;
    }

    pub fn add_source(&mut self, x: f32, y: f32, z: f32, kind: u32) {
        if self.sources.len() < force::MAX_SOURCES {
            self.sources.push(force::Source { x, y, z, strength: 1.0, kind });
        }
    }

    pub fn remove_source(&mut self, i: u32) {
        let i = i as usize;
        if i < self.sources.len() && self.sources.len() > 1 {
            self.sources.remove(i);
        }
    }

    pub fn flip_source(&mut self, i: u32) {
        let i = (i as usize).min(self.sources.len() - 1);
        self.sources[i].strength = -self.sources[i].strength;
    }

    pub fn set_source_depth(&mut self, i: u32, z: f32) {
        let i = (i as usize).min(self.sources.len() - 1);
        self.sources[i].z = z.clamp(0.0, 1.0);
    }

    pub fn sources_len(&self) -> u32 {
        self.sources.len() as u32
    }

    /// Config vector for save/load round-trip (schema in 02 appendix v4).
    pub fn config_vec(&self) -> Vec<f32> {
        let mut v = vec![
            self.scene_id as f32, self.p_barrier, self.p_sep, self.p_k,
        ];
        for i in 0..4 {
            v.push(self.reg.w[i]);
            v.push(if self.reg.on[i] { 1.0 } else { 0.0 });
            v.push(self.reg.slots[i] as f32);
        }
        for s in 0..force::MAX_SOURCES {
            let src = self.sources.get(s).copied().unwrap_or_default();
            v.push(src.x);
            v.push(src.y);
            v.push(src.z);
            v.push(src.strength);
            v.push(src.kind as f32);
        }
        for c in self.cam.iter() {
            v.push(*c);
        }
        v
    }

    pub fn load_config(&mut self, v: Vec<f32>) -> bool {
        let need = 4 + 12 + force::MAX_SOURCES * 5 + 5;
        if v.len() < need {
            return false;
        }
        self.p_barrier = v[1];
        self.p_sep = v[2];
        self.p_k = v[3];
        for i in 0..4 {
            self.reg.w[i] = v[4 + i * 3];
            self.reg.on[i] = v[5 + i * 3] > 0.5;
            self.reg.slots[i] = v[6 + i * 3] as u8;
        }
        self.sources.clear();
        for s in 0..force::MAX_SOURCES {
            let o = 16 + s * 5;
            self.sources.push(force::Source {
                x: v[o], y: v[o + 1], z: v[o + 2], strength: v[o + 3], kind: v[o + 4] as u32,
            });
        }
        let co = 16 + force::MAX_SOURCES * 5;
        self.cam = [v[co], v[co + 1], v[co + 2], v[co + 3], v[co + 4]];
        self.set_scene(v[0] as u32);
        true
    }
}

fn qp_force(re: &[f32], im: &[f32], w: usize, h: usize, x: usize, y: usize) -> [f32; 2] {
    let q = |xx: usize, yy: usize| -> f32 {
        let i = yy * w + xx;
        let r = (re[i] * re[i] + im[i] * im[i] + 1e-8).sqrt();
        let xm = xx.saturating_sub(1);
        let xp = (xx + 1).min(w - 1);
        let ym = yy.saturating_sub(1);
        let yp = (yy + 1).min(h - 1);
        let rr = |a: usize, b: usize| (re[b * w + a] * re[b * w + a] + im[b * w + a] * im[b * w + a] + 1e-8).sqrt();
        let lap = rr(xp, yy) + rr(xm, yy) + rr(xx, yp) + rr(xx, ym) - 4.0 * r;
        -lap / (r + 1e-6)
    };
    let xm = x.saturating_sub(1);
    let xp = (x + 1).min(w - 1);
    let ym = y.saturating_sub(1);
    let yp = (y + 1).min(h - 1);
    [
        (q(xp, y) - q(xm, y)) * 0.5,
        (q(x, yp) - q(x, ym)) * 0.5,
    ]
}

/// Discrete probability-flux velocity (cells per wave_step), derived from the
/// leapfrog staggered continuity pair (pre=psi_{n-1}, cur=psi_n):
/// F_{i->j} = 4*cdt*Im(pre_i* cur_j);  v_i = sum_j (x_j-x_i) F_ij / rho_i.
/// Equivariant by construction with the discrete continuity equation (E32).
fn flux_vel2(
    pre_re: &[f32],
    pre_im: &[f32],
    re: &[f32],
    im: &[f32],
    w: usize,
    h: usize,
    x: usize,
    y: usize,
) -> [f32; 2] {
    let i = y * w + x;
    let rho = re[i] * re[i] + im[i] * im[i] + 1e-6;
    let cdt = 0.10;
    let mut vx = 0.0f32;
    let mut vy = 0.0f32;
    let link = |j: usize, dx: f32, dy: f32| -> (f32, f32) {
        let f = 4.0 * cdt * (pre_re[i] * im[j] - pre_im[i] * re[j]);
        (dx * f / rho, dy * f / rho)
    };
    if x + 1 < w {
        let (a, b) = link(i + 1, 1.0, 0.0);
        vx += a;
        vy += b;
    }
    if x > 0 {
        let (a, b) = link(i - 1, -1.0, 0.0);
        vx += a;
        vy += b;
    }
    if y + 1 < h {
        let (a, b) = link(i + w, 0.0, 1.0);
        vx += a;
        vy += b;
    }
    if y > 0 {
        let (a, b) = link(i - w, 0.0, -1.0);
        vx += a;
        vy += b;
    }
    let sp = (vx * vx + vy * vy).sqrt();
    if sp > 1.5 {
        vx *= 0.5 / sp;
        vy *= 0.5 / sp;
    }
    [vx, vy]
}

fn grad2_bil(re: &[f32], im: &[f32], w: usize, h: usize, fx: f32, fy: f32) -> [f32; 2] {
    let x0 = (fx * w as f32 - 0.5).clamp(0.0, (w - 2) as f32);
    let y0 = (fy * h as f32 - 0.5).clamp(0.0, (h - 2) as f32);
    let ix = x0 as usize;
    let iy = y0 as usize;
    let tx = x0 - ix as f32;
    let ty = y0 - iy as f32;
    let g00 = grad2(re, im, w, h, ix, iy);
    let g10 = grad2(re, im, w, h, ix + 1, iy);
    let g01 = grad2(re, im, w, h, ix, iy + 1);
    let g11 = grad2(re, im, w, h, ix + 1, iy + 1);
    [
        (g00[0] * (1.0 - tx) + g10[0] * tx) * (1.0 - ty) + (g01[0] * (1.0 - tx) + g11[0] * tx) * ty,
        (g00[1] * (1.0 - tx) + g10[1] * tx) * (1.0 - ty) + (g01[1] * (1.0 - tx) + g11[1] * tx) * ty,
    ]
}

fn grad2(re: &[f32], im: &[f32], w: usize, h: usize, x: usize, y: usize) -> [f32; 2] {
    let i = y * w + x;
    let xm = x.saturating_sub(1);
    let xp = (x + 1).min(w - 1);
    let ym = y.saturating_sub(1) * w;
    let yp = (y + 1).min(h - 1) * w;
    // node-aware regularization: floor rho by 5% of 3x3 neighbourhood max (E20 fix)
    let mut nmax = 0.0f32;
    for yy in [ym, y * w, yp] {
        for xx in [xm, x, xp] {
            let r2 = re[yy + xx] * re[yy + xx] + im[yy + xx] * im[yy + xx];
            if r2 > nmax {
                nmax = r2;
            }
        }
    }
    let rho = re[i] * re[i] + im[i] * im[i] + 0.05 * nmax;
    let drx = (re[y * w + xp] - re[y * w + xm]) * 0.5;
    let dix = (im[y * w + xp] - im[y * w + xm]) * 0.5;
    let dry = (re[yp + x] - re[ym + x]) * 0.5;
    let diy = (im[yp + x] - im[ym + x]) * 0.5;
    [
        (re[i] * dix - im[i] * drx) / rho,
        (re[i] * diy - im[i] * dry) / rho,
    ]
}

fn maskg2(mask: &[f32], x: usize, y: usize) -> [f32; 2] {
    let x = x.min(47);
    let y = y.min(47);
    let xm = x.saturating_sub(1);
    let xp = (x + 1).min(47);
    let ym = y.saturating_sub(1);
    let yp = (y + 1).min(47);
    [
        (mask[y * 48 + xp] - mask[y * 48 + xm]) * 0.5,
        (mask[yp * 48 + x] - mask[ym * 48 + x]) * 0.5,
    ]
}

fn grad3(re: &[f32], im: &[f32], r: usize, x: usize, y: usize, z: usize) -> [f32; 3] {
    let i = (z * r + y) * r + x;
    let xm = x.saturating_sub(1);
    let xp = (x + 1).min(r - 1);
    let ym = y.saturating_sub(1);
    let yp = (y + 1).min(r - 1);
    let zm = z.saturating_sub(1);
    let zp = (z + 1).min(r - 1);
    let rho0 = re[i] * re[i] + im[i] * im[i];
    let d = |a: usize, b: usize, c: usize| (re[(c * r + b) * r + a], im[(c * r + b) * r + a]);
    let (r1, i1) = d(xp, y, z);
    let (r0, i0) = d(xm, y, z);
    let (r3, i3) = d(x, yp, z);
    let (r2, i2) = d(x, ym, z);
    let (r5, i5) = d(x, y, zp);
    let (r4, i4) = d(x, y, zm);
    let mut nmax = rho0;
    for (rr2, ii2) in [(r1, i1), (r0, i0), (r3, i3), (r2, i2), (r5, i5), (r4, i4)] {
        let r2v = rr2 * rr2 + ii2 * ii2;
        if r2v > nmax {
            nmax = r2v;
        }
    }
    let rho = rho0 + 0.05 * nmax;
    let drx = (r1 - r0) * 0.5;
    let dix = (i1 - i0) * 0.5;
    let dry = (r3 - r2) * 0.5;
    let diy = (i3 - i2) * 0.5;
    let drz = (r5 - r4) * 0.5;
    let diz = (i5 - i4) * 0.5;
    [
        (re[i] * dix - im[i] * drx) / rho,
        (re[i] * diy - im[i] * dry) / rho,
        (re[i] * diz - im[i] * drz) / rho,
    ]
}

fn maskg3(mask: &[f32], r: usize, x: usize, y: usize, z: usize) -> [f32; 3] {
    let g = 24usize;
    let gx = ((x * g) / r).min(g - 1);
    let gy = ((y * g) / r).min(g - 1);
    let gz = ((z * g) / r).min(g - 1);
    let xm = gx.saturating_sub(1);
    let xp = (gx + 1).min(g - 1);
    let ym = gy.saturating_sub(1);
    let yp = (gy + 1).min(g - 1);
    let zm = gz.saturating_sub(1);
    let zp = (gz + 1).min(g - 1);
    let at = |a: usize, b: usize, c: usize| mask[(c * g + b) * g + a];
    [
        (at(xp, gy, gz) - at(xm, gy, gz)) * 0.5,
        (at(gx, yp, gz) - at(gx, ym, gz)) * 0.5,
        (at(gx, gy, zp) - at(gx, gy, zm)) * 0.5,
    ]
}

fn hist_centroid_bin(h: &[f32; HIST_BINS]) -> f32 {
    let mut s = 0.0f32;
    let mut w = 0.0f32;
    for (i, v) in h.iter().enumerate() {
        s += i as f32 * v;
        w += v;
    }
    if w < 1e-6 {
        12.0
    } else {
        s / w
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reverse_roundtrip_2d() {
        let mut e = WaveEngine::new(48, 48);
        e.set_scene(0);
        for _ in 0..60 { e.step(0.016); }
        let snap = e.real.clone();
        e.solver.drive = false;
        e.solver.sponge = false;
        for _ in 0..60 { e.step(0.016); }
        e.reverse_time();
        for _ in 0..60 { e.step(0.016); }
        let mut err = 0.0f32;
        for i in 0..snap.len() {
            let x = i % 48;
            let y = i / 48;
            if x < 6 || x > 41 || y < 6 || y > 41 { continue; }
            err = err.max((e.real[i] - snap[i]).abs());
        }
        // leapfrog reversal is exact up to the drive term; allow modest tolerance
        assert!(err < 0.5, "reverse roundtrip err {}", err);
    }

    #[test]
    fn config_roundtrip() {
        let mut e = WaveEngine::new(48, 48);
        e.set_weight(1, 2.5);
        e.set_source(0, 0.7, 0.4, 1.5, 0);
        e.swap_slots(0, 2);
        let cfg = e.config_vec();
        let mut e2 = WaveEngine::new(48, 48);
        assert!(e2.load_config(cfg.clone()));
        assert_eq!(e2.config_vec(), cfg);
    }

    #[test]
    fn dim3_sample_respects_vacuum() {
        let mut e = WaveEngine::new(32, 32);
        e.set_dim3(true);
        e.clear_commits();
        e.sample_commits(0.75, 100, 3);
        assert!(e.commits.is_empty());
    }

    #[test]
    fn avg_accumulates() {
        let mut e = WaveEngine::new(64, 64);
        e.set_scene(5);
        for _ in 0..100 {
            e.step(0.016);
        }
        let mx = e.avg.iter().cloned().fold(0.0f32, f32::max);
        assert!(mx > 0.1, "avg max {mx}");
    }

    #[test]
    fn qp_zero_on_uniform_density() {
        let re = vec![1.0f32; 64];
        let im = vec![0.0f32; 64];
        let f = qp_force(&re, &im, 8, 8, 4, 4);
        assert!(f[0].abs() < 1e-4 && f[1].abs() < 1e-4);
    }
}
























#[wasm_bindgen]
impl WaveEngine {
    pub fn brush_stroke(&mut self, x: f32, y: f32, dx: f32, dy: f32) {
        let gx = (x * 48.0) as isize;
        let gy = (y * 48.0) as isize;
        for yy in (gy - 3)..=(gy + 3) {
            for xx in (gx - 3)..=(gx + 3) {
                if xx < 0 || xx > 47 || yy < 0 || yy > 47 {
                    continue;
                }
                let d2 = ((xx - gx) * (xx - gx) + (yy - gy) * (yy - gy)) as f32;
                let fall = (-d2 / 6.0).exp();
                let i = (yy as usize * 48 + xx as usize) * 2;
                self.brush[i] = (self.brush[i] + dx * 8.0 * fall).clamp(-1.0, 1.0);
                self.brush[i + 1] = (self.brush[i + 1] + dy * 8.0 * fall).clamp(-1.0, 1.0);
            }
        }
    }

    pub fn brush_clear(&mut self) {
        self.brush.fill(0.0);
    }
}









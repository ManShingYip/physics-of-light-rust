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

fn step_nd(d: &mut DimFields, di: usize, shape: &[usize], omega: f32) {
    let n = d.sizes[di];
    let cdt = 0.10f32;
    let nd = shape.len();
    let mut strides = vec![1usize; nd];
    for k in (0..nd - 1).rev() {
        strides[k] = strides[k + 1] * shape[k + 1];
    }
    let re = &d.re[di];
    let im = &d.im[di];
    let mut nr = re.clone();
    let mut ni = im.clone();
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
        let mut a = d.pre[di][i] - 2.0 * cdt * li;
        let mut b = d.pim[di][i] + 2.0 * cdt * lr;
        if edge {
            a *= 0.9;
            b *= 0.9;
        }
        nr[i] = a;
        ni[i] = b;
    }
    let s0 = strides[0];
    let c = (omega * d.t).cos() * 0.3;
    let s = -(omega * d.t).sin() * 0.3;
    for i in 0..n {
        if (i / s0) % shape[0] == 1 {
            nr[i] += c;
            ni[i] += s;
        }
    }
    d.pre[di].copy_from_slice(re);
    d.pim[di].copy_from_slice(im);
    d.re[di].copy_from_slice(&nr);
    d.im[di].copy_from_slice(&ni);
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
                force::Source { x: 0.68, y: 0.32, strength: 1.0, kind: 0 },
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
        }
        let shapes: [&[usize]; 4] = [&[128], &[64, 64], &[24, 24, 24], &[12, 12, 12, 12]];
        for di in 0..4 {
            step_nd(&mut self.dims, di, shapes[di], omega);
        }
        self.dims.t += 1.0;
        self.step_force(dt);
    }

    pub fn step_force(&mut self, dt: f32) {
        self.tick += 1;
        let w = self.width as usize;
        let h = self.height as usize;
        let mask = self.scene.mask.clone();
        let sources = self.sources.clone();
        let reg = self.reg;
        let cm = self.eff_custom();
        let prog = self.custom_prog.clone();
        for p in self.particles.iter_mut() {
            if !p.alive {
                continue;
            }
            let (f, dom) = force::force_at(p.x, p.y, &self.real, &self.imag, w, h, &mask, &sources, &reg, cm, prog.as_deref());
            if reg.on[0] {
                let ix = ((p.x * w as f32) as usize).min(w - 1);
                let iy = ((p.y * h as f32) as usize).min(h - 1);
                let g = force::grad_phase(&self.real, &self.imag, w, h, ix, iy);
                let gl = (g[0] * g[0] + g[1] * g[1]).sqrt();
                if gl > 1e-6 {
                    let sp = (p.vx * p.vx + p.vy * p.vy).sqrt().max(0.004);
                    let tx = g[0] / gl * sp;
                    let ty = g[1] / gl * sp;
                    p.vx = p.vx * 0.8 + tx * 0.2;
                    p.vy = p.vy * 0.8 + ty * 0.2;
                }
            }
            force::integrate(p, f, dt);
            p.hue = dom;
            if self.tick % 2 == 0 && p.alive {
                self.trails.push(force::Trail { x: p.x, y: p.y, hue: p.hue, age: 0.0 });
            }
        }
        for t in self.trails.iter_mut() {
            t.age += dt;
        }
        while let Some(first) = self.trails.first() {
            if first.age > 1.5 || self.trails.len() > force::MAX_TRAILS {
                self.trails.remove(0);
            } else {
                break;
            }
        }
        self.particles.retain(|p| p.alive);
        if self.tick % 6 == 0 {
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
                    let (f, _) = force::force_at(u, v, &self.real, &self.imag, w, h, &mask, &sources, &r2, 0.0, None);
                    let o = (gy * 48 + gx) * 10 + fi * 2;
                    g[o] = f[0];
                    g[o + 1] = f[1];
                    acc[0] += reg.w[fi] * f[0] * if saved[fi] { 1.0 } else { 0.0 };
                    acc[1] += reg.w[fi] * f[1] * if saved[fi] { 1.0 } else { 0.0 };
                }
                let (net, _) = force::force_at(u, v, &self.real, &self.imag, w, h, &mask, &sources, &reg, cm, None);
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
        for _ in 0..n {
            if self.particles.len() >= 256 {
                break;
            }
            let y = rng.next_f32();
            let jy = (rng.next_f32() - 0.5) * 0.004;
            self.particles.push(force::Particle {
                x: 0.02,
                y: (y + jy).clamp(0.0, 1.0),
                vx: 0.004,
                vy: 0.0,
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
        self.sources[i] = force::Source { x, y, strength, kind };
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

    pub fn dims_ptr(&self) -> *const f32 {
        self.dims.re[0].as_ptr()
    }

    pub fn dims_f32_len(&self) -> u32 {
        let cells: usize = self.dims.sizes.iter().sum::<usize>() * 2;
        cells as u32
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
        let mut e = WaveEngine::new(self.width, self.height);
        e.set_scene(env);
        for _ in 0..steps / 2 {
            e.step(0.016);
        }
        let obs = 0.75f32;
        match formula {
            0 => {
                e.reg = force::Registry { w: [0.0; 4], on: [false; 4] };
                e.spawn(300, 777);
                for _ in 0..steps {
                    e.step_force(1.0);
                    e.kill_in_mask();
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
                e.reg = force::Registry { w: [1.0, 0.0, 0.0, 1.0], on: [true, false, false, true] };
                e.spawn(300, 777);
                for _ in 0..steps {
                    e.step_force(1.0);
                }
                e.hist_from_trails(obs)
            }
            _ => {
                e.reg = force::Registry { w: [1.0, 0.3, 0.0, 1.0], on: [true, true, false, true] };
                e.spawn(300, 777);
                for _ in 0..steps {
                    e.step_force(1.0);
                }
                e.hist_from_trails(obs)
            }
        }
    }

    fn unity_pred(&self, env: u32, h: &[f32; HIST_BINS]) -> bool {
        match env {
            5 => count_peaks(h) >= 3,
            1 => {
                let mid = h[10] + h[11] + h[12] + h[13];
                let sides = h[4] + h[5] + h[6] + h[7] + h[16] + h[17] + h[18] + h[19];
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
        let mut p = force::Particle { x: 0.5, y: 0.5, vx: 0.0, vy: 0.0, alive: true, hue: 0 };
        for _ in 0..200 {
            force::integrate(&mut p, [9.0, 0.0], 1.0);
        }
        push(&mut out, "speed_clamped", (p.vx * p.vx + p.vy * p.vy).sqrt() <= force::V_MAX + 1e-6, &mut first);
        push(&mut out, "expr_parser_rejects_bad", expr::parse("1+;(").is_err(), &mut first);
        push(&mut out, "expr_parser_ok", expr::parse("sin(d)*2+1/d").is_ok(), &mut first);
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



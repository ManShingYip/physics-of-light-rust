use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

/// Max commits mirrored in WGSL (storage buffer sizing).
pub const MAX_COMMITS: usize = 256;
/// Below this column energy we treat the line as vacuum (no fake particles).
const VACUUM_EPS: f32 = 1e-6;

/// 16-byte aligned commit event, matches WGSL `CommitEvent`.
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

/// Backend field: un-collapsed complex wave field + committed event log.
/// Frontend (WGSL) only renders; randomness lives here.
#[wasm_bindgen]
pub struct WaveEngine {
    width: u32,
    height: u32,
    time: f32,
    real: Vec<f32>,
    imag: Vec<f32>,
    commits: Vec<Commit>,
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
        };
        e.init_plane();
        e
    }

    /// Advance backend clock. Field evolution goes here later.
    pub fn step(&mut self, dt: f32) {
        self.time += dt;
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

    /// Analytic double-slit field (Huygens): plane wave left of the wall,
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

    /// Length in f32 elements (commits * 4) for Float32Array views.
    pub fn commits_f32_len(&self) -> u32 {
        (self.commits.len() * 4) as u32
    }

    pub fn commits_ptr(&self) -> *const f32 {
        self.commits.as_ptr() as *const f32
    }

    /// Monte Carlo sampling along the observation line x_obs (uv units).
    /// Early-exits on vacuum so C -> 1 stays pure black.
    pub fn sample_commits(&mut self, x_obs: f32, n: u32, seed: u64) {
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

        // Vacuum boundary: wave has not arrived, commit nothing.
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
}

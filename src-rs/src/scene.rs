pub const GN: usize = 48;
pub const G3: usize = 24;

#[derive(Clone)]
pub struct Scene3 {
    pub n: Vec<f32>,
    pub mask: Vec<f32>,
}

pub fn preset3(id: u32, barrier: f32, sep: f32) -> Scene3 {
    let mut n = vec![1.0f32; G3 * G3 * G3];
    let mut mask = vec![0.0f32; G3 * G3 * G3];
    let b = barrier.clamp(0.05, 0.9);
    let sp = sep.clamp(0.05, 0.5);
    for z in 0..G3 {
        for y in 0..G3 {
            for x in 0..G3 {
                let u = (x as f32 + 0.5) / G3 as f32;
                let v = (y as f32 + 0.5) / G3 as f32;
                let w = (z as f32 + 0.5) / G3 as f32;
                let i = (z * G3 + y) * G3 + x;
                match id {
        0 => {}
                    1 => {
                        let d = (u - 0.55) * (u - 0.55) + (v - 0.5) * (v - 0.5) + (w - 0.5) * (w - 0.5);
                        if d < 0.0324 {
                            mask[i] = 1.0;
                        }
                    }
                    3 => {
                        let du = u - 0.45;
                        if du >= 0.0 && u <= 0.65 && v >= 0.35 && v <= 0.35 + du * 3.0 {
                            n[i] = 2.6;
                        }
                    }
                    11 => {
                        let d = (u - 0.5) * (u - 0.5) + (v - 0.5) * (v - 0.5) + (w - 0.5) * (w - 0.5);
                        if d < 0.0324 {
                            n[i] = 1.6;
                        }
                    }
                    _ => {
                        if (u - b).abs() <= 1.0 / G3 as f32 {
                            let d1 = ((v - (0.5 - sp * 0.5)) * (v - (0.5 - sp * 0.5)) + (w - 0.5) * (w - 0.5)).sqrt();
                            let d2 = ((v - (0.5 + sp * 0.5)) * (v - (0.5 + sp * 0.5)) + (w - 0.5) * (w - 0.5)).sqrt();
                            if d1 > 0.09 && d2 > 0.09 {
                                mask[i] = 1.0;
                            }
                        }
                    }
                }
            }
        }
    }
    Scene3 { n, mask }
}

#[derive(Clone)]
pub struct Scene {
    pub n: Vec<f32>,
    pub mask: Vec<f32>,
}

impl Scene {
    pub fn blank() -> Scene {
        Scene { n: vec![1.0; GN * GN], mask: vec![0.0; GN * GN] }
    }
}

pub fn preset(id: u32, barrier: f32, sep: f32, _k: f32) -> Scene {
    let mut s = Scene::blank();
    let b = barrier.clamp(0.05, 0.9);
    let sp = sep.clamp(0.05, 0.5);
    match id {
        0 => {}
        1 => {
            for iy in 0..GN {
                for ix in 0..GN {
                    let u = (ix as f32 + 0.5) / GN as f32;
                    let v = (iy as f32 + 0.5) / GN as f32;
                    let du = u - 0.55;
                    let dv = v - 0.5;
                    if du * du + dv * dv < 0.0225 {
                        s.mask[iy * GN + ix] = 1.0;
                    }
                }
            }
        }
        3 => {
            for iy in 0..GN {
                for ix in 0..GN {
                    let u = (ix as f32 + 0.5) / GN as f32;
                    let v = (iy as f32 + 0.5) / GN as f32;
                    let du = u - 0.45;
                    if du >= 0.0 && u <= 0.65 && v >= 0.35 && v <= 0.35 + du * 3.0 {
                        s.n[iy * GN + ix] = 3.0;
                    }
                }
            }
        }
        11 => {
            for iy in 0..GN {
                for ix in 0..GN {
                    let u = (ix as f32 + 0.5) / GN as f32;
                    let v = (iy as f32 + 0.5) / GN as f32;
                    let du = u - 0.5;
                    let dv = v - 0.5;
                    if du * du + dv * dv < 0.0324 {
                        s.n[iy * GN + ix] = 1.6;
                    }
                }
            }
        }
        _ => {
            let wall = 1.0 / GN as f32;
            let slit_half = 0.025;
            let y1 = 0.5 - sp * 0.5;
            let y2 = 0.5 + sp * 0.5;
            for iy in 0..GN {
                for ix in 0..GN {
                    let u = (ix as f32 + 0.5) / GN as f32;
                    let v = (iy as f32 + 0.5) / GN as f32;
                    if (u - b).abs() <= wall {
                        let d1 = (v - y1).abs();
                        let d2 = (v - y2).abs();
                        if d1 > slit_half && d2 > slit_half {
                            s.mask[iy * GN + ix] = 1.0;
                        }
                    }
                }
            }
        }
    }
    s
}



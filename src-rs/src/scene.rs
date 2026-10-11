pub const GN: usize = 48;

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
                    if du >= 0.0 && u <= 0.65 && v >= 0.35 && v <= 0.35 + du * 1.5 {
                        s.n[iy * GN + ix] = 2.2;
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

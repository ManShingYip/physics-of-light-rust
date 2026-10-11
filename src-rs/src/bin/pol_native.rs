use minifb::{Key, Window, WindowOptions};
use wave_engine::WaveEngine;

const W: usize = 768;
const H: usize = 576;
const RS: usize = 192;

fn hue_rgb(extra: f32) -> (u32, u32, u32) {
    let i = extra as i32;
    match i {
        0 => (26, 230, 230),
        1 => (255, 153, 26),
        2 => (230, 51, 204),
        4 => (255, 242, 179),
        9 => (255, 255, 255),
        _ => (153, 153, 166),
    }
}

fn main() {
    let mut engine = WaveEngine::new(96, 96);
    let mut seed = 11u64;
    let mut paused = false;
    let mut buf = vec![0u32; W * H];
    let mut window = Window::new("Physics of Light — native (CPU raster)", W, H, WindowOptions::default()).unwrap();
    let mut frame = 0u64;
    while window.is_open() && !window.is_key_down(Key::Escape) {
        if window.is_key_down(Key::Key1) { engine.set_scene(1); }
        if window.is_key_down(Key::Key2) { engine.set_scene(3); }
        if window.is_key_down(Key::Key3) { engine.set_scene(5); }
        if window.is_key_down(Key::Key4) { engine.set_scene(11); }
        if window.is_key_down(Key::Space) { paused = !paused; std::thread::sleep(std::time::Duration::from_millis(200)); }
        if window.is_key_down(Key::R) {
            engine.clear_commits();
            engine.sample_commits(0.5, 12, seed);
            seed += 1;
            std::thread::sleep(std::time::Duration::from_millis(200));
        }
        if !paused {
            engine.step(0.016);
            if frame % 45 == 0 {
                engine.spawn(4, seed);
                seed += 1;
            }
            if frame % 20 == 0 {
                engine.sample_commits(0.5, 2, seed);
                seed += 1;
            }
        }
        frame += 1;
        engine.raster();
        let rast = unsafe { std::slice::from_raw_parts(engine.raster_ptr(), RS * RS * 4) }.to_vec();
        for y in 0..H {
            for x in 0..W {
                let px = (x as f32 + 0.5) / W as f32 * RS as f32 - 0.5;
                let py = (y as f32 + 0.5) / H as f32 * RS as f32 - 0.5;
                let x0 = px.floor() as i32;
                let y0 = py.floor() as i32;
                let fx = (px - x0 as f32).clamp(0.0, 1.0);
                let fy = (py - y0 as f32).clamp(0.0, 1.0);
                let mut acc = [0.0f32; 3];
                for dy in 0..2 {
                    for dx in 0..2 {
                        let xx = (x0 + dx).clamp(0, RS as i32 - 1) as usize;
                        let yy = (y0 + dy).clamp(0, RS as i32 - 1) as usize;
                        let wx = if dx == 0 { 1.0 - fx } else { fx };
                        let wy = if dy == 0 { 1.0 - fy } else { fy };
                        let o = (yy * RS + xx) * 4;
                        acc[0] += rast[o] as f32 * wx * wy;
                        acc[1] += rast[o + 1] as f32 * wx * wy;
                        acc[2] += rast[o + 2] as f32 * wx * wy;
                    }
                }
                buf[y * W + x] = ((acc[0] as u32) << 16) | ((acc[1] as u32) << 8) | (acc[2] as u32);
            }
        }
        engine.project_splats(false);
        let sl = unsafe { std::slice::from_raw_parts(engine.splats_ptr(), engine.splats_len() as usize * 4) }.to_vec();
        for i in (0..sl.len()).step_by(4) {
            let u = sl[i];
            let v = sl[i + 1];
            if !(0.0..=1.0).contains(&u) || !(0.0..=1.0).contains(&v) {
                continue;
            }
            let (r, g, b) = hue_rgb(sl[i + 3]);
            let cx = (u * W as f32) as i32;
            let cy = (v * H as f32) as i32;
            let rad = if sl[i + 3] >= 1000.0 { 1 } else { 2 };
            for dy in -rad..=rad {
                for dx in -rad..=rad {
                    let xx = cx + dx;
                    let yy = cy + dy;
                    if xx >= 0 && xx < W as i32 && yy >= 0 && yy < H as i32 {
                        buf[yy as usize * W + xx as usize] = ((r) << 16) | ((g) << 8) | b;
                    }
                }
            }
        }
        let nc = engine.commits_len() as usize;
        let cv = unsafe { std::slice::from_raw_parts(engine.commits_ptr(), nc * 4) }.to_vec();
        let mut bins = [0u32; 24];
        for i in 0..nc {
            let b = ((cv[i * 4 + 1] * 24.0) as usize).min(23);
            bins[b] += 1;
        }
        for b in 0..24 {
            let lvl = (bins[b].min(10) as f32 / 10.0 * (W as f32 * 0.06)) as i32;
            for y in (b * H / 24)..((b + 1) * H / 24 - 1) {
                for x in (W - W / 16)..(W - W / 16 + lvl as usize).min(W) {
                    buf[y * W + x] = 0x33e6ff;
                }
            }
        }
        window.update_with_buffer(&buf, W, H).unwrap();
    }
}

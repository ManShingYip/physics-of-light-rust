use wave_engine::WaveEngine;

fn hue(h: f32) -> [f32; 3] {
    let f = |x: f32| {
        let t = ((((x % 1.0) + 1.0) % 1.0) * 6.0 - 3.0).abs() - 1.0;
        t.clamp(0.0, 1.0)
    };
    [f(h), f(h + 2.0 / 3.0), f(h + 1.0 / 3.0)]
}

fn main() {
    let mut e = WaveEngine::new(96, 96);
    e.set_scene(5);
    for _ in 0..1200 {
        e.step(0.016);
    }
    let w = e.width() as usize;
    let h = e.height() as usize;
    unsafe {
        let re = std::slice::from_raw_parts(e.real_ptr(), e.real_len() as usize);
        let im = std::slice::from_raw_parts(e.imag_ptr(), e.imag_len() as usize);
        let mut line = String::new();
        for x in 0..40 {
            let i = 48 * w + x;
            line.push_str(&format!("{:.3} ", (re[i] * re[i] + im[i] * im[i]).sqrt()));
        }
        println!("row48 amp: {}", line);
        let mut out: Vec<u8> = Vec::with_capacity(w * h * 3);
        for i in 0..w * h {
            let rho = re[i] * re[i] + im[i] * im[i];
            let phase = im[i].atan2(re[i]);
            let hh = phase / std::f32::consts::TAU + 0.5;
            let [r, g, b] = hue(hh);
            let v = (rho * 0.8).clamp(0.0, 0.8);
            out.push((r * v * 255.0) as u8);
            out.push((g * v * 255.0) as u8);
            out.push((b * v * 255.0) as u8);
        }
        std::fs::write("dump.raw", out).unwrap();
    }
    println!("dumped {}x{}", w, h);
}

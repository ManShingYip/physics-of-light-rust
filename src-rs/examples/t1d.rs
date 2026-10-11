fn main() {
    let w = 200usize;
    let cdt = 0.10f32;
    let q = 1.545f32;
    let omega = (4.0 * cdt * (q / 2.0).sin().powi(2)).asin();
    let mut re = vec![0.0f32; w];
    let mut im = vec![0.0f32; w];
    for x in 0..w {
        let env = (-((x as f32 - 60.0) / 8.0).powi(2)).exp();
        let ph = q * x as f32;
        re[x] = env * ph.cos();
        im[x] = env * ph.sin();
    }
    let mut pre = re.clone();
    let mut pim = im.clone();
    // start with psi_{-1} = psi_0 * e^{+i omega} so packet moves forward
    for x in 0..w {
        let c = omega.cos();
        let s = omega.sin();
        pre[x] = re[x] * c + im[x] * s;
        pim[x] = -re[x] * s + im[x] * c;
    }
    for step in 0..150 {
        let mut nr = re.clone();
        let mut ni = im.clone();
        for x in 0..w {
            let xm = x.saturating_sub(1);
            let xp = (x + 1).min(w - 1);
            let lr = re[xm] + re[xp] - 2.0 * re[x];
            let li = im[xm] + im[xp] - 2.0 * im[x];
            nr[x] = pre[x] - 2.0 * cdt * li;
            ni[x] = pim[x] + 2.0 * cdt * lr;
        }
        pre.copy_from_slice(&re);
        pim.copy_from_slice(&im);
        re.copy_from_slice(&nr);
        im.copy_from_slice(&ni);
        if step == 149 {
            let mut line = String::new();
            for x in (0..200).step_by(5) {
                line.push_str(&format!("{:.2} ", (re[x] * re[x] + im[x] * im[x]).sqrt()));
            }
            println!("omega={:.4} packet: {}", omega, line);
        }
    }
}

fn main() {
    let e = wave_engine::WaveEngine::new(96, 96);
    let j = e.run_unity(1200);
    let mut buf = String::from("[");
    buf.push_str(&j);
    buf.push(']');
    let rows: Vec<&str> = buf.split("{\"env\":").skip(1).collect();
    for r in rows {
        let env = r.split(|c: char| !c.is_ascii_digit()).next().unwrap_or("?");
        print!("env {}: ", env);
        for cell in r.split("{\"f\":\"").skip(1) {
            let name = cell.split('"').next().unwrap_or("?");
            let pass = cell.split("\"pass\":").nth(1).map(|s| s.starts_with("true")).unwrap_or(false);
            print!("{}={} ", name, if pass { 'P' } else { 'f' });
        }
        println!();
    }
}

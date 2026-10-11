fn main() {
    let e = wave_engine::WaveEngine::new(96, 96);
    let j = e.run_unity(240);
    let mut env = '?';
    let mut line = String::new();
    for (i, chunk) in j.split("{\"f\":\"").enumerate() {
        if let Some(p) = chunk.find("\"env\":") {
            env = chunk[p + 6..p + 7].chars().next().unwrap_or('?');
            if i > 0 {
                println!("{}", line);
            }
            line = format!("env {}: ", env);
        }
        if i == 0 {
            continue;
        }
        let name = chunk.split('"').next().unwrap_or("?");
        let pass = chunk.contains("\"pass\":true");
        line.push_str(&format!("{}={} ", name, if pass { 'P' } else { 'f' }));
    }
    println!("{}", line);
}

fn main() {
    let mut e = wave_engine::WaveEngine::new(64, 64);
    e.set_scene(5);
    for _ in 0..150 {
        e.step(0.016);
    }
    e.spawn(300, 777);
    for _ in 0..1200 {
        e.step(0.016);
        e.kill_in_mask();
    }
    println!("alive={} trails={} commits~ n/a", e.particles_len(), e.trails_len());
}

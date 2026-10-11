use wave_engine::WaveEngine;

fn crc32(buf: &[u8]) -> u32 {
    let mut c: u32 = 0xffff_ffff;
    for &b in buf {
        c ^= b as u32;
        for _ in 0..8 {
            c = (c >> 1) ^ (0xedb8_8320 & (c & 1).wrapping_neg());
        }
    }
    !c
}

fn chunk(kind: &[u8; 4], data: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    out.extend_from_slice(&(data.len() as u32).to_be_bytes());
    out.extend_from_slice(kind);
    out.extend_from_slice(data);
    let mut crc = Vec::new();
    crc.extend_from_slice(kind);
    crc.extend_from_slice(data);
    out.extend_from_slice(&crc32(&crc).to_be_bytes());
    out
}

fn png(path: &str, w: u32, h: u32, rgba: &[u8]) {
    let mut idat = Vec::with_capacity(rgba.len() + h as usize);
    for y in 0..h as usize {
        idat.push(0);
        idat.extend_from_slice(&rgba[y * w as usize * 4..(y + 1) * w as usize * 4]);
    }
    let mut comp = Vec::new();
    comp.push(0x78);
    comp.push(0x01);
    let mut i = 0usize;
    while i < idat.len() {
        let n = (idat.len() - i).min(65535);
        let last = i + n >= idat.len();
        comp.push(if last { 1 } else { 0 });
        comp.extend_from_slice(&(n as u16).to_le_bytes());
        comp.extend_from_slice(&(!n as u16).to_le_bytes());
        comp.extend_from_slice(&idat[i..i + n]);
        i += n;
    }
    let mut adler: u32 = 1;
    let mut a: u32 = 0;
    for &b in &idat {
        a = (a + b as u32) % 65521;
        adler = (adler + a) % 65521;
    }
    comp.extend_from_slice(&((adler << 16) | a).to_be_bytes());
    let mut ihdr = Vec::new();
    ihdr.extend_from_slice(&w.to_be_bytes());
    ihdr.extend_from_slice(&h.to_be_bytes());
    ihdr.push(8);
    ihdr.push(6);
    ihdr.push(0);
    ihdr.push(0);
    ihdr.push(0);
    let mut out = Vec::new();
    out.extend_from_slice(&[0x89, b'P', b'N', b'G', 0x0d, 0x0a, 0x1a, 0x0a]);
    out.extend_from_slice(&chunk(b"IHDR", &ihdr));
    out.extend_from_slice(&chunk(b"IDAT", &comp));
    out.extend_from_slice(&chunk(b"IEND", &[]));
    std::fs::write(path, out).unwrap();
}

fn main() {
    std::fs::create_dir_all("frames").unwrap();
    let mut e = WaveEngine::new(96, 96);
    e.set_scene(5);
    let mut seed = 3u64;
    let mut n = 0u32;
    for step in 0..360 {
        e.step(0.016);
        if step % 20 == 0 {
            e.sample_commits(0.5, 4, seed);
            seed += 1;
        }
        if step % 12 == 0 {
            e.raster();
            let rgba = unsafe { std::slice::from_raw_parts(e.raster_ptr(), e.raster_len() as usize) }.to_vec();
            png(&format!("frames/f{:03}.png", n), 192, 192, &rgba);
            n += 1;
        }
    }
    println!("wrote {} frames to frames/ (assemble: ffmpeg -framerate 8 -i frames/f%03d.png out.mp4)", n);
}

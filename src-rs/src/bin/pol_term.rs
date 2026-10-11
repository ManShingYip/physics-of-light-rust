use std::io::Write;
use std::time::{Duration, Instant};
use wave_engine::WaveEngine;

#[link(name = "kernel32")]
unsafe extern "system" {
    fn GetStdHandle(n: i32) -> isize;
    fn GetConsoleMode(h: isize, m: *mut u32) -> i32;
    fn SetConsoleMode(h: isize, m: u32) -> i32;
    fn GetNumberOfConsoleInputEvents(h: isize, n: *mut u32) -> i32;
    fn ReadConsoleInputW(h: isize, rec: *mut u8, len: u32, read: *mut u32) -> i32;
}

const STD_IN: i32 = -10;
const STD_OUT: i32 = -11;
const VT: u32 = 0x0004;
const CW: usize = 120;
const CH: usize = 44;

struct Con {
    hin: isize,
    hout: isize,
    old_in: u32,
    old_out: u32,
}

impl Con {
    fn enter() -> Con {
        unsafe {
            let hin = GetStdHandle(STD_IN);
            let hout = GetStdHandle(STD_OUT);
            let mut mi = 0u32;
            let mut mo = 0u32;
            GetConsoleMode(hin, &mut mi);
            GetConsoleMode(hout, &mut mo);
            SetConsoleMode(hin, 0);
            SetConsoleMode(hout, mo | VT);
            print!("\x1b[2J\x1b[?25l");
            Con { hin, hout, old_in: mi, old_out: mo }
        }
    }
    fn key(&self) -> Option<char> {
        unsafe {
            let mut n = 0u32;
            GetNumberOfConsoleInputEvents(self.hin, &mut n);
            if n == 0 {
                return None;
            }
            let mut rec = [0u8; 20];
            let mut rd = 0u32;
            ReadConsoleInputW(self.hin, rec.as_mut_ptr(), 1, &mut rd);
            if rd == 0 || rec[0] != 1 {
                return None;
            }
            let down = i32::from_le_bytes([rec[4], rec[5], rec[6], rec[7]]);
            let uni = u16::from_le_bytes([rec[14], rec[15]]);
            if down == 1 && uni >= 32 {
                char::from_u32(uni as u32)
            } else {
                None
            }
        }
    }
}

impl Drop for Con {
    fn drop(&mut self) {
        unsafe {
            SetConsoleMode(self.hin, self.old_in);
            SetConsoleMode(self.hout, self.old_out);
            print!("\x1b[0m\x1b[2J\x1b[?25h");
        }
    }
}

fn main() {
    let mut engine = WaveEngine::new(96, 96);
    let mut seed = 5u64;
    let mut paused = false;
    let con = Con::enter();
    let mut frame = 0u64;
    let mut out = Vec::<u8>::with_capacity(CW * CH * 32);
    loop {
        let t0 = Instant::now();
        while let Some(c) = con.key() {
            match c {
                'q' => return,
                '1' => engine.set_scene(1),
                '2' => engine.set_scene(3),
                '3' => engine.set_scene(5),
                '4' => engine.set_scene(11),
                'r' => {
                    engine.clear_commits();
                    engine.sample_commits(0.5, 12, seed);
                    seed += 1;
                }
                ' ' => paused = !paused,
                _ => {}
            }
        }
        if !paused {
            engine.step(0.016);
            if frame % 40 == 0 {
                engine.spawn(3, seed);
                seed += 1;
            }
            if frame % 20 == 0 {
                engine.sample_commits(0.5, 2, seed);
                seed += 1;
            }
        }
        frame += 1;
        engine.raster();
        let rast = unsafe { std::slice::from_raw_parts(engine.raster_ptr(), 192 * 192 * 4) }.to_vec();
        out.clear();
        out.extend_from_slice(b"\x1b[H");
        for row in 0..CH {
            for col in 0..CW {
                let u = (col as f32 + 0.5) / CW as f32;
                let v = (row as f32 * 2.0 + 1.0) / (CH as f32 * 2.0);
                let px = (u * 192.0) as usize % 192;
                let py = (v * 192.0) as usize % 192;
                let o = (py * 192 + px) * 4;
                let o2 = (((py + 1) % 192) * 192 + px) * 4;
                out.extend_from_slice(format!("\x1b[38;2;{};{};{}m\x1b[48;2;{};{};{}m\u{2580}", rast[o], rast[o + 1], rast[o + 2], rast[o2], rast[o2 + 1], rast[o2 + 2]).as_bytes());
            }
            out.extend_from_slice(b"\x1b[0m\r\n");
        }
        out.extend_from_slice(
            format!(
                "t={:.1} commits={} scene={} [1-4]scene [r]esample [space]pause [q]uit   ",
                engine.time(),
                engine.commits_len(),
                engine.scene_id()
            )
            .as_bytes(),
        );
        let _ = std::io::stdout().write_all(&out);
        let _ = std::io::stdout().flush();
        let dt = t0.elapsed();
        if dt < Duration::from_millis(33) {
            std::thread::sleep(Duration::from_millis(33) - dt);
        }
    }
}

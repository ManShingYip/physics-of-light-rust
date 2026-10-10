// wave_blend.wgsl — Frontend render pass: Pending ghost field -> Committed dots.
// color = (1 - C) * ghost + C * particle_dot, C = smoothstep around x_obs.
// Ghost samples the TRUE Rust field (bindings 2/3); wall drawn from same params.

struct ObsParams {
    obs_line_x: f32,
    obs_width: f32,
    dot_radius: f32,
    num_commits: u32,
    field_w: u32,
    field_h: u32,
    time: f32,
    _pad0: f32,
    barrier_x: f32,
    slit_y1: f32,
    slit_y2: f32,
    hist_on: f32,
};

struct CommitEvent {
    pos: vec2<f32>,
    timestamp: f32,
    _pad: f32,
};

struct VsOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@group(0) @binding(0) var<uniform> params: ObsParams;
@group(0) @binding(1) var<storage, read> commits: array<CommitEvent>;
@group(0) @binding(2) var<storage, read> field_real: array<f32>;
@group(0) @binding(3) var<storage, read> field_imag: array<f32>;

@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> VsOut {
    var p = array<vec2<f32>, 3>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(3.0, -1.0),
        vec2<f32>(-1.0, 3.0),
    );
    var out: VsOut;
    out.pos = vec4<f32>(p[vi], 0.0, 1.0);
    // uv in [0,1]^2, origin top-left to match 2D canvas convention.
    out.uv = vec2<f32>(p[vi].x * 0.5 + 0.5, 1.0 - (p[vi].y * 0.5 + 0.5));
    return out;
}

// True backend field, nearest-neighbour. Falls back to plane wave if empty.
fn sample_wave_field(uv: vec2<f32>) -> vec2<f32> {
    if (params.field_w == 0u || params.field_h == 0u) {
        return vec2<f32>(sin(uv.x * 20.0), cos(uv.x * 20.0));
    }
    let ix = clamp(u32(uv.x * f32(params.field_w)), 0u, params.field_w - 1u);
    let iy = clamp(u32(uv.y * f32(params.field_h)), 0u, params.field_h - 1u);
    let idx = iy * params.field_w + ix;
    return vec2<f32>(field_real[idx], field_imag[idx]);
}

fn phase_to_rgb(phase: f32, rho: f32) -> vec3<f32> {
    let h = (phase / 6.2831853) + 0.5;
    let r = clamp(abs(fract(h) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    let g = clamp(abs(fract(h + 2.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    let b = clamp(abs(fract(h + 1.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    // Ghost look: dim, semi-transparent feel via low intensity.
    return vec3<f32>(r, g, b) * clamp(rho * 0.8, 0.0, 0.8);
}

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let x = uv.x;

    // Fix: smoothstep degenerates when width -> 0.
    let w = max(params.obs_width, 1e-4);
    let half_w = w * 0.5;
    let C = smoothstep(params.obs_line_x - half_w, params.obs_line_x + half_w, x);

    let psi = sample_wave_field(uv);
    let rho = psi.x * psi.x + psi.y * psi.y;
    let phase = atan2(psi.y, psi.x);
    var ghost_color = phase_to_rgb(phase, rho);

    // Double-slit wall: dark band except at the two slit gaps.
    let wall_half = 0.004;
    let slit_half = 0.025;
    let wall_band = 1.0 - step(wall_half, abs(uv.x - params.barrier_x));
    let open1 = 1.0 - step(slit_half, abs(uv.y - params.slit_y1));
    let open2 = 1.0 - step(slit_half, abs(uv.y - params.slit_y2));
    let wall = wall_band * (1.0 - clamp(open1 + open2, 0.0, 1.0));
    ghost_color = ghost_color * (1.0 - wall * 0.95);

    var dot_intensity = 0.0;
    for (var i = 0u; i < params.num_commits; i = i + 1u) {
        if (i >= 256u) {
            break;
        }
        let p = commits[i].pos;
        let dist = distance(uv, p);
        if (dist < params.dot_radius * 2.0) {
            let norm_d = dist / params.dot_radius;
            dot_intensity += exp(-norm_d * norm_d * 3.0);
        }
    }
    // No commits nearby -> strictly vec3(0): C -> 1 renders pure black.
    let particle_color = vec3<f32>(1.0, 1.0, 1.0) * clamp(dot_intensity, 0.0, 1.0);

    var rgb = (1.0 - C) * ghost_color + C * particle_color;

    // Fringe histogram: commits accumulate into visible interference bands.
    // Right-edge strip bins commit y-positions; bar length = bin population.
    if (params.hist_on > 0.5 && uv.x > 0.94) {
        let bins = 24.0;
        let bin = u32(clamp(uv.y * bins, 0.0, bins - 1.0));
        var count = 0.0;
        for (var j = 0u; j < params.num_commits; j = j + 1u) {
            if (j >= 256u) {
                break;
            }
            let cy = commits[j].pos.y;
            if (cy >= f32(bin) / bins && cy < (f32(bin) + 1.0) / bins) {
                count += 1.0;
            }
        }
        let level = clamp(count / 10.0, 0.0, 1.0);
        let frac = (uv.x - 0.94) / 0.06;
        var bar = vec3<f32>(0.02, 0.03, 0.05);
        if (frac < level) {
            bar = vec3<f32>(0.2, 0.9, 1.0) * (0.4 + 0.6 * level);
        }
        rgb = bar;
    }

    // Opaque black background: alpha stays 1 so empty committed zones go dark.
    return vec4<f32>(rgb, 1.0);
}

// wave_blend.wgsl — Frontend render pass (contract v3, 80B uniform).
// Modes via params.flags: bit0 = dims ladder, bit1 = duel, bit2 = force arrows.

struct ObsParams {
    obs_line_x: f32,
    obs_width: f32,
    dot_radius: f32,
    num_commits: u32,
    field_w: u32,
    field_h: u32,
    time: f32,
    num_trails: u32,
    barrier_x: f32,
    slit_y1: f32,
    slit_y2: f32,
    hist_on: f32,
    flags: u32,
    pol_a: f32,
    pol_b: f32,
    pad0: f32,
    pad1: f32,
    pad2: f32,
    pad3: f32,
    pad4: f32,
};

struct CommitEvent {
    pos: vec2<f32>,
    timestamp: f32,
    _pad: f32,
};

struct TrailEvent {
    pos: vec2<f32>,
    hue: u32,
    age: f32,
};

struct VsOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@group(0) @binding(0) var<uniform> params: ObsParams;
@group(0) @binding(1) var<storage, read> commits: array<CommitEvent>;
@group(0) @binding(2) var<storage, read> field_real: array<f32>;
@group(0) @binding(3) var<storage, read> field_imag: array<f32>;
@group(0) @binding(4) var<storage, read> n_grid: array<f32>;
@group(0) @binding(5) var<storage, read> mask_grid: array<f32>;
@group(0) @binding(6) var<storage, read> trails: array<TrailEvent>;
@group(0) @binding(7) var<storage, read> force_grid: array<f32>;
@group(0) @binding(8) var<storage, read> dims_buf: array<f32>;

@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> VsOut {
    var p = array<vec2<f32>, 3>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(3.0, -1.0),
        vec2<f32>(-1.0, 3.0),
    );
    var out: VsOut;
    out.pos = vec4<f32>(p[vi], 0.0, 1.0);
    out.uv = vec2<f32>(p[vi].x * 0.5 + 0.5, 1.0 - (p[vi].y * 0.5 + 0.5));
    return out;
}

fn hue_of(i: u32) -> vec3<f32> {
    switch i {
        case 0u: { return vec3<f32>(0.1, 0.9, 0.9); }
        case 1u: { return vec3<f32>(1.0, 0.6, 0.1); }
        case 2u: { return vec3<f32>(0.9, 0.2, 0.8); }
        default: { return vec3<f32>(0.6, 0.6, 0.65); }
    }
}

fn phase_to_rgb(phase: f32, rho: f32) -> vec3<f32> {
    let h = (phase / 6.2831853) + 0.5;
    let r = clamp(abs(fract(h) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    let g = clamp(abs(fract(h + 2.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    let b = clamp(abs(fract(h + 1.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    return vec3<f32>(r, g, b) * clamp(rho * 0.8, 0.0, 0.8);
}

// dims_buf layout (interleaved re,im per cell):
// d1: off 0, 128 cells | d2: off 128, 64x64 | d3: off 4224, 24^3 | d4: off 18048, 12^4
fn dims_sample(panel: u32, lx: f32, ly: f32) -> vec2<f32> {
    var idx = 0u;
    var off = 0u;
    if (panel == 0u) {
        off = 0u;
        idx = clamp(u32(lx * 128.0), 0u, 127u);
    } else if (panel == 1u) {
        off = 128u;
        idx = clamp(u32(ly * 64.0), 0u, 63u) * 64u + clamp(u32(lx * 64.0), 0u, 63u);
    } else if (panel == 2u) {
        off = 4224u;
        idx = 12u * 576u + clamp(u32(ly * 24.0), 0u, 23u) * 24u + clamp(u32(lx * 24.0), 0u, 23u);
    } else {
        off = 18048u;
        idx = 6u * 1728u + 6u * 144u + clamp(u32(ly * 12.0), 0u, 11u) * 12u + clamp(u32(lx * 12.0), 0u, 11u);
    }
    let base = (off + idx) * 2u;
    return vec2<f32>(dims_buf[base], dims_buf[base + 1u]);
}

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let dims_on = (params.flags & 1u) != 0u;
    let duel_on = (params.flags & 2u) != 0u;
    let arrows_on = (params.flags & 4u) != 0u;

    if (dims_on) {
        let px = uv.x * 4.0;
        let panel = u32(floor(px));
        let lx = fract(px);
        let psi = dims_sample(panel, lx, uv.y);
        let rho = psi.x * psi.x + psi.y * psi.y;
        var col = phase_to_rgb(atan2(psi.y, psi.x), rho);
        if (panel == 0u) {
            let band = abs(uv.y - 0.5) < 0.18;
            col = col * select(0.08, 1.0, band);
        }
        let sep = fract(px) < 0.008;
        col = col * select(1.0, 0.0, sep);
        return vec4<f32>(col, 1.0);
    }

    let x = uv.x;
    let w = max(params.obs_width, 1e-4);
    let half_w = w * 0.5;
    let C = smoothstep(params.obs_line_x - half_w, params.obs_line_x + half_w, x);

    let psi = sample_field(uv);
    let rho = psi.x * psi.x + psi.y * psi.y;
    let phase = atan2(psi.y, psi.x);
    var ghost_color = phase_to_rgb(phase, rho);

    let mi = clamp(u32(uv.y * 48.0), 0u, 47u) * 48u + clamp(u32(uv.x * 48.0), 0u, 47u);
    let m = mask_grid[mi];
    ghost_color = ghost_color * (1.0 - m * 0.95);
    let nn = n_grid[mi];
    ghost_color = ghost_color * (1.0 + (nn - 1.0) * 0.6) + vec3<f32>(0.01, 0.015, 0.03) * (nn - 1.0);

    if (arrows_on) {
        let lc = fract(uv * 48.0) - 0.5;
        let fo = mi * 10u + 8u;
        let fv = vec2<f32>(force_grid[fo], force_grid[fo + 1u]);
        let fl = length(fv);
        if (fl > 1e-7) {
            let dir = fv / fl;
            let len = clamp(fl * 60.0, 0.05, 0.4);
            let t = clamp(dot(lc, dir), 0.0, len);
            let dseg = length(lc - dir * t);
            let head = length(lc - dir * len);
            let shaft = smoothstep(0.07, 0.03, dseg);
            let tip = smoothstep(0.12, 0.05, head);
            ghost_color += vec3<f32>(1.0, 1.0, 1.0) * max(shaft, tip) * 0.22 * (1.0 - m);
        }
    }

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
    let particle_color = vec3<f32>(1.0, 1.0, 1.0) * clamp(dot_intensity, 0.0, 1.0);

    var trail_col = vec3<f32>(0.0);
    for (var ti = 0u; ti < params.num_trails; ti = ti + 1u) {
        if (ti >= 1024u) {
            break;
        }
        let tr = trails[ti];
        let td = distance(uv, tr.pos);
        if (td < 0.008) {
            let fade = clamp(1.0 - tr.age / 1.5, 0.0, 1.0);
            trail_col += hue_of(tr.hue) * fade * exp(-td * td / 0.00002) * 0.35;
        }
    }

    var g = ghost_color;
    var tr_gain = 1.0;
    if (duel_on && uv.x > 0.5) {
        g = g * 0.12;
        tr_gain = 2.2;
    }
    var rgb = (1.0 - C) * g + C * particle_color;
    rgb += trail_col * (1.0 - C) * tr_gain;

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

    return vec4<f32>(rgb, 1.0);
}

fn sample_field(uv: vec2<f32>) -> vec2<f32> {
    if (params.field_w == 0u || params.field_h == 0u) {
        return vec2<f32>(sin(uv.x * 20.0), cos(uv.x * 20.0));
    }
    let ix = clamp(u32(uv.x * f32(params.field_w)), 0u, params.field_w - 1u);
    let iy = clamp(u32(uv.y * f32(params.field_h)), 0u, params.field_h - 1u);
    let idx = iy * params.field_w + ix;
    return vec2<f32>(field_real[idx], field_imag[idx]);
}

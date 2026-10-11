// wave_blend.wgsl â€” contract v4 (80B uniform, 12 bindings, 2 pipelines).
// flags bits: 1 dims, 2 duel, 4 arrows, 8 proj, 16 pol, 32 dim3, 64 R1slice, 128 R2points.

struct ObsParams {
    obs_line_x: f32,
    obs_width: f32,
    dot_radius: f32,
    num_splats: u32,
    field_w: u32,
    field_h: u32,
    time: f32,
    res3: u32,
    barrier_x: f32,
    slit_y1: f32,
    slit_y2: f32,
    hist_on: f32,
    flags: u32,
    pol_a: f32,
    pol_b: f32,
    yaw: f32,
    pitch: f32,
    dist: f32,
    panx: f32,
    pany: f32,
};

struct CommitEvent {
    pos: vec2<f32>,
    timestamp: f32,
    z: f32,
};

struct Splat {
    uv: vec2<f32>,
    depth: f32,
    extra: f32,
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
@group(0) @binding(6) var<storage, read> field3: array<f32>;
@group(0) @binding(7) var<storage, read> force_grid: array<f32>;
@group(0) @binding(8) var<storage, read> dims_buf: array<f32>;
@group(0) @binding(9) var<storage, read> proj_buf: array<f32>;
@group(0) @binding(10) var<storage, read> disp_rgb: array<f32>;

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
        case 4u: { return vec3<f32>(1.0, 0.95, 0.7); }
        case 9u: { return vec3<f32>(1.0, 1.0, 1.0); }
        default: { return vec3<f32>(0.6, 0.6, 0.65); }
    }
}

fn phase_to_rgb(phase: f32, rho: f32) -> vec3<f32> {
    let h = (phase / 6.2831853) + 0.5;
    let r = clamp(abs(fract(h) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    let g = clamp(abs(fract(h + 2.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    let b = clamp(abs(fract(h + 1.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    // soft-knee tone map: no clipping, no checkerboard blowout
    let v = rho / (rho + 0.85);
    return vec3<f32>(r, g, b) * (v * 1.35);
}

fn sample_field(uv: vec2<f32>) -> vec2<f32> {
    if (params.field_w == 0u || params.field_h == 0u) {
        return vec2<f32>(sin(uv.x * 20.0), cos(uv.x * 20.0));
    }
    let fw = f32(params.field_w);
    let fh = f32(params.field_h);
    let p = vec2<f32>(uv.x * fw - 0.5, uv.y * fh - 0.5);
    let i0 = vec2<u32>(u32(max(floor(p.x), 0.0)), u32(max(floor(p.y), 0.0)));
    let f = clamp(p - vec2<f32>(floor(p.x), floor(p.y)), vec2<f32>(0.0), vec2<f32>(1.0));
    let ix1 = min(i0.x + 1u, params.field_w - 1u);
    let iy1 = min(i0.y + 1u, params.field_h - 1u);
    let a = vec2<f32>(field_real[i0.y * params.field_w + i0.x], field_imag[i0.y * params.field_w + i0.x]);
    let b = vec2<f32>(field_real[i0.y * params.field_w + ix1], field_imag[i0.y * params.field_w + ix1]);
    let c = vec2<f32>(field_real[iy1 * params.field_w + i0.x], field_imag[iy1 * params.field_w + i0.x]);
    let d = vec2<f32>(field_real[iy1 * params.field_w + ix1], field_imag[iy1 * params.field_w + ix1]);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

fn sample_field3(p: vec3<f32>) -> vec2<f32> {
    let r = params.res3;
    if (r == 0u) {
        return vec2<f32>(0.0, 0.0);
    }
    let ix = clamp(u32(p.x * f32(r)), 0u, r - 1u);
    let iy = clamp(u32(p.y * f32(r)), 0u, r - 1u);
    let iz = clamp(u32(p.z * f32(r)), 0u, r - 1u);
    let idx = ((iz * r + iy) * r + ix) * 2u;
    return vec2<f32>(field3[idx], field3[idx + 1u]);
}

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

fn cam_basis() -> mat3x3<f32> {
    let cy = cos(params.yaw);
    let sy = sin(params.yaw);
    let cp = cos(params.pitch);
    let sp = sin(params.pitch);
    let fwd = -vec3<f32>(cp * cy, cp * sy, sp);
    let up0 = vec3<f32>(0.0, 0.0, 1.0);
    let right = normalize(cross(fwd, up0));
    let up = cross(right, fwd);
    return mat3x3<f32>(right, up, fwd);
}

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let dims_on = (params.flags & 1u) != 0u;
    let duel_on = (params.flags & 2u) != 0u;
    let arrows_on = (params.flags & 4u) != 0u;
    let proj_on = (params.flags & 8u) != 0u;
    let pol_on = (params.flags & 16u) != 0u;
    let dim3_on = (params.flags & 32u) != 0u;
    let disp_on = (params.flags & 256u) != 0u;
    let r1 = (params.flags & 64u) != 0u;
    let r2 = (params.flags & 128u) != 0u;

    if (dims_on) {
        let px = uv.x * 4.0;
        let panel = u32(floor(px));
        let lx = fract(px);
        let psi = dims_sample(panel, lx, uv.y);
        let rho = psi.x * psi.x + psi.y * psi.y;
        var col = phase_to_rgb(atan2(psi.y, psi.x), rho);
        if (panel == 0u) {
            col = col * select(0.08, 1.0, abs(uv.y - 0.5) < 0.18);
        }
        col = col * select(1.0, 0.0, fract(px) < 0.008);
        return vec4<f32>(col, 1.0);
    }

    if (proj_on) {
        let px = uv.x * 4.0;
        let panel = u32(floor(px));
        let lx = fract(px);
        let fi = clamp(u32(lx * 96.0), 0u, 95u);
        let fj = clamp(u32(uv.y * 96.0), 0u, 95u);
        let idx = fj * 96u + fi;
        var col = vec3<f32>(0.0);
        if (panel == 0u) {
            let psi = sample_field(uv);
            col = phase_to_rgb(atan2(psi.y, psi.x), psi.x * psi.x + psi.y * psi.y);
        } else if (panel == 1u) {
            col = vec3<f32>(0.1, 0.7, 0.9) * pow(proj_buf[idx], 0.35);
        } else if (panel == 2u) {
            let v = proj_buf[9216u + idx];
            col = select(vec3<f32>(0.2, 0.4, 1.0) * -v, vec3<f32>(1.0, 0.5, 0.1) * v, v > 0.0);
        } else {
            col = vec3<f32>(0.9, 0.9, 0.8) * pow(proj_buf[18432u + idx], 0.5);
        }
        col = col * select(1.0, 0.0, fract(px) < 0.008);
        return vec4<f32>(col, 1.0);
    }

    var rgb = vec3<f32>(0.0);

    if (dim3_on) {
        if (r2) {
            rgb = vec3<f32>(0.0);
        } else if (r1) {
            let band = u32(floor(uv.y * 3.0));
            let zz = (f32(band) + 0.5) / 3.0;
            let psi = sample_field3(vec3<f32>(uv.x, fract(uv.y * 3.0), zz));
            rgb = phase_to_rgb(atan2(psi.y, psi.x), psi.x * psi.x + psi.y * psi.y);
            rgb = rgb * select(1.0, 0.0, fract(uv.y * 3.0) < 0.01);
        } else {
            let basis = cam_basis();
            let tgt = vec3<f32>(0.5 + params.panx, 0.5 + params.pany, 0.5);
            let eye = tgt - basis[2] * params.dist;
            let ndc = (uv - 0.5) * 2.0;
            let dir = normalize(basis[0] * ndc.x * 0.5 + basis[1] * (-ndc.y) * 0.5 + basis[2]);
            var t = 0.05;
            var trans = 1.0;
            var acc = vec3<f32>(0.0);
            for (var s = 0; s < 40; s = s + 1) {
                let p = eye + dir * t;
                if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z < 0.0 || p.z > 1.0) {
                    break;
                }
                let psi = sample_field3(p);
                let rho = psi.x * psi.x + psi.y * psi.y;
                let emit = rho * 0.09;
                if (emit > 0.002) {
                    acc += trans * emit * phase_to_rgb(atan2(psi.y, psi.x), 1.0);
                    trans *= 1.0 - emit * 0.8;
                }
                t += 0.024;
                if (trans < 0.05 || t > 3.0) {
                    break;
                }
            }
            rgb = acc;
        }
    } else {
        let x = uv.x;
        let w = max(params.obs_width, 1e-4);
        let C = smoothstep(params.obs_line_x - w * 0.5, params.obs_line_x + w * 0.5, x);
        let psi = sample_field(uv);
        let rho = psi.x * psi.x + psi.y * psi.y;
        var ghost_color = phase_to_rgb(atan2(psi.y, psi.x), rho);
        if (disp_on) {
            let di = clamp(u32(uv.y * 96.0), 0u, 95u) * 96u + clamp(u32(uv.x * 96.0), 0u, 95u);
            let dc = vec3<f32>(disp_rgb[di * 3u], disp_rgb[di * 3u + 1u], disp_rgb[di * 3u + 2u]);
            ghost_color = dc;
        }
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
                let t2 = clamp(dot(lc, dir), 0.0, len);
                let shaft = smoothstep(0.07, 0.03, length(lc - dir * t2));
                let tip = smoothstep(0.12, 0.05, length(lc - dir * len));
                ghost_color += vec3<f32>(1.0) * max(shaft, tip) * 0.22 * (1.0 - m);
            }
        }
        if (pol_on) {
            let in1 = uv.x > 0.42 && uv.x < 0.46;
            let in2 = uv.x > 0.54 && uv.x < 0.58;
            if (in1 || in2) {
                let ang = select(params.pol_a, params.pol_b, in2);
                let line = fract((uv.x * cos(ang) + uv.y * sin(ang)) * 60.0);
                ghost_color = ghost_color * 0.4 + vec3<f32>(select(0.35, 0.9, line < 0.5)) * 0.25;
            }
        }
        var g = ghost_color;
        if (duel_on && uv.x > 0.5) {
            g = g * 0.12;
        }
        rgb = (1.0 - C) * g;
        if (params.hist_on > 0.5 && uv.x > 0.94) {
            let bins = 24.0;
            let bin = u32(clamp(uv.y * bins, 0.0, bins - 1.0));
            var count = 0.0;
            for (var j2 = 0u; j2 < 256u; j2 = j2 + 1u) {
                let cy = commits[j2].pos.y;
                if (cy >= f32(bin) / bins && cy < (f32(bin) + 1.0) / bins) {
                    count += 1.0;
                }
            }
            let level = clamp(count / 10.0, 0.0, 1.0);
            let frac = (uv.x - 0.94) / 0.06;
            rgb = select(vec3<f32>(0.2, 0.9, 1.0) * (0.4 + 0.6 * level), vec3<f32>(0.02, 0.03, 0.05), frac >= level);
        }
    }
    return vec4<f32>(rgb, 1.0);
}

// ---- splat pipeline: trails / commits / point cloud (screen-space, CPU-projected)
@group(1) @binding(0) var<storage, read> splats: array<Splat>;

struct SplatOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) local: vec2<f32>,
    @location(1) extra: f32,
};

@vertex
fn vs_splat(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> SplatOut {
    let s = splats[ii];
    let corner = array<vec2<f32>, 4>(vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, 1.0));
    let size = select(0.006, 0.004, s.extra >= 1000.0);
    let uvq = s.uv + corner[vi] * size;
    var out: SplatOut;
    out.pos = vec4<f32>(uvq.x * 2.0 - 1.0, 1.0 - uvq.y * 2.0, 0.0, 1.0);
    out.local = corner[vi];
    out.extra = s.extra;
    return out;
}

@fragment
fn fs_splat(@location(0) local: vec2<f32>, @location(1) extra: f32) -> @location(0) vec4<f32> {
    let d2 = dot(local, local);
    if (d2 > 1.0) {
        discard;
    }
    let fall = exp(-d2 * 3.0);
    var col: vec3<f32>;
    if (extra >= 1000.0) {
        col = phase_to_rgb(extra - 1000.0, 1.0);
    } else {
        col = hue_of(u32(extra));
    }
    return vec4<f32>(col * fall, fall * 0.8);
}


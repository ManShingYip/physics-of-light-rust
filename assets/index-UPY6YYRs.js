(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class{__destroy_into_raw(){let e=this.__wbg_ptr;return this.__wbg_ptr=0,r.unregister(this),e}free(){let e=this.__destroy_into_raw();v.__wbg_waveengine_free(e,0)}add_source(e,t,n,r){v.waveengine_add_source(this.__wbg_ptr,e,t,n,r)}advect_flux(){v.waveengine_advect_flux(this.__wbg_ptr)}avg_len(){return v.waveengine_avg_len(this.__wbg_ptr)>>>0}avg_ptr(){return v.waveengine_avg_ptr(this.__wbg_ptr)>>>0}brush_clear(){v.waveengine_brush_clear(this.__wbg_ptr)}brush_stroke(e,t,n,r){v.waveengine_brush_stroke(this.__wbg_ptr,e,t,n,r)}clear_commits(){v.waveengine_clear_commits(this.__wbg_ptr)}commits_f32_len(){return v.waveengine_commits_f32_len(this.__wbg_ptr)>>>0}commits_len(){return v.waveengine_commits_len(this.__wbg_ptr)>>>0}commits_ptr(){return v.waveengine_commits_ptr(this.__wbg_ptr)>>>0}compute_points(){v.waveengine_compute_points(this.__wbg_ptr)}compute_projs(){v.waveengine_compute_projs(this.__wbg_ptr)}config_vec(){let e=v.waveengine_config_vec(this.__wbg_ptr);var t=i(e[0],e[1]).slice();return v.__wbindgen_free(e[0],e[1]*4,4),t}dim3(){return v.waveengine_dim3(this.__wbg_ptr)!==0}dims_f32_len(){return v.waveengine_dims_f32_len(this.__wbg_ptr)>>>0}dims_ptr(){return v.waveengine_dims_ptr(this.__wbg_ptr)>>>0}disp_len(){return v.waveengine_disp_len(this.__wbg_ptr)>>>0}disp_ptr(){return v.waveengine_disp_ptr(this.__wbg_ptr)>>>0}field3_len(){return v.waveengine_field3_len(this.__wbg_ptr)>>>0}field3_ptr(){return v.waveengine_field3_ptr(this.__wbg_ptr)>>>0}flip_source(e){v.waveengine_flip_source(this.__wbg_ptr,e)}force_grid_len(){return v.waveengine_force_grid_len(this.__wbg_ptr)>>>0}force_grid_ptr(){return v.waveengine_force_grid_ptr(this.__wbg_ptr)>>>0}height(){return v.waveengine_height(this.__wbg_ptr)>>>0}imag_len(){return v.waveengine_imag_len(this.__wbg_ptr)>>>0}imag_ptr(){return v.waveengine_imag_ptr(this.__wbg_ptr)>>>0}init_double_slit(e,t,n,r){v.waveengine_init_double_slit(this.__wbg_ptr,e,t,n,r)}init_plane(){v.waveengine_init_plane(this.__wbg_ptr)}kick(e){v.waveengine_kick(this.__wbg_ptr,e)}kill_in_mask(){v.waveengine_kill_in_mask(this.__wbg_ptr)}load_config(e){let t=u(e,v.__wbindgen_malloc),n=_;return v.waveengine_load_config(this.__wbg_ptr,t,n)!==0}mask_len(){return v.waveengine_mask_len(this.__wbg_ptr)>>>0}mask_ptr(){return v.waveengine_mask_ptr(this.__wbg_ptr)>>>0}n_len(){return v.waveengine_n_len(this.__wbg_ptr)>>>0}n_ptr(){return v.waveengine_n_ptr(this.__wbg_ptr)>>>0}constructor(e,t){let n=v.waveengine_new(e,t);return this.__wbg_ptr=n,r.register(this,this.__wbg_ptr,this),this}particles_len(){return v.waveengine_particles_len(this.__wbg_ptr)>>>0}points_len(){return v.waveengine_points_len(this.__wbg_ptr)>>>0}points_ptr(){return v.waveengine_points_ptr(this.__wbg_ptr)>>>0}project_splats(e){v.waveengine_project_splats(this.__wbg_ptr,e)}projs_len(){return v.waveengine_projs_len(this.__wbg_ptr)>>>0}projs_ptr(){return v.waveengine_projs_ptr(this.__wbg_ptr)>>>0}raster(){v.waveengine_raster(this.__wbg_ptr)}raster_len(){return v.waveengine_raster_len(this.__wbg_ptr)>>>0}raster_ptr(){return v.waveengine_raster_ptr(this.__wbg_ptr)>>>0}real_len(){return v.waveengine_real_len(this.__wbg_ptr)>>>0}real_ptr(){return v.waveengine_real_ptr(this.__wbg_ptr)>>>0}remove_source(e){v.waveengine_remove_source(this.__wbg_ptr,e)}res3(){return v.waveengine_res3(this.__wbg_ptr)>>>0}reverse_time(){v.waveengine_reverse_time(this.__wbg_ptr)}run_unity(e){let t,n;try{let r=v.waveengine_run_unity(this.__wbg_ptr,e);return t=r[0],n=r[1],s(r[0],r[1])}finally{v.__wbindgen_free(t,n,1)}}sample_commits(e,t,n){v.waveengine_sample_commits(this.__wbg_ptr,e,t,n)}scene_id(){return v.waveengine_scene_id(this.__wbg_ptr)>>>0}selftest(){let e,t;try{let n=v.waveengine_selftest(this.__wbg_ptr);return e=n[0],t=n[1],s(n[0],n[1])}finally{v.__wbindgen_free(e,t,1)}}set_barrier(e){v.waveengine_set_barrier(this.__wbg_ptr,e)}set_batch(e){v.waveengine_set_batch(this.__wbg_ptr,e)}set_cam(e,t,n,r,i){v.waveengine_set_cam(this.__wbg_ptr,e,t,n,r,i)}set_custom(e){v.waveengine_set_custom(this.__wbg_ptr,e)}set_custom_expr(e){let t=d(e,v.__wbindgen_malloc,v.__wbindgen_realloc),n=_;return v.waveengine_set_custom_expr(this.__wbg_ptr,t,n)!==0}set_dim3(e){v.waveengine_set_dim3(this.__wbg_ptr,e)}set_disp(e){v.waveengine_set_disp(this.__wbg_ptr,e)}set_force_on(e,t){v.waveengine_set_force_on(this.__wbg_ptr,e,t)}set_k(e){v.waveengine_set_k(this.__wbg_ptr,e)}set_lensing(e){v.waveengine_set_lensing(this.__wbg_ptr,e)}set_rays(e){v.waveengine_set_rays(this.__wbg_ptr,e)}set_res3(e){v.waveengine_set_res3(this.__wbg_ptr,e)}set_scene(e){v.waveengine_set_scene(this.__wbg_ptr,e)}set_sep(e){v.waveengine_set_sep(this.__wbg_ptr,e)}set_slot(e,t){v.waveengine_set_slot(this.__wbg_ptr,e,t)}set_source(e,t,n,r,i){v.waveengine_set_source(this.__wbg_ptr,e,t,n,r,i)}set_source_depth(e,t){v.waveengine_set_source_depth(this.__wbg_ptr,e,t)}set_weight(e,t){v.waveengine_set_weight(this.__wbg_ptr,e,t)}signature(){let e=v.waveengine_signature(this.__wbg_ptr);var t=i(e[0],e[1]).slice();return v.__wbindgen_free(e[0],e[1]*4,4),t}source_x(e){return v.waveengine_source_x(this.__wbg_ptr,e)}source_y(e){return v.waveengine_source_y(this.__wbg_ptr,e)}sources_len(){return v.waveengine_sources_len(this.__wbg_ptr)>>>0}spawn(e,t){v.waveengine_spawn(this.__wbg_ptr,e,t)}splats_len(){return v.waveengine_splats_len(this.__wbg_ptr)>>>0}splats_ptr(){return v.waveengine_splats_ptr(this.__wbg_ptr)>>>0}step(e){v.waveengine_step(this.__wbg_ptr,e)}step_force(e){v.waveengine_step_force(this.__wbg_ptr,e)}step_rays(e){v.waveengine_step_rays(this.__wbg_ptr,e)}swap_slots(e,t){v.waveengine_swap_slots(this.__wbg_ptr,e,t)}time(){return v.waveengine_time(this.__wbg_ptr)}trails_f32_len(){return v.waveengine_trails_f32_len(this.__wbg_ptr)>>>0}trails_len(){return v.waveengine_trails_len(this.__wbg_ptr)>>>0}trails_ptr(){return v.waveengine_trails_ptr(this.__wbg_ptr)>>>0}width(){return v.waveengine_width(this.__wbg_ptr)>>>0}};Symbol.dispose&&(e.prototype[Symbol.dispose]=e.prototype.free);function t(e,t){let n=v.add(e,t);return BigInt.asUintN(64,n)}function n(){return{__proto__:null,"./wave_engine_bg.js":{__proto__:null,__wbg___wbindgen_throw_41e9ee4f547fc59a:function(e,t){throw Error(s(e,t))},__wbindgen_init_externref_table:function(){let e=v.__wbindgen_externrefs,t=e.grow(4);e.set(0,void 0),e.set(t+0,void 0),e.set(t+1,null),e.set(t+2,!0),e.set(t+3,!1)}}}}var r=typeof FinalizationRegistry>`u`?{register:()=>{},unregister:()=>{}}:new FinalizationRegistry(e=>v.__wbg_waveengine_free(e,1));function i(e,t){return e>>>=0,o().subarray(e/4,e/4+t)}var a=null;function o(){return(a===null||a.byteLength===0)&&(a=new Float32Array(v.memory.buffer)),a}function s(e,t){return h(e>>>0,t)}var c=null;function l(){return(c===null||c.byteLength===0)&&(c=new Uint8Array(v.memory.buffer)),c}function u(e,t){let n=t(e.length*4,4)>>>0;return o().set(e,n/4),_=e.length,n}function d(e,t,n){if(n===void 0){let n=g.encode(e),r=t(n.length,1)>>>0;return l().subarray(r,r+n.length).set(n),_=n.length,r}let r=e.length,i=t(r,1)>>>0,a=l(),o=0;for(;o<r;o++){let t=e.charCodeAt(o);if(t>127)break;a[i+o]=t}if(o!==r){o!==0&&(e=e.slice(o)),i=n(i,r,r=o+e.length*3,1)>>>0;let t=l().subarray(i+o,i+r),a=g.encodeInto(e,t);o+=a.written,i=n(i,r,o,1)>>>0}return _=o,i}var f=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0});f.decode();var p=2146435072,m=0;function h(e,t){return m+=t,m>=p&&(f=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0}),f.decode(),m=t),f.decode(l().subarray(e,e+t))}var g=new TextEncoder;`encodeInto`in g||(g.encodeInto=function(e,t){let n=g.encode(e);return t.set(n),{read:e.length,written:n.length}});var _=0,v;function y(e,t){return v=e.exports,a=null,c=null,v.__wbindgen_start(),v}async function b(e,t){if(typeof Response==`function`&&e instanceof Response){if(!e.ok)throw Error(`failed to fetch Wasm: ${e.status} ${e.statusText} fetching '${e.url}'`);if(typeof WebAssembly.instantiateStreaming==`function`)try{return await WebAssembly.instantiateStreaming(e,t)}catch(t){if(n(e.type)&&e.headers.get(`Content-Type`)!==`application/wasm`)console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",t);else throw t}let r=await e.arrayBuffer();return await WebAssembly.instantiate(r,t)}{let n=await WebAssembly.instantiate(e,t);return n instanceof WebAssembly.Instance?{instance:n,module:e}:n}function n(e){switch(e){case`basic`:case`cors`:case`default`:return!0}return!1}}async function x(e){if(v!==void 0)return v;e!==void 0&&(Object.getPrototypeOf(e)===Object.prototype?{module_or_path:e}=e:console.warn(`using deprecated parameters for the initialization function; pass a single object instead`)),e===void 0&&(e=new URL(new URL(`wave_engine_bg-DahTI__t.wasm`,import.meta.url).href,``+import.meta.url));let t=n();(typeof e==`string`||typeof Request==`function`&&e instanceof Request||typeof URL==`function`&&e instanceof URL)&&(e=fetch(e));let{instance:r,module:i}=await b(await e,t);return y(r,i)}var S=`// wave_blend.wgsl Ã¢â‚¬â€ contract v4 (80B uniform, 12 bindings, 2 pipelines).
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
@group(0) @binding(9) var<storage, read> proj_buf: array<f32>;\r
@group(0) @binding(10) var<storage, read> disp_rgb: array<f32>;
@group(0) @binding(11) var<storage, read> avg_buf: array<f32>;

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

fn phase_to_rgb(phase: f32, rho: f32) -> vec3<f32> {\r
    let h = (phase / 6.2831853) + 0.5;\r
    let r = clamp(abs(fract(h) * 6.0 - 3.0) - 1.0, 0.0, 1.0);\r
    let g = clamp(abs(fract(h + 2.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);\r
    let b = clamp(abs(fract(h + 1.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);\r
    // soft-knee tone map: no clipping, no checkerboard blowout\r
    let v = rho / (rho + 0.85);\r
    return vec3<f32>(r, g, b) * (v * 1.35);\r
}

fn sample_field(uv: vec2<f32>) -> vec2<f32> {\r
    if (params.field_w == 0u || params.field_h == 0u) {\r
        return vec2<f32>(sin(uv.x * 20.0), cos(uv.x * 20.0));\r
    }\r
    let fw = f32(params.field_w);\r
    let fh = f32(params.field_h);\r
    let p = vec2<f32>(uv.x * fw - 0.5, uv.y * fh - 0.5);\r
    let i0 = vec2<u32>(u32(max(floor(p.x), 0.0)), u32(max(floor(p.y), 0.0)));\r
    let f = clamp(p - vec2<f32>(floor(p.x), floor(p.y)), vec2<f32>(0.0), vec2<f32>(1.0));\r
    let ix1 = min(i0.x + 1u, params.field_w - 1u);\r
    let iy1 = min(i0.y + 1u, params.field_h - 1u);\r
    let a = vec2<f32>(field_real[i0.y * params.field_w + i0.x], field_imag[i0.y * params.field_w + i0.x]);\r
    let b = vec2<f32>(field_real[i0.y * params.field_w + ix1], field_imag[i0.y * params.field_w + ix1]);\r
    let c = vec2<f32>(field_real[iy1 * params.field_w + i0.x], field_imag[iy1 * params.field_w + i0.x]);\r
    let d = vec2<f32>(field_real[iy1 * params.field_w + ix1], field_imag[iy1 * params.field_w + ix1]);\r
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\r
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
    let proj_on = (params.flags & 8u) != 0u;\r
    let pol_on = (params.flags & 16u) != 0u;\r
    let dim3_on = (params.flags & 32u) != 0u;\r
    let disp_on = (params.flags & 256u) != 0u;
    let tavg_on = (params.flags & 1024u) != 0u;
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
        let fi = clamp(u32(lx * f32(params.field_w)), 0u, params.field_w - 1u);
        let fj = clamp(u32(uv.y * f32(params.field_h)), 0u, params.field_h - 1u);
        let idx = fj * params.field_w + fi;
        var col = vec3<f32>(0.0);
        if (panel == 0u) {\r
            let psi = sample_field(uv);\r
            col = phase_to_rgb(atan2(psi.y, psi.x), psi.x * psi.x + psi.y * psi.y);\r
            let gm = proj_buf[3u * params.field_w * params.field_h + idx];\r
            col = mix(col, vec3<f32>(1.0, 0.15, 0.1), clamp(gm * 1.5, 0.0, 0.8));\r
        } else if (panel == 1u) {
            col = vec3<f32>(0.1, 0.7, 0.9) * pow(proj_buf[idx], 0.35);
        } else if (panel == 2u) {
            let v = proj_buf[params.field_w * params.field_h + idx];
            col = select(vec3<f32>(0.2, 0.4, 1.0) * -v, vec3<f32>(1.0, 0.5, 0.1) * v, v > 0.0);
        } else {
            col = vec3<f32>(0.9, 0.9, 0.8) * pow(proj_buf[2u * params.field_w * params.field_h + idx], 0.5);
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
        let psi = sample_field(uv);\r
        let rho = psi.x * psi.x + psi.y * psi.y;\r
        var ghost_color = phase_to_rgb(atan2(psi.y, psi.x), rho);\r
        if (tavg_on) {\r
            let ai = clamp(u32(uv.y * f32(params.field_h)), 0u, params.field_h - 1u) * params.field_w + clamp(u32(uv.x * f32(params.field_w)), 0u, params.field_w - 1u);\r
            let av = avg_buf[ai];\r
            ghost_color = vec3<f32>(0.55, 1.0, 0.75) * (av / (av + 0.85) * 1.6);\r
        }\r
        if (disp_on) {\r
            let band = clamp(u32(uv.y * 3.0), 0u, 2u);\r
            let ly = fract(uv.y * 3.0);\r
            let di = clamp(u32(ly * f32(params.field_h)), 0u, params.field_h - 1u) * params.field_w + clamp(u32(uv.x * f32(params.field_w)), 0u, params.field_w - 1u);\r
            let rho = disp_rgb[di * 6u + band * 2u];\r
            let v = rho / (rho + 0.85) * 1.6;\r
            var tint = vec3<f32>(1.0, 0.25, 0.25);\r
            if (band == 1u) {\r
                tint = vec3<f32>(0.3, 1.0, 0.4);\r
            } else if (band == 2u) {\r
                tint = vec3<f32>(0.3, 0.5, 1.0);\r
            }\r
            ghost_color = tint * v * select(1.0, 0.0, fract(uv.y * 3.0) < 0.01);\r
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
            rgb = select(vec3<f32>(0.2, 0.9, 1.0) * (0.4 + 0.6 * level), vec3<f32>(0.02, 0.03, 0.05), frac >= level);\r
        }\r
        if ((params.flags & 512u) != 0u) {\r
            let gi2 = clamp(u32(uv.y * f32(params.field_h)), 0u, params.field_h - 1u) * params.field_w + clamp(u32(uv.x * f32(params.field_w)), 0u, params.field_w - 1u);\r
            let gm2 = proj_buf[3u * params.field_w * params.field_h + gi2];\r
            rgb = mix(rgb, vec3<f32>(1.0, 0.12, 0.08), clamp(gm2 * 2.0, 0.0, 0.85));\r
        }\r
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
\r
\r
`,C=`#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p[3];
  p[0] = vec2(-1.0, -1.0);
  p[1] = vec2(3.0, -1.0);
  p[2] = vec2(-1.0, 3.0);
  vec2 q = p[gl_VertexID];
  vUv = vec2(q.x * 0.5 + 0.5, 1.0 - (q.y * 0.5 + 0.5));
  gl_Position = vec4(q, 0.0, 1.0);
}
----
#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform highp sampler2D uField;
uniform highp sampler2D uMaskN;
uniform ivec2 uFieldSize;
uniform vec4 uObs;
uniform float uHist[24];

vec2 fetchField(ivec2 i) { return texelFetch(uField, i, 0).rg; }

vec2 sampleField(vec2 uv) {
  vec2 p = uv * vec2(uFieldSize) - 0.5;
  vec2 fl = floor(p);
  ivec2 i0 = ivec2(max(fl, vec2(0.0)));
  vec2 f = clamp(p - fl, 0.0, 1.0);
  ivec2 i1 = min(i0 + 1, uFieldSize - 1);
  vec2 a = fetchField(ivec2(i0.x, i0.y));
  vec2 b = fetchField(ivec2(i1.x, i0.y));
  vec2 c = fetchField(ivec2(i0.x, i1.y));
  vec2 d = fetchField(ivec2(i1.x, i1.y));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec3 phaseRgb(float ph, float rho) {
  float h = ph / 6.2831853 + 0.5;
  float r = clamp(abs(fract(h) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  float g = clamp(abs(fract(h + 2.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  float b = clamp(abs(fract(h + 1.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  float v = rho / (rho + 0.85);
  return vec3(r, g, b) * v * 1.35;
}

void main() {
  vec2 psi = sampleField(vUv);
  float rho = dot(psi, psi);
  vec3 col = phaseRgb(atan(psi.y, psi.x), rho);
  ivec2 mi = clamp(ivec2(vUv * 48.0), ivec2(0), ivec2(47));
  vec2 mn = texelFetch(uMaskN, mi, 0).rg;
  col *= 1.0 - mn.r * 0.95;
  col = col * (1.0 + (mn.g - 1.0) * 0.6) + vec3(0.01, 0.015, 0.03) * (mn.g - 1.0);
  if (uObs.z > 0.5 && vUv.x > 0.94) {
    int bin = clamp(int(vUv.y * 24.0), 0, 23);
    float lvl = clamp(uHist[bin] / 10.0, 0.0, 1.0);
    float fr = (vUv.x - 0.94) / 0.06;
    col = fr < lvl ? vec3(0.2, 0.9, 1.0) * (0.4 + 0.6 * lvl) : vec3(0.02, 0.03, 0.05);
  }
  if (uObs.w > 0.5 && vUv.x > 0.5) col *= 0.12;
  outColor = vec4(col, 1.0);
}
----
#version 300 es
layout(location = 0) in vec2 aUv;
layout(location = 1) in float aExtra;
out float vExtra;
uniform float uSize;
void main() {
  vExtra = aExtra;
  vec2 clip = aUv * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = uSize;
}
----
#version 300 es
precision highp float;
in float vExtra;
out vec4 o;
vec3 hueOf(int i) {
  if (i == 0) return vec3(0.1, 0.9, 0.9);
  if (i == 1) return vec3(1.0, 0.6, 0.1);
  if (i == 2) return vec3(0.9, 0.2, 0.8);
  if (i == 4) return vec3(1.0, 0.95, 0.7);
  if (i == 9) return vec3(1.0, 1.0, 1.0);
  return vec3(0.6, 0.6, 0.65);
}
vec3 phaseRgb(float ph) {
  float h = ph / 6.2831853 + 0.5;
  float r = clamp(abs(fract(h) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  float g = clamp(abs(fract(h + 2.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  float b = clamp(abs(fract(h + 1.0 / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
  return vec3(r, g, b);
}
void main() {
  vec2 d = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(d, d);
  if (r2 > 1.0) discard;
  float fall = exp(-r2 * 3.0);
  vec3 c = vExtra >= 1000.0 ? phaseRgb(vExtra - 1000.0) : hueOf(int(vExtra));
  o = vec4(c * fall, fall * 0.8);
}
`,w=class{ok;gl;progField;progPoint;texField;texMaskN;vaoPoint;bufPoint;histLoc;pointCount=0;constructor(e,t){this.ok=!1;let n=e.getContext(`webgl2`,{antialias:!0});if(n===null){this.gl=null,this.progField=null,this.progPoint=null,this.texField=null,this.texMaskN=null,this.vaoPoint=null,this.bufPoint=null,this.histLoc=null;return}this.gl=n;let r=t.split(`----`),i=this.compile(n.VERTEX_SHADER,r[0]),a=this.compile(n.FRAGMENT_SHADER,r[1]),o=this.compile(n.VERTEX_SHADER,r[2]),s=this.compile(n.FRAGMENT_SHADER,r[3]);this.progField=this.link(i,a),this.progPoint=this.link(o,s),this.texField=this.mkTex(),this.texMaskN=this.mkTex(),this.vaoPoint=n.createVertexArray(),this.bufPoint=n.createBuffer(),n.bindVertexArray(this.vaoPoint),n.bindBuffer(n.ARRAY_BUFFER,this.bufPoint),n.bufferData(n.ARRAY_BUFFER,98304,n.DYNAMIC_DRAW),n.enableVertexAttribArray(0),n.vertexAttribPointer(0,2,n.FLOAT,!1,12,0),n.enableVertexAttribArray(1),n.vertexAttribPointer(1,1,n.FLOAT,!1,12,8),n.bindVertexArray(null),this.histLoc=n.getUniformLocation(this.progField,`uHist[0]`),this.ok=!0}compile(e,t){let n=this.gl,r=n.createShader(e);return n.shaderSource(r,t.trim()),n.compileShader(r),n.getShaderParameter(r,n.COMPILE_STATUS)||console.error(n.getShaderInfoLog(r)),r}link(e,t){let n=this.gl,r=n.createProgram();return n.attachShader(r,e),n.attachShader(r,t),n.linkProgram(r),n.getProgramParameter(r,n.LINK_STATUS)||console.error(n.getProgramInfoLog(r)),r}mkTex(){let e=this.gl,t=e.createTexture();return e.bindTexture(e.TEXTURE_2D,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),t}setField(e,t,n,r){let i=this.gl,a=new Float32Array(n*r*2);for(let i=0;i<n*r;i+=1)a[i*2]=e[i],a[i*2+1]=t[i];i.bindTexture(i.TEXTURE_2D,this.texField),i.texImage2D(i.TEXTURE_2D,0,i.RG32F,n,r,0,i.RG,i.FLOAT,a)}setMaskN(e,t){let n=this.gl,r=new Float32Array(e.length*2);for(let n=0;n<e.length;n+=1)r[n*2]=e[n],r[n*2+1]=t[n];n.bindTexture(n.TEXTURE_2D,this.texMaskN),n.texImage2D(n.TEXTURE_2D,0,n.RG32F,48,48,0,n.RG,n.FLOAT,r)}setPoints(e,t){let n=this.gl;n.bindBuffer(n.ARRAY_BUFFER,this.bufPoint),n.bufferSubData(n.ARRAY_BUFFER,0,e.subarray(0,t*3)),this.pointCount=t}draw(e,t,n,r,i,a,o,s){let c=this.gl;c.disable(c.DEPTH_TEST),c.disable(c.BLEND),c.useProgram(this.progField),c.activeTexture(c.TEXTURE0),c.bindTexture(c.TEXTURE_2D,this.texField),c.uniform1i(c.getUniformLocation(this.progField,`uField`),0),c.activeTexture(c.TEXTURE1),c.bindTexture(c.TEXTURE_2D,this.texMaskN),c.uniform1i(c.getUniformLocation(this.progField,`uMaskN`),1),c.uniform2i(c.getUniformLocation(this.progField,`uFieldSize`),a,o),c.uniform4f(c.getUniformLocation(this.progField,`uObs`),e,t,n,r),c.uniform1fv(this.histLoc,i),c.drawArrays(c.TRIANGLES,0,3),this.pointCount>0&&(c.enable(c.BLEND),c.blendFunc(c.SRC_ALPHA,c.ONE),c.useProgram(this.progPoint),c.uniform1f(c.getUniformLocation(this.progPoint,`uSize`),s),c.bindVertexArray(this.vaoPoint),c.drawArrays(c.POINTS,0,this.pointCount),c.bindVertexArray(null),c.disable(c.BLEND))}},ee=4096,te=80,ne=.012,re=8192,T={0:`rgba(26,230,230,0.8)`,1:`rgba(255,153,26,0.8)`,2:`rgba(230,51,204,0.8)`,3:`rgba(153,153,166,0.8)`,4:`rgba(255,242,179,0.8)`,9:`rgba(255,255,255,0.95)`};function E(e){let t=document.getElementById(e);if(t===null)throw Error(`missing element #`+e);return t}var D={s5:`雙縫：波穿兩縫干涉；白點=單次 commit；直方圖=條紋。微粒說預測兩坨，畫面否證佢。`,s1:`影：障礙擋波；邊緣衍射彎入影區。obs 線打點中缺=影簽名。`,s3:`棱鏡：n>1 介質壓縮波長、波前彎折（傍軸近似，彎折偏弱=E4）。`,s11:`透鏡：n=1.6 球體；幾何 ray（米白尾跡）彎向高 n，包絡=焦散。`,dims:`維度階梯 D=1..4：強 Huygens 只喺奇數維≥3——D=3 鋭前無尾，D=1/2/4 留尾。`,duel:`左=Born（波場+commits）；右=力律視圖（尾跡增強、波場壓暗）。`,proj:`投影四面板：x-空間／k-空間／Wigner(藍=負)／路徑密度。觀點維，非空間維。`,d3:`3D 模式：拖曳旋轉相機、滾輪推拉。R0 體渲染／R1 三 slice／R2 點雲；governor 自動降階。（需 WebGPU）`,cpu:`CPU 光柵化模式：Rust 後端直接 rasterize，任何瀏覽器都跑得動。3D/階梯/投影需 WebGPU 增強層。`};async function O(){let n=await x();E(`status`).textContent=`ready`,E(`result`).textContent=t(2n,2n).toString();let r=new URLSearchParams(window.location.search),i=Number(r.get(`res`)??`128`),a=new e(i,i),o=Number(a.width()),s=Number(a.height()),c=12345n,l=!1,u=0,d=.5,f=!1,p=()=>n.memory,m=(e,t)=>t===0?new Float32Array:new Float32Array(p().buffer,e,t),h={canvas:E(`canvas`),obsX:E(`obsX`),obsW:E(`obsW`),barrier:E(`barrierX`),sep:E(`slitSep`),k:E(`waveK`),sweep:E(`sweep`),speed:E(`sweepSpeed`),accum:E(`accum`),hist:E(`hist`),particles:E(`particles`),arrows:E(`arrows`),lensing:E(`lensing`),dims:E(`dims`),duel:E(`duel`),docent:E(`docent`),proj:E(`proj`),pol:E(`pol`),rays:E(`rays`),disp:E(`disp`),glue:E(`glue`),tavg:E(`tavg`),paint:E(`paint`),resSel:E(`resSel`),dim3:E(`dim3`),polA:E(`polA`),polB:E(`polB`),scene:E(`sceneSel`),rmode:E(`rmode`),perf:E(`perfLamp`),gpuInfo:E(`gpuInfo`),commitInfo:E(`commitInfo`),timeInfo:E(`timeInfo`),sigInfo:E(`sigInfo`),docentSide:E(`docentSide`),help:E(`helpOverlay`),selftest:E(`selftest`),unityBox:E(`unityBox`),customExpr:E(`customExpr`),exprStatus:E(`exprStatus`),swapI:E(`swapI`),swapJ:E(`swapJ`)},g=[0,1,2,3].map(e=>E(`slot`+String(e))),_=[0,1,2,3].map(e=>E(`fOn`+String(e))),v=[0,1,2,3].map(e=>E(`fW`+String(e))),y=e=>Number.parseFloat(e),b=()=>y(h.obsX.value),O=()=>Number.parseInt(h.scene.value,10),k=window.location.search.includes(`nogpu`),A=navigator.gpu,j=A===void 0?null:await A.requestAdapter(),ie=window.location.search.includes(`gl2`),ae=!k&&!ie&&A!==void 0&&j!==null,M=.7,N=.4,P=1.7,F=0,I=0,L=0,oe=!0,R=()=>{let e=h.rmode.value;return e===`slice`?64:e===`point`?128:e===`ray`?0:L},se=()=>+!!h.dims.checked|(h.duel.checked?2:0)|(h.arrows.checked?4:0)|(h.proj.checked?8:0)|(h.pol.checked?16:0)|(h.dim3.checked?32:0)|(h.disp.checked?256:0)|(h.glue.checked?512:0)|(h.tavg.checked?1024:0)|R(),z=()=>{for(let e=0;e<4;e+=1)a.set_force_on(e,_[e].checked),a.set_weight(e,y(v[e].value)),a.set_slot(e,Number.parseInt(g[e].value,10));a.set_lensing(h.lensing.checked)},B=()=>{if(!h.docent.checked){h.docentSide.style.display=`none`;return}h.docentSide.style.display=`block`;let e=D[`s`+String(O())]??``;if(h.dims.checked?e=D.dims:h.proj.checked?e=D.proj:h.duel.checked&&(e=D.duel),h.dim3.checked&&(e+=` `+D.d3),f||(e+=` `+D.cpu),h.pol.checked){let t=y(h.polA.value),n=y(h.polB.value);e+=` Malus T=`+(Math.cos(t)**2*Math.cos(n-t)**2).toFixed(3)}h.docentSide.textContent=e},V=()=>{},H=()=>{},U=()=>{},W=()=>{},G=()=>{},K=()=>{},q=()=>{},ce=()=>{},le=()=>{},J=()=>{},ue=()=>{},de={realBuf:null,imagBuf:null,projBuf:null,dispBuf:null,bg:null};function fe(){f=!0;let e,t,n,r,i,u,d={},p=0,g=0,_=16,v=performance.now();(async()=>{e=await j.requestDevice({requiredLimits:{maxStorageBuffersPerShaderStage:16}}),t=h.canvas.getContext(`webgpu`);let f=A.getPreferredCanvasFormat();t.configure({device:e,format:f,alphaMode:`opaque`});let x=()=>{let e=h.canvas.getBoundingClientRect(),t=Math.max(1,Math.round(e.width)),n=Math.max(1,Math.round(e.height));(h.canvas.width!==t||h.canvas.height!==n)&&(h.canvas.width=t,h.canvas.height=n)};x();let C=(t,n)=>e.createBuffer({size:t,usage:n});d.uniform=C(te,72),d.commit=C(ee,136),d.real=C(o*s*4,136),d.imag=C(o*s*4,136),d.n=C(9216,136),d.m=C(9216,136),d.field3=C(2097152,136),d.force=C(92160,136),d.dims=C(310272,136),d.proj=C(o*s*4*4,136),d.disp=C(o*s*6*4,136),d.avg=C(o*s*4,136),d.splat=C(re*16,136);let w=e.createShaderModule({code:S});w.getCompilationInfo().then(e=>{let t=e.messages.filter(e=>e.type===`error`);t.length>0&&(h.gpuInfo.textContent=`wgsl error L`+String(t[0].lineNum)+`: `+t[0].message)}),n=e.createRenderPipeline({layout:`auto`,vertex:{module:w,entryPoint:`vs_main`},fragment:{module:w,entryPoint:`fs_main`,targets:[{format:f}]},primitive:{topology:`triangle-list`}}),r=e.createRenderPipeline({layout:`auto`,vertex:{module:w,entryPoint:`vs_splat`},fragment:{module:w,entryPoint:`fs_splat`,targets:[{format:f,blend:{color:{srcFactor:`src-alpha`,dstFactor:`one`,operation:`add`},alpha:{srcFactor:`one`,dstFactor:`one`,operation:`add`}}}]},primitive:{topology:`triangle-strip`}}),i=e.createBindGroup({layout:n.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:d.uniform}},{binding:1,resource:{buffer:d.commit}},{binding:2,resource:{buffer:d.real}},{binding:3,resource:{buffer:d.imag}},{binding:4,resource:{buffer:d.n}},{binding:5,resource:{buffer:d.m}},{binding:6,resource:{buffer:d.field3}},{binding:7,resource:{buffer:d.force}},{binding:8,resource:{buffer:d.dims}},{binding:9,resource:{buffer:d.proj}},{binding:10,resource:{buffer:d.disp}},{binding:11,resource:{buffer:d.avg}}]}),u=e.createBindGroup({layout:r.getBindGroupLayout(1),entries:[{binding:0,resource:{buffer:d.splat}}]}),V=t=>{let n=new ArrayBuffer(te),r=new DataView(n);r.setFloat32(0,t,!0),r.setFloat32(4,y(h.obsW.value),!0),r.setFloat32(8,ne,!0),r.setUint32(12,Number(a.splats_len()),!0),r.setUint32(16,o,!0),r.setUint32(20,s,!0),r.setFloat32(24,a.time(),!0),r.setUint32(28,Number(a.res3()),!0),r.setFloat32(32,y(h.barrier.value),!0),r.setFloat32(36,.4,!0),r.setFloat32(40,.6,!0),r.setFloat32(44,+!!h.hist.checked,!0),r.setUint32(48,se(),!0),r.setFloat32(52,y(h.polA.value),!0),r.setFloat32(56,y(h.polB.value),!0),r.setFloat32(60,M,!0),r.setFloat32(64,N,!0),r.setFloat32(68,P,!0),r.setFloat32(72,F,!0),r.setFloat32(76,I,!0),e.queue.writeBuffer(d.uniform,0,new Uint8Array(n))},H=()=>{e.queue.writeBuffer(d.commit,0,m(a.commits_ptr(),Number(a.commits_f32_len()))),h.commitInfo.textContent=`commits: `+String(a.commits_len())},U=()=>{e.queue.writeBuffer(d.real,0,m(a.real_ptr(),Number(a.real_len()))),e.queue.writeBuffer(d.imag,0,m(a.imag_ptr(),Number(a.imag_len())))},W=()=>{e.queue.writeBuffer(d.n,0,m(a.n_ptr(),Number(a.n_len()))),e.queue.writeBuffer(d.m,0,m(a.mask_ptr(),Number(a.mask_len())))},G=()=>{e.queue.writeBuffer(d.force,0,m(a.force_grid_ptr(),Number(a.force_grid_len())))},K=()=>{e.queue.writeBuffer(d.dims,0,m(a.dims_ptr(),Number(a.dims_f32_len())))},q=()=>{let t=Number(a.field3_len());t>0&&e.queue.writeBuffer(d.field3,0,m(a.field3_ptr(),t))},ce=()=>{e.queue.writeBuffer(d.splat,0,m(a.splats_ptr(),Number(a.splats_len())*4))},ue=()=>{e.queue.writeBuffer(d.avg,0,m(a.avg_ptr(),Number(a.avg_len())))},J=()=>{e.queue.writeBuffer(d.disp,0,m(a.disp_ptr(),Number(a.disp_len())))},le=()=>{e.queue.writeBuffer(d.proj,0,m(a.projs_ptr(),Number(a.projs_len())))},de={realBuf:d.real,imagBuf:d.imag,projBuf:d.proj,dispBuf:d.disp,bg:i},h.gpuInfo.textContent=`webgpu: ready (enhanced)`,W(),U(),H();let T=()=>{let i=performance.now();_=_*.9+(i-v)*.1,v=i,_>26&&L<128?(L=L===0?64:128,h.perf.textContent=`perf: degraded `+String(L)):_<13&&L>0&&(L=L===128?64:0,h.perf.textContent=`perf: ok`),x(),l||a.step(.016);let o=b();h.sweep.checked&&!l&&(g+=.016*y(h.speed.value),o=.6+.6*Math.sin(g),h.obsX.value=o.toFixed(2)),h.particles.checked&&!l&&p%45==0&&(a.spawn(6,c),c+=1n),h.accum.checked&&!l&&p%20==0&&(a.sample_commits(o,2,c),c+=1n,H());let s=h.dim3.checked&&R()===128;s&&p%10==0&&a.compute_points(),a.project_splats(s),V(o),U(),ce(),h.dim3.checked&&q(),p%6==0&&G(),h.dims.checked&&p%3==0&&K(),h.disp.checked&&p%3==0&&J(),h.tavg.checked&&p%3==0&&ue();let d=e.createCommandEncoder(),f=t.getCurrentTexture().createView(),m=d.beginRenderPass({colorAttachments:[{view:f,loadOp:`clear`,storeOp:`store`,clearValue:{r:0,g:0,b:0,a:1}}]});m.setPipeline(n),m.setBindGroup(0,de.bg),m.draw(3);let S=Number(a.splats_len());if(S>0&&(m.setPipeline(r),m.setBindGroup(1,u),m.draw(4,S)),m.end(),e.queue.submit([d.finish()]),p+=1,p%30==0){h.commitInfo.textContent=`commits: `+String(a.commits_len()),h.timeInfo.textContent=`t: `+a.time().toFixed(2)+` obs: `+o.toFixed(2);let e=a.signature();h.sigInfo.textContent=`sig peaks=`+e[0].toFixed(0)+` shift=`+e[1].toFixed(3)+` corr=`+e[3].toFixed(2)}requestAnimationFrame(T)};requestAnimationFrame(T)})().catch(e=>{console.error(e),f=!1,h.gpuInfo.textContent=`webgpu failed -> CPU raster`,pe()})}function pe(){f=!1,h.gpuInfo.textContent=`raster mode (Rust CPU, universal)`,h.perf.textContent=`perf: cpu`;let e=h.canvas.getContext(`2d`);if(e===null)return;let t=document.createElement(`canvas`);t.width=192,t.height=192;let n=t.getContext(`2d`);if(n===null)return;let r=n.createImageData(192,192);window.setInterval(()=>{l||a.step(.016),h.accum.checked&&!l&&(a.sample_commits(b(),1,c),c+=1n),a.raster();let i=new Uint8ClampedArray(p().buffer,a.raster_ptr(),Number(a.raster_len()));r.data.set(i),n.putImageData(r,0,0);let o=h.canvas.getBoundingClientRect(),s=Math.max(1,Math.round(o.width)),u=Math.max(1,Math.round(o.height));(h.canvas.width!==s||h.canvas.height!==u)&&(h.canvas.width=s,h.canvas.height=u),e.imageSmoothingEnabled=!0,e.drawImage(t,0,0,s,u),a.project_splats(!1);let d=m(a.splats_ptr(),Number(a.splats_len())*4);for(let t=0;t<d.length;t+=4){let n=d[t],r=d[t+1];if(n<0||n>1||r<0||r>1)continue;let i=d[t+3],a=i>=1e3?0:i;e.fillStyle=T[a]??`rgba(255,255,255,0.6)`;let o=i>=1e3?1.5:a===9?3:2;e.beginPath(),e.arc(n*s,r*u,o,0,6.2832),e.fill()}if(h.hist.checked){let t=Array(24).fill(0),n=Number(a.commits_len()),r=m(a.commits_ptr(),n*4);for(let e=0;e<n;e+=1){let n=Math.min(23,Math.floor(r[e*4+1]*24));t[n]=t[n]+1}for(let n=0;n<24;n+=1){let r=Math.min(1,t[n]/10);e.fillStyle=`rgba(51,230,255,`+(.3+.7*r).toFixed(2)+`)`,e.fillRect(s*.94,n/24*u,s*.06*r,u/24-1)}}h.commitInfo.textContent=`commits: `+String(a.commits_len()),h.timeInfo.textContent=`t: `+a.time().toFixed(2)},33)}function me(){let e=new w(h.canvas,C);if(!e.ok)return!1;f=!1,h.gpuInfo.textContent=`webgl2 baseline (universal GPU)`;let t=Array(24).fill(0),n=new Float32Array(24576),r=0,i=()=>{l||a.step(.016),h.accum.checked&&!l&&r%20==0&&(a.sample_commits(b(),2,c),c+=1n),oe&&=(e.setMaskN(m(a.mask_ptr(),Number(a.mask_len())),m(a.n_ptr(),Number(a.n_len()))),!1),e.setField(m(a.real_ptr(),Number(a.real_len())),m(a.imag_ptr(),Number(a.imag_len())),o,s),a.project_splats(!1);let u=m(a.splats_ptr(),Number(a.splats_len())*4),d=Math.min(8192,u.length/4);for(let e=0;e<d;e+=1)n[e*3]=u[e*4],n[e*3+1]=u[e*4+1],n[e*3+2]=u[e*4+3];e.setPoints(n,d),t.fill(0);let f=Number(a.commits_len()),p=m(a.commits_ptr(),f*4);for(let e=0;e<f;e+=1){let n=Math.min(23,Math.floor(p[e*4+1]*24));t[n]=t[n]+1}e.draw(b(),y(h.obsW.value),+!!h.hist.checked,+!!h.duel.checked,t,o,s,7),r+=1,r%30==0&&(h.commitInfo.textContent=`commits: `+String(a.commits_len()),h.timeInfo.textContent=`t: `+a.time().toFixed(2)+` obs: `+b().toFixed(2)),requestAnimationFrame(i)};return i(),!0}let Y=()=>{oe=!0,a.set_barrier(y(h.barrier.value)),a.set_sep(y(h.sep.value)),a.set_k(y(h.k.value)),z(),a.set_dim3(h.dim3.checked&&f),a.set_scene(O()),U(),W(),q(),a.sample_commits(b(),12,c),c+=1n,V(b()),H(),B()},he=()=>{a.clear_commits(),a.sample_commits(b(),12,c),c+=1n,V(b()),H()},ge=()=>{h.unityBox.textContent=`running batch (sync)...`,window.setTimeout(()=>{let e=a.run_unity(1200),t=JSON.parse(e),n=[`corpuscular`,`wave`,`born`,`guidance`,`hforce`],r=`<table style="color:#ddd;font-size:11px"><tr><td>env\\f</td>`;for(let e of n)r+=`<td style="padding:2px 5px">`+e+`</td>`;r+=`</tr>`;for(let e of t){r+=`<tr><td style="padding:2px 5px">sc`+String(e.env)+`</td>`;for(let t of e.cells)r+=`<td style="padding:2px 5px;color:`+(t.pass?`#6f6`:`#f66`)+`">`+(t.pass?`PASS`:`fail`)+`</td>`;r+=`</tr>`}r+=`</table><div style="font-size:10px;color:#999">一列全綠=統一公式</div>`,h.unityBox.innerHTML=r},30)},_e=()=>{let e=a.signature(),t=new Blob([JSON.stringify({scene:O(),t:a.time(),peaks:e[0],shift:e[1],defl:e[2],corr:e[3]},null,2)],{type:`application/json`}),n=document.createElement(`a`);n.href=URL.createObjectURL(t),n.download=`signature.json`,n.click()},ve=()=>{let e=a.config_vec();window.localStorage.setItem(`polcfg`,JSON.stringify(Array.from(e))),h.exprStatus.textContent=`cfg saved`},ye=()=>{let e=window.localStorage.getItem(`polcfg`);if(e===null){h.exprStatus.textContent=`no cfg`;return}let t=JSON.parse(e);a.load_config(new Float32Array(t))&&(Y(),h.exprStatus.textContent=`cfg loaded`)};function be(){E(`resample`).addEventListener(`click`,he),E(`unityBtn`).addEventListener(`click`,ge),E(`exportBtn`).addEventListener(`click`,_e),E(`applyExpr`).addEventListener(`click`,()=>{h.exprStatus.textContent=a.set_custom_expr(h.customExpr.value)?`expr ok`:`expr rejected`}),E(`swapBtn`).addEventListener(`click`,()=>{a.swap_slots(Number.parseInt(h.swapI.value,10),Number.parseInt(h.swapJ.value,10)),z()}),E(`saveBtn`).addEventListener(`click`,ve),E(`loadBtn`).addEventListener(`click`,ye),E(`projBtn`).addEventListener(`click`,()=>{a.compute_projs(),le()}),h.resSel.value=String(i),h.resSel.addEventListener(`change`,()=>{r.set(`res`,h.resSel.value),window.location.search=r.toString()}),h.scene.addEventListener(`change`,Y),h.barrier.addEventListener(`change`,Y),h.sep.addEventListener(`change`,Y),h.k.addEventListener(`change`,Y),h.dim3.addEventListener(`change`,Y),h.rays.addEventListener(`change`,()=>a.set_rays(h.rays.checked)),h.disp.addEventListener(`change`,()=>{a.set_disp(h.disp.checked),h.disp.checked&&J()});for(let e=0;e<4;e+=1)_[e].addEventListener(`change`,z),v[e].addEventListener(`change`,z),g[e].addEventListener(`change`,z);if(h.dims.addEventListener(`change`,B),h.duel.addEventListener(`change`,B),h.proj.addEventListener(`change`,B),h.pol.addEventListener(`change`,B),h.docent.addEventListener(`change`,B),h.polA.addEventListener(`input`,B),h.polB.addEventListener(`input`,B),window.addEventListener(`keydown`,e=>{let t=e.key;if(t===`1`)h.scene.value=`1`,Y();else if(t===`2`)h.scene.value=`3`,Y();else if(t===`3`)h.scene.value=`5`,Y();else if(t===`4`)h.scene.value=`11`,Y();else if(t===`p`)h.particles.checked=!h.particles.checked;else if(t===`h`)h.hist.checked=!h.hist.checked;else if(t===`a`)h.accum.checked=!h.accum.checked;else if(t===`d`)h.duel.checked=!h.duel.checked,B();else if(t===`l`)h.dims.checked=!h.dims.checked,B();else if(t===`g`)h.docent.checked=!h.docent.checked,B();else if(t===`v`)a.flip_source(u);else if(t===`x`)a.remove_source(u);else if(t===`c`)a.add_source(.6,.4,.5,0);else if(t===`k`)a.kick(.004);else if(t===`t`)a.reverse_time();else if(t===`u`)ge();else if(t===`r`)he();else if(t===`q`)d=Math.max(0,d-.05),a.set_source_depth(u,d);else if(t===`E`)d=Math.min(1,d+.05),a.set_source_depth(u,d);else if(t===`e`)_e();else if(t===`Tab`)e.preventDefault(),u=(u+1)%Math.max(1,Number(a.sources_len()));else if(t===` `)l=!l,e.preventDefault();else if(t===`[`)h.obsW.value=String(Math.max(0,y(h.obsW.value)-.02));else if(t===`]`)h.obsW.value=String(Math.min(.5,y(h.obsW.value)+.02));else if(t===`ArrowLeft`||t===`ArrowRight`){if(h.dim3.checked&&f){let e=a.source_x(u)+(t===`ArrowRight`?.02:-.02);a.set_source(u,e,a.source_y(u),1,+(u===1))}else h.obsX.value=String(Math.min(1.2,Math.max(0,b()+(t===`ArrowRight`?.02:-.02))))}else t===`?`&&(h.help.style.display=h.help.style.display===`none`?`block`:`none`)}),window.location.search.includes(`selftest`)){let e=a.selftest(),t=JSON.parse(e);h.selftest.style.display=`block`,h.selftest.textContent=t.map(e=>(e.pass?`PASS `:`FAIL `)+e.name).join(`
`);for(let e of t)console.log((e.pass?`PASS `:`FAIL `)+e.name)}}let X=!1,Z=-1,Q=0,$=0;h.canvas.addEventListener(`pointerdown`,e=>{let t=h.canvas.getBoundingClientRect(),n=(e.clientX-t.left)/t.width,r=(e.clientY-t.top)/t.height;Z=-1;let i=Number(a.sources_len());for(let e=0;e<i;e+=1){let t=a.source_x(e),i=a.source_y(e);if(Math.hypot(n-t,r-i)<.04&&!h.dim3.checked){Z=e,u=e;return}}X=!0,Q=e.clientX,$=e.clientY}),window.addEventListener(`pointermove`,e=>{if(Z>=0){let t=h.canvas.getBoundingClientRect();a.set_source(Z,(e.clientX-t.left)/t.width,(e.clientY-t.top)/t.height,1,+(Z===1));return}if(X&&h.paint.checked&&!h.dim3.checked){let t=h.canvas.getBoundingClientRect(),n=(e.clientX-t.left)/t.width,r=(e.clientY-t.top)/t.height;a.brush_stroke(n,r,e.movementX/t.width,e.movementY/t.height);return}X&&h.dim3.checked&&f&&(e.shiftKey?(F-=(e.clientX-Q)*.002,I+=(e.clientY-$)*.002):(M+=(e.clientX-Q)*.008,N=Math.max(-1.4,Math.min(1.4,N+(e.clientY-$)*.008))),Q=e.clientX,$=e.clientY,a.set_cam(M,N,P,F,I))}),window.addEventListener(`pointerup`,()=>{X=!1,Z=-1}),h.canvas.addEventListener(`wheel`,e=>{h.dim3.checked&&f&&(e.preventDefault(),P=Math.max(.6,Math.min(4,P+e.deltaY*.001)),a.set_cam(M,N,P,F,I))},{passive:!1}),ae?fe():!k&&me()||pe(),be(),Y(),B()}O().catch(e=>{console.error(e),document.getElementById(`status`).textContent=`error`});
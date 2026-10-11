import './style.css'
import init, { add, WaveEngine } from '../pkg/wave_engine.js'
import wgslSrc from './render/wave_blend.wgsl?raw'
import glslSrc from './render/wave_blend.glsl?raw'
import { Gl2Renderer } from './render/gl2.ts'

const COMMIT_FLOATS = 256 * 4
const COMMIT_BYTES = COMMIT_FLOATS * 4
const UNIFORM_BYTES = 80
const DOT_RADIUS = 0.012
const BUFFER_COPY_DST = 0x08
const BUFFER_UNIFORM = 0x40
const BUFFER_STORAGE = 0x80
const SPLAT_CAP = 8192

const HUE_CSS: Record<number, string> = {
  0: 'rgba(26,230,230,0.8)',
  1: 'rgba(255,153,26,0.8)',
  2: 'rgba(230,51,204,0.8)',
  3: 'rgba(153,153,166,0.8)',
  4: 'rgba(255,242,179,0.8)',
  9: 'rgba(255,255,255,0.95)',
}

type Queue = {
  writeBuffer(b: unknown, o: number, data: ArrayBufferView): void
  submit(v: unknown[]): void
}

type Device = {
  createBuffer(d: unknown): unknown
  createShaderModule(d: unknown): unknown
  createRenderPipeline(d: unknown): unknown
  createBindGroup(d: unknown): unknown
  queue: Queue
  createCommandEncoder(): {
    beginRenderPass(d: unknown): {
      setPipeline(p: unknown): void
      setBindGroup(i: number, g: unknown): void
      draw(n: number, m?: number): void
      end(): void
    }
    finish(): unknown
  }
}

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (el === null) {
    throw new Error('missing element #' + id)
  }
  return el as T
}

const DOCENT: Record<string, string> = {
  s5: '雙縫：波穿兩縫干涉；白點=單次 commit；直方圖=條紋。微粒說預測兩坨，畫面否證佢。',
  s1: '影：障礙擋波；邊緣衍射彎入影區。obs 線打點中缺=影簽名。',
  s3: '棱鏡：n>1 介質壓縮波長、波前彎折（傍軸近似，彎折偏弱=E4）。',
  s11: '透鏡：n=1.6 球體；幾何 ray（米白尾跡）彎向高 n，包絡=焦散。',
  dims: '維度階梯 D=1..4：強 Huygens 只喺奇數維≥3——D=3 鋭前無尾，D=1/2/4 留尾。',
  duel: '左=Born（波場+commits）；右=力律視圖（尾跡增強、波場壓暗）。',
  proj: '投影四面板：x-空間／k-空間／Wigner(藍=負)／路徑密度。觀點維，非空間維。',
  d3: '3D 模式：拖曳旋轉相機、滾輪推拉。R0 體渲染／R1 三 slice／R2 點雲；governor 自動降階。（需 WebGPU）',
  cpu: 'CPU 光柵化模式：Rust 後端直接 rasterize，任何瀏覽器都跑得動。3D/階梯/投影需 WebGPU 增強層。',
}

async function main(): Promise<void> {
  const wasm = await init()
  getEl('status').textContent = 'ready'
  getEl('result').textContent = add(2n, 2n).toString()

  const engine = new WaveEngine(96, 96)
  const FW = Number(engine.width())
  const FH = Number(engine.height())
  let seed = 12345n
  let paused = false
  let selSource = 0
  let selDepth = 0.5
  let gpuOn = false

  const mem = (): WebAssembly.Memory => (wasm as unknown as { memory: WebAssembly.Memory }).memory
  const viewF32 = (ptr: number, len: number): Float32Array => {
    if (len === 0) {
      return new Float32Array(0)
    }
    return new Float32Array(mem().buffer, ptr, len)
  }

  const el = {
    canvas: getEl<HTMLCanvasElement>('canvas'),
    obsX: getEl<HTMLInputElement>('obsX'),
    obsW: getEl<HTMLInputElement>('obsW'),
    barrier: getEl<HTMLInputElement>('barrierX'),
    sep: getEl<HTMLInputElement>('slitSep'),
    k: getEl<HTMLInputElement>('waveK'),
    sweep: getEl<HTMLInputElement>('sweep'),
    speed: getEl<HTMLInputElement>('sweepSpeed'),
    accum: getEl<HTMLInputElement>('accum'),
    hist: getEl<HTMLInputElement>('hist'),
    particles: getEl<HTMLInputElement>('particles'),
    arrows: getEl<HTMLInputElement>('arrows'),
    lensing: getEl<HTMLInputElement>('lensing'),
    dims: getEl<HTMLInputElement>('dims'),
    duel: getEl<HTMLInputElement>('duel'),
    docent: getEl<HTMLInputElement>('docent'),
    proj: getEl<HTMLInputElement>('proj'),
    pol: getEl<HTMLInputElement>('pol'),
    rays: getEl<HTMLInputElement>('rays'),
    disp: getEl<HTMLInputElement>('disp'),
    dim3: getEl<HTMLInputElement>('dim3'),
    polA: getEl<HTMLInputElement>('polA'),
    polB: getEl<HTMLInputElement>('polB'),
    scene: getEl<HTMLSelectElement>('sceneSel'),
    rmode: getEl<HTMLSelectElement>('rmode'),
    perf: getEl('perfLamp'),
    gpuInfo: getEl('gpuInfo'),
    commitInfo: getEl('commitInfo'),
    timeInfo: getEl('timeInfo'),
    sigInfo: getEl('sigInfo'),
    docentSide: getEl('docentSide'),
    help: getEl('helpOverlay'),
    selftest: getEl('selftest'),
    unityBox: getEl('unityBox'),
    customExpr: getEl<HTMLInputElement>('customExpr'),
    exprStatus: getEl('exprStatus'),
    swapI: getEl<HTMLSelectElement>('swapI'),
    swapJ: getEl<HTMLSelectElement>('swapJ'),
  }
  const slotSel: HTMLSelectElement[] = [0, 1, 2, 3].map((i) => getEl<HTMLSelectElement>('slot' + String(i)))
  const fOn: HTMLInputElement[] = [0, 1, 2, 3].map((i) => getEl<HTMLInputElement>('fOn' + String(i)))
  const fW: HTMLInputElement[] = [0, 1, 2, 3].map((i) => getEl<HTMLInputElement>('fW' + String(i)))

  const num = (v: string): number => Number.parseFloat(v)
  const obsX = (): number => num(el.obsX.value)
  const sceneId = (): number => Number.parseInt(el.scene.value, 10)

  const nogpu = window.location.search.includes('nogpu')
  const gpu = (navigator as unknown as { gpu?: unknown }).gpu as
    | { requestAdapter(): Promise<unknown>; getPreferredCanvasFormat(): string }
    | undefined
  const adapter = (gpu === undefined ? null : await gpu.requestAdapter()) as null | {
    requestDevice(d?: unknown): Promise<unknown>
  }
  const gl2only = window.location.search.includes('gl2')
  const useGPU = !nogpu && !gl2only && gpu !== undefined && adapter !== null

  let camYaw = 0.7
  let camPitch = 0.4
  let camDist = 1.7
  let camPanX = 0
  let camPanY = 0
  let govMode = 0
  let maskDirty = true

  const renderMode = (): number => {
    const v = el.rmode.value
    if (v === 'slice') return 64
    if (v === 'point') return 128
    if (v === 'ray') return 0
    return govMode
  }

  const flags = (): number =>
    (el.dims.checked ? 1 : 0) |
    (el.duel.checked ? 2 : 0) |
    (el.arrows.checked ? 4 : 0) |
    (el.proj.checked ? 8 : 0) |
    (el.pol.checked ? 16 : 0) |
    (el.dim3.checked ? 32 : 0) |
    renderMode()

  const syncForces = (): void => {
    for (let i = 0; i < 4; i = i + 1) {
      engine.set_force_on(i, fOn[i].checked)
      engine.set_weight(i, num(fW[i].value))
      engine.set_slot(i, Number.parseInt(slotSel[i].value, 10))
    }
    engine.set_lensing(el.lensing.checked)
  }

  const updateDocent = (): void => {
    if (!el.docent.checked) {
      el.docentSide.style.display = 'none'
      return
    }
    el.docentSide.style.display = 'block'
    let t = DOCENT['s' + String(sceneId())] ?? ''
    if (el.dims.checked) t = DOCENT.dims
    else if (el.proj.checked) t = DOCENT.proj
    else if (el.duel.checked) t = DOCENT.duel
    if (el.dim3.checked) t += ' ' + DOCENT.d3
    if (!gpuOn) t += ' ' + DOCENT.cpu
    if (el.pol.checked) {
      const a = num(el.polA.value)
      const b = num(el.polB.value)
      t += ' Malus T=' + (Math.cos(a) ** 2 * Math.cos(b - a) ** 2).toFixed(3)
    }
    el.docentSide.textContent = t
  }

  // ---- GPU-enhanced renderer (optional layer)
  let writeUniform: (oX: number) => void = () => {}
  let uploadCommits: () => void = () => {}
  let uploadField: () => void = () => {}
  let uploadGrids: () => void = () => {}
  let uploadForce: () => void = () => {}
  let uploadDims: () => void = () => {}
  let uploadField3: () => void = () => {}
  let uploadSplats: () => void = () => {}
  let uploadProjs: () => void = () => {}
  let uploadDisp: () => void = () => {}

  function startGPU(): void {
    gpuOn = true
    let dev: Device
    let context: { configure(c: unknown): void; getCurrentTexture(): { createView(): unknown } }
    let pipeline: unknown
    let pipeline2: unknown
    let bindGroup: unknown
    let bindGroup2: unknown
    const bufs: Record<string, unknown> = {}
    let frames = 0
    let sweepT = 0
    let ema = 16
    let lastT = performance.now()

    const setup = async (): Promise<void> => {
      dev = (await (adapter as { requestDevice(d?: unknown): Promise<unknown> }).requestDevice({
        requiredLimits: { maxStorageBuffersPerShaderStage: 16 },
      })) as Device
      context = el.canvas.getContext('webgpu') as unknown as {
        configure(c: unknown): void
        getCurrentTexture(): { createView(): unknown }
      }
      const format = (gpu as { getPreferredCanvasFormat(): string }).getPreferredCanvasFormat()
      context.configure({ device: dev, format, alphaMode: 'opaque' })

      const fitCanvas = (): void => {
        const r = el.canvas.getBoundingClientRect()
        const w = Math.max(1, Math.round(r.width))
        const h = Math.max(1, Math.round(r.height))
        if (el.canvas.width !== w || el.canvas.height !== h) {
          el.canvas.width = w
          el.canvas.height = h
        }
      }
      fitCanvas()

      const mkBuf = (size: number, usage: number): unknown => dev.createBuffer({ size, usage }) as unknown
      bufs.uniform = mkBuf(UNIFORM_BYTES, BUFFER_UNIFORM | BUFFER_COPY_DST)
      bufs.commit = mkBuf(COMMIT_BYTES, BUFFER_STORAGE | BUFFER_COPY_DST)
      bufs.real = mkBuf(FW * FH * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
      bufs.imag = mkBuf(FW * FH * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
      bufs.n = mkBuf(9216, BUFFER_STORAGE | BUFFER_COPY_DST)
      bufs.m = mkBuf(9216, BUFFER_STORAGE | BUFFER_COPY_DST)
      bufs.field3 = mkBuf(64 * 64 * 64 * 2 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
      bufs.force = mkBuf(48 * 48 * 10 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
      bufs.dims = mkBuf(77568 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
      bufs.proj = mkBuf(96 * 96 * 3 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
      bufs.disp = mkBuf(96 * 96 * 3 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
      bufs.splat = mkBuf(SPLAT_CAP * 16, BUFFER_STORAGE | BUFFER_COPY_DST)

      const module = dev.createShaderModule({ code: wgslSrc }) as unknown as {
        getCompilationInfo(): Promise<{ messages: { type: string; message: string; lineNum: number }[] }>
      }
      module.getCompilationInfo().then((info) => {
        const errs = info.messages.filter((m) => m.type === 'error')
        if (errs.length > 0) {
          el.gpuInfo.textContent = 'wgsl error L' + String(errs[0].lineNum) + ': ' + errs[0].message
        }
      })
      pipeline = dev.createRenderPipeline({
        layout: 'auto',
        vertex: { module, entryPoint: 'vs_main' },
        fragment: { module, entryPoint: 'fs_main', targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      }) as unknown
      pipeline2 = dev.createRenderPipeline({
        layout: 'auto',
        vertex: { module, entryPoint: 'vs_splat' },
        fragment: {
          module,
          entryPoint: 'fs_splat',
          targets: [
            {
              format,
              blend: {
                color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
                alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
              },
            },
          ],
        },
        primitive: { topology: 'triangle-strip' },
      }) as unknown
      bindGroup = dev.createBindGroup({
        layout: (pipeline as { getBindGroupLayout(i: number): unknown }).getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: bufs.uniform } },
          { binding: 1, resource: { buffer: bufs.commit } },
          { binding: 2, resource: { buffer: bufs.real } },
          { binding: 3, resource: { buffer: bufs.imag } },
          { binding: 4, resource: { buffer: bufs.n } },
          { binding: 5, resource: { buffer: bufs.m } },
          { binding: 6, resource: { buffer: bufs.field3 } },
          { binding: 7, resource: { buffer: bufs.force } },
          { binding: 8, resource: { buffer: bufs.dims } },
          { binding: 9, resource: { buffer: bufs.proj } },
          { binding: 10, resource: { buffer: bufs.disp } },
        ],
      }) as unknown
      bindGroup2 = dev.createBindGroup({
        layout: (pipeline2 as { getBindGroupLayout(i: number): unknown }).getBindGroupLayout(1),
        entries: [{ binding: 0, resource: { buffer: bufs.splat } }],
      }) as unknown

      writeUniform = (oX: number): void => {
        const ub = new ArrayBuffer(UNIFORM_BYTES)
        const dv = new DataView(ub)
        dv.setFloat32(0, oX, true)
        dv.setFloat32(4, num(el.obsW.value), true)
        dv.setFloat32(8, DOT_RADIUS, true)
        dv.setUint32(12, Number(engine.splats_len()), true)
        dv.setUint32(16, FW, true)
        dv.setUint32(20, FH, true)
        dv.setFloat32(24, engine.time(), true)
        dv.setUint32(28, Number(engine.res3()), true)
        dv.setFloat32(32, num(el.barrier.value), true)
        dv.setFloat32(36, 0.4, true)
        dv.setFloat32(40, 0.6, true)
        dv.setFloat32(44, el.hist.checked ? 1 : 0, true)
        dv.setUint32(48, flags(), true)
        dv.setFloat32(52, num(el.polA.value), true)
        dv.setFloat32(56, num(el.polB.value), true)
        dv.setFloat32(60, camYaw, true)
        dv.setFloat32(64, camPitch, true)
        dv.setFloat32(68, camDist, true)
        dv.setFloat32(72, camPanX, true)
        dv.setFloat32(76, camPanY, true)
        dev.queue.writeBuffer(bufs.uniform, 0, new Uint8Array(ub))
      }
      uploadCommits = (): void => {
        dev.queue.writeBuffer(bufs.commit, 0, viewF32(engine.commits_ptr() as unknown as number, Number(engine.commits_f32_len())))
        el.commitInfo.textContent = 'commits: ' + String(engine.commits_len())
      }
      uploadField = (): void => {
        dev.queue.writeBuffer(bufs.real, 0, viewF32(engine.real_ptr() as unknown as number, Number(engine.real_len())))
        dev.queue.writeBuffer(bufs.imag, 0, viewF32(engine.imag_ptr() as unknown as number, Number(engine.imag_len())))
      }
      uploadGrids = (): void => {
        dev.queue.writeBuffer(bufs.n, 0, viewF32(engine.n_ptr() as unknown as number, Number(engine.n_len())))
        dev.queue.writeBuffer(bufs.m, 0, viewF32(engine.mask_ptr() as unknown as number, Number(engine.mask_len())))
      }
      uploadForce = (): void => {
        dev.queue.writeBuffer(bufs.force, 0, viewF32(engine.force_grid_ptr() as unknown as number, Number(engine.force_grid_len())))
      }
      uploadDims = (): void => {
        dev.queue.writeBuffer(bufs.dims, 0, viewF32(engine.dims_ptr() as unknown as number, Number(engine.dims_f32_len())))
      }
      uploadField3 = (): void => {
        const len = Number(engine.field3_len())
        if (len > 0) {
          dev.queue.writeBuffer(bufs.field3, 0, viewF32(engine.field3_ptr() as unknown as number, len))
        }
      }
      uploadSplats = (): void => {
        dev.queue.writeBuffer(bufs.splat, 0, viewF32(engine.splats_ptr() as unknown as number, Number(engine.splats_len()) * 4))
      }
      uploadDisp = (): void => {
        dev.queue.writeBuffer(bufs.disp, 0, viewF32(engine.disp_ptr() as unknown as number, Number(engine.disp_len())))
      }
      uploadProjs = (): void => {
        dev.queue.writeBuffer(bufs.proj, 0, viewF32(engine.projs_ptr() as unknown as number, Number(engine.projs_len())))
      }

      el.gpuInfo.textContent = 'webgpu: ready (enhanced)'
      uploadGrids()
      uploadField()
      uploadCommits()

      const frame = (): void => {
        const now = performance.now()
        ema = ema * 0.9 + (now - lastT) * 0.1
        lastT = now
        if (ema > 26 && govMode < 128) {
          govMode = govMode === 0 ? 64 : 128
          el.perf.textContent = 'perf: degraded ' + String(govMode)
        } else if (ema < 13 && govMode > 0) {
          govMode = govMode === 128 ? 64 : 0
          el.perf.textContent = 'perf: ok'
        }
        fitCanvas()
        if (!paused) {
          engine.step(0.016)
        }
        let oX = obsX()
        if (el.sweep.checked && !paused) {
          sweepT = sweepT + 0.016 * num(el.speed.value)
          oX = 0.6 + 0.6 * Math.sin(sweepT)
          el.obsX.value = oX.toFixed(2)
        }
        if (el.particles.checked && !paused && frames % 45 === 0) {
          engine.spawn(6, seed)
          seed = seed + 1n
        }
        if (el.accum.checked && !paused && frames % 20 === 0) {
          engine.sample_commits(oX, 2, seed)
          seed = seed + 1n
          uploadCommits()
        }
        const r2 = el.dim3.checked && renderMode() === 128
        if (r2 && frames % 10 === 0) {
          engine.compute_points()
        }
        engine.project_splats(r2)
        writeUniform(oX)
        uploadField()
        uploadSplats()
        if (el.dim3.checked) uploadField3()
        if (frames % 6 === 0) uploadForce()
        if (el.dims.checked && frames % 3 === 0) uploadDims()
    if (el.disp.checked && frames % 3 === 0) uploadDisp()
        const enc = dev.createCommandEncoder()
        const view = context.getCurrentTexture().createView()
        const pass = enc.beginRenderPass({
          colorAttachments: [{ view, loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
        })
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
        pass.draw(3)
        const ns = Number(engine.splats_len())
        if (ns > 0) {
          pass.setPipeline(pipeline2)
          pass.setBindGroup(1, bindGroup2)
          pass.draw(4, ns)
        }
        pass.end()
        dev.queue.submit([enc.finish()])
        frames = frames + 1
        if (frames % 30 === 0) {
          el.commitInfo.textContent = 'commits: ' + String(engine.commits_len())
          el.timeInfo.textContent = 't: ' + engine.time().toFixed(2) + ' obs: ' + oX.toFixed(2)
          const s = engine.signature() as unknown as Float32Array
          el.sigInfo.textContent = 'sig peaks=' + s[0].toFixed(0) + ' shift=' + s[1].toFixed(3) + ' corr=' + s[3].toFixed(2)
        }
        requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    }
    setup().catch((e: unknown) => {
      console.error(e)
      gpuOn = false
      el.gpuInfo.textContent = 'webgpu failed -> CPU raster'
      startCPU()
    })
  }

  // ---- universal CPU raster renderer (baseline, every browser)
  function startCPU(): void {
    gpuOn = false
    el.gpuInfo.textContent = 'raster mode (Rust CPU, universal)'
    el.perf.textContent = 'perf: cpu'
    const ctx2d = el.canvas.getContext('2d')
    if (ctx2d === null) {
      return
    }
    const off = document.createElement('canvas')
    off.width = 192
    off.height = 192
    const octx = off.getContext('2d')
    if (octx === null) {
      return
    }
    const img = octx.createImageData(192, 192)
    window.setInterval(() => {
      if (!paused) {
        engine.step(0.016)
      }
      if (el.accum.checked && !paused) {
        engine.sample_commits(obsX(), 1, seed)
        seed = seed + 1n
      }
      engine.raster()
      const src = new Uint8ClampedArray(
        mem().buffer,
        engine.raster_ptr() as unknown as number,
        Number(engine.raster_len()),
      )
      img.data.set(src)
      octx.putImageData(img, 0, 0)
      const r = el.canvas.getBoundingClientRect()
      const W = Math.max(1, Math.round(r.width))
      const H = Math.max(1, Math.round(r.height))
      if (el.canvas.width !== W || el.canvas.height !== H) {
        el.canvas.width = W
        el.canvas.height = H
      }
      ctx2d.imageSmoothingEnabled = true
      ctx2d.drawImage(off, 0, 0, W, H)
      engine.project_splats(false)
      const sp = viewF32(engine.splats_ptr() as unknown as number, Number(engine.splats_len()) * 4)
      for (let i = 0; i < sp.length; i += 4) {
        const u = sp[i]
        const v = sp[i + 1]
        if (u < 0 || u > 1 || v < 0 || v > 1) continue
        const extra = sp[i + 3]
        const hue = extra >= 1000 ? 0 : extra
        ctx2d.fillStyle = HUE_CSS[hue] ?? 'rgba(255,255,255,0.6)'
        const rad = extra >= 1000 ? 1.5 : hue === 9 ? 3 : 2
        ctx2d.beginPath()
        ctx2d.arc(u * W, v * H, rad, 0, 6.2832)
        ctx2d.fill()
      }
      if (el.hist.checked) {
        const bins = new Array<number>(24).fill(0)
        const nc = Number(engine.commits_len())
        const cv = viewF32(engine.commits_ptr() as unknown as number, nc * 4)
        for (let i = 0; i < nc; i = i + 1) {
          const b = Math.min(23, Math.floor(cv[i * 4 + 1] * 24))
          bins[b] = bins[b] + 1
        }
        for (let b = 0; b < 24; b = b + 1) {
          const lvl = Math.min(1, bins[b] / 10)
          ctx2d.fillStyle = 'rgba(51,230,255,' + (0.3 + 0.7 * lvl).toFixed(2) + ')'
          ctx2d.fillRect(W * 0.94, (b / 24) * H, W * 0.06 * lvl, H / 24 - 1)
        }
      }
      el.commitInfo.textContent = 'commits: ' + String(engine.commits_len())
      el.timeInfo.textContent = 't: ' + engine.time().toFixed(2)
    }, 33)
  }

  // ---- T2: WebGL2 universal baseline (Firefox/Safari/everywhere)
  function startGL2(): boolean {
    const r = new Gl2Renderer(el.canvas, glslSrc)
    if (!r.ok) {
      return false
    }
    gpuOn = false
    el.gpuInfo.textContent = 'webgl2 baseline (universal GPU)'
    const hist = new Array<number>(24).fill(0)
    const splat3 = new Float32Array(8192 * 3)
    let fr = 0
    const loop = (): void => {
      if (!paused) {
        engine.step(0.016)
      }
      if (el.accum.checked && !paused && fr % 20 === 0) {
        engine.sample_commits(obsX(), 2, seed)
        seed = seed + 1n
      }
      if (maskDirty) {
        r.setMaskN(
          viewF32(engine.mask_ptr() as unknown as number, Number(engine.mask_len())),
          viewF32(engine.n_ptr() as unknown as number, Number(engine.n_len())),
        )
        maskDirty = false
      }
      r.setField(
        viewF32(engine.real_ptr() as unknown as number, Number(engine.real_len())),
        viewF32(engine.imag_ptr() as unknown as number, Number(engine.imag_len())),
        FW,
        FH,
      )
      engine.project_splats(false)
      const sp = viewF32(engine.splats_ptr() as unknown as number, Number(engine.splats_len()) * 4)
      const n = Math.min(8192, sp.length / 4)
      for (let i = 0; i < n; i = i + 1) {
        splat3[i * 3] = sp[i * 4]
        splat3[i * 3 + 1] = sp[i * 4 + 1]
        splat3[i * 3 + 2] = sp[i * 4 + 3]
      }
      r.setPoints(splat3, n)
      hist.fill(0)
      const nc = Number(engine.commits_len())
      const cv = viewF32(engine.commits_ptr() as unknown as number, nc * 4)
      for (let i = 0; i < nc; i = i + 1) {
        const b = Math.min(23, Math.floor(cv[i * 4 + 1] * 24))
        hist[b] = hist[b] + 1
      }
      r.draw(obsX(), num(el.obsW.value), el.hist.checked ? 1 : 0, el.duel.checked ? 1 : 0, hist, FW, FH, 7)
      fr = fr + 1
      if (fr % 30 === 0) {
        el.commitInfo.textContent = 'commits: ' + String(engine.commits_len())
        el.timeInfo.textContent = 't: ' + engine.time().toFixed(2) + ' obs: ' + obsX().toFixed(2)
      }
      requestAnimationFrame(loop)
    }
    loop()
    return true
  }

  const rebuildField = (): void => {
    maskDirty = true
    engine.set_barrier(num(el.barrier.value))
    engine.set_sep(num(el.sep.value))
    engine.set_k(num(el.k.value))
    syncForces()
    engine.set_dim3(el.dim3.checked && gpuOn)
    engine.set_scene(sceneId())
    uploadField()
    uploadGrids()
    uploadField3()
    engine.sample_commits(obsX(), 12, seed)
    seed = seed + 1n
    writeUniform(obsX())
    uploadCommits()
    updateDocent()
  }

  const resample = (): void => {
    engine.clear_commits()
    engine.sample_commits(obsX(), 12, seed)
    seed = seed + 1n
    writeUniform(obsX())
    uploadCommits()
  }

  const runUnity = (): void => {
    el.unityBox.textContent = 'running batch (sync)...'
    window.setTimeout(() => {
      const json = engine.run_unity(240) as unknown as string
      const rows = JSON.parse(json) as { env: number; cells: { f: string; pass: boolean }[] }[]
      const names = ['corpuscular', 'wave', 'born', 'guidance', 'hforce']
      let html = '<table style="color:#ddd;font-size:11px"><tr><td>env\\f</td>'
      for (const n of names) html += '<td style="padding:2px 5px">' + n + '</td>'
      html += '</tr>'
      for (const r of rows) {
        html += '<tr><td style="padding:2px 5px">sc' + String(r.env) + '</td>'
        for (const c of r.cells) {
          html += '<td style="padding:2px 5px;color:' + (c.pass ? '#6f6' : '#f66') + '">' + (c.pass ? 'PASS' : 'fail') + '</td>'
        }
        html += '</tr>'
      }
      html += '</table><div style="font-size:10px;color:#999">一列全綠=統一公式</div>'
      el.unityBox.innerHTML = html
    }, 30)
  }

  const exportSig = (): void => {
    const s = engine.signature() as unknown as Float32Array
    const blob = new Blob(
      [JSON.stringify({ scene: sceneId(), t: engine.time(), peaks: s[0], shift: s[1], defl: s[2], corr: s[3] }, null, 2)],
      { type: 'application/json' },
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'signature.json'
    a.click()
  }

  const saveCfg = (): void => {
    const v = engine.config_vec() as unknown as Float32Array
    window.localStorage.setItem('polcfg', JSON.stringify(Array.from(v)))
    el.exprStatus.textContent = 'cfg saved'
  }
  const loadCfg = (): void => {
    const s = window.localStorage.getItem('polcfg')
    if (s === null) {
      el.exprStatus.textContent = 'no cfg'
      return
    }
    const v = JSON.parse(s) as number[]
    if (engine.load_config(new Float32Array(v))) {
      rebuildField()
      el.exprStatus.textContent = 'cfg loaded'
    }
  }

  function wireCommon(): void {
    getEl('resample').addEventListener('click', resample)
    getEl('unityBtn').addEventListener('click', runUnity)
    getEl('exportBtn').addEventListener('click', exportSig)
    getEl('applyExpr').addEventListener('click', () => {
      el.exprStatus.textContent = engine.set_custom_expr(el.customExpr.value) ? 'expr ok' : 'expr rejected'
    })
    getEl('swapBtn').addEventListener('click', () => {
      engine.swap_slots(Number.parseInt(el.swapI.value, 10), Number.parseInt(el.swapJ.value, 10))
      syncForces()
    })
    getEl('saveBtn').addEventListener('click', saveCfg)
    getEl('loadBtn').addEventListener('click', loadCfg)
    getEl('projBtn').addEventListener('click', () => {
      engine.compute_projs()
      uploadProjs()
    })
    el.scene.addEventListener('change', rebuildField)
    el.barrier.addEventListener('change', rebuildField)
    el.sep.addEventListener('change', rebuildField)
    el.k.addEventListener('change', rebuildField)
    el.dim3.addEventListener('change', rebuildField)
    el.rays.addEventListener('change', () => engine.set_rays(el.rays.checked))
  el.disp.addEventListener('change', () => {
    engine.set_disp(el.disp.checked)
    if (el.disp.checked) uploadDisp()
  })
    for (let i = 0; i < 4; i = i + 1) {
      fOn[i].addEventListener('change', syncForces)
      fW[i].addEventListener('change', syncForces)
      slotSel[i].addEventListener('change', syncForces)
    }
    el.dims.addEventListener('change', updateDocent)
    el.duel.addEventListener('change', updateDocent)
    el.proj.addEventListener('change', updateDocent)
    el.pol.addEventListener('change', updateDocent)
    el.docent.addEventListener('change', updateDocent)
    el.polA.addEventListener('input', updateDocent)
    el.polB.addEventListener('input', updateDocent)

    window.addEventListener('keydown', (ev) => {
      const key = ev.key
      if (key === '1') { el.scene.value = '1'; rebuildField() }
      else if (key === '2') { el.scene.value = '3'; rebuildField() }
      else if (key === '3') { el.scene.value = '5'; rebuildField() }
      else if (key === '4') { el.scene.value = '11'; rebuildField() }
      else if (key === 'p') el.particles.checked = !el.particles.checked
      else if (key === 'h') el.hist.checked = !el.hist.checked
      else if (key === 'a') el.accum.checked = !el.accum.checked
      else if (key === 'd') { el.duel.checked = !el.duel.checked; updateDocent() }
      else if (key === 'l') { el.dims.checked = !el.dims.checked; updateDocent() }
      else if (key === 'g') { el.docent.checked = !el.docent.checked; updateDocent() }
      else if (key === 'v') engine.flip_source(selSource)
      else if (key === 'x') engine.remove_source(selSource)
      else if (key === 'c') engine.add_source(0.6, 0.4, 0.5, 0)
      else if (key === 'k') engine.kick(0.004)
      else if (key === 't') engine.reverse_time()
      else if (key === 'u') runUnity()
      else if (key === 'r') resample()
      else if (key === 'q') { selDepth = Math.max(0, selDepth - 0.05); engine.set_source_depth(selSource, selDepth) }
      else if (key === 'E') { selDepth = Math.min(1, selDepth + 0.05); engine.set_source_depth(selSource, selDepth) }
      else if (key === 'e') exportSig()
      else if (key === 'Tab') { ev.preventDefault(); selSource = (selSource + 1) % Math.max(1, Number(engine.sources_len())) }
      else if (key === ' ') { paused = !paused; ev.preventDefault() }
      else if (key === '[') el.obsW.value = String(Math.max(0, num(el.obsW.value) - 0.02))
      else if (key === ']') el.obsW.value = String(Math.min(0.5, num(el.obsW.value) + 0.02))
      else if (key === 'ArrowLeft' || key === 'ArrowRight') {
        if (el.dim3.checked && gpuOn) {
          const sx = (engine.source_x(selSource) as unknown as number) + (key === 'ArrowRight' ? 0.02 : -0.02)
          engine.set_source(selSource, sx, engine.source_y(selSource) as unknown as number, 1.0, selSource === 1 ? 1 : 0)
        } else {
          el.obsX.value = String(Math.min(1.2, Math.max(0, obsX() + (key === 'ArrowRight' ? 0.02 : -0.02))))
        }
      } else if (key === '?') el.help.style.display = el.help.style.display === 'none' ? 'block' : 'none'
    })

    if (window.location.search.includes('selftest')) {
      const json = engine.selftest() as unknown as string
      const lines = JSON.parse(json) as { name: string; pass: boolean }[]
      el.selftest.style.display = 'block'
      el.selftest.textContent = lines.map((l) => (l.pass ? 'PASS ' : 'FAIL ') + l.name).join('\n')
      for (const l of lines) console.log((l.pass ? 'PASS ' : 'FAIL ') + l.name)
    }
  }

  let dragging = false
  let dragSrc = -1
  let lastX = 0
  let lastY = 0
  el.canvas.addEventListener('pointerdown', (ev) => {
    const r = el.canvas.getBoundingClientRect()
    const u = (ev.clientX - r.left) / r.width
    const v = (ev.clientY - r.top) / r.height
    dragSrc = -1
    const ns = Number(engine.sources_len())
    for (let i = 0; i < ns; i = i + 1) {
      const sx = engine.source_x(i) as unknown as number
      const sy = engine.source_y(i) as unknown as number
      if (Math.hypot(u - sx, v - sy) < 0.04 && !el.dim3.checked) {
        dragSrc = i
        selSource = i
        return
      }
    }
    dragging = true
    lastX = ev.clientX
    lastY = ev.clientY
  })
  window.addEventListener('pointermove', (ev) => {
    if (dragSrc >= 0) {
      const r = el.canvas.getBoundingClientRect()
      engine.set_source(dragSrc, (ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height, 1.0, dragSrc === 1 ? 1 : 0)
      return
    }
    if (dragging && el.dim3.checked && gpuOn) {
      if (ev.shiftKey) {
        camPanX -= (ev.clientX - lastX) * 0.002
        camPanY += (ev.clientY - lastY) * 0.002
      } else {
        camYaw += (ev.clientX - lastX) * 0.008
        camPitch = Math.max(-1.4, Math.min(1.4, camPitch + (ev.clientY - lastY) * 0.008))
      }
      lastX = ev.clientX
      lastY = ev.clientY
      engine.set_cam(camYaw, camPitch, camDist, camPanX, camPanY)
    }
  })
  window.addEventListener('pointerup', () => {
    dragging = false
    dragSrc = -1
  })
  el.canvas.addEventListener('wheel', (ev) => {
    if (el.dim3.checked && gpuOn) {
      ev.preventDefault()
      camDist = Math.max(0.6, Math.min(4.0, camDist + ev.deltaY * 0.001))
      engine.set_cam(camYaw, camPitch, camDist, camPanX, camPanY)
    }
  }, { passive: false })

  if (useGPU) {
    startGPU()
  } else if (!nogpu && startGL2()) {
    // webgl2 baseline active
  } else {
    startCPU()
  }
  wireCommon()
  rebuildField()
  updateDocent()
}

main().catch((e: unknown) => {
  console.error(e)
  document.getElementById('status')!.textContent = 'error'
})







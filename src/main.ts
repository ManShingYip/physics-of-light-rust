import './style.css'
import init, { add, WaveEngine } from '../pkg/wave_engine.js'
import wgslSrc from './render/wave_blend.wgsl?raw'

const COMMIT_FLOATS = 256 * 4
const COMMIT_BYTES = COMMIT_FLOATS * 4
const UNIFORM_BYTES = 80
const DOT_RADIUS = 0.012
const BUFFER_COPY_DST = 0x08
const BUFFER_UNIFORM = 0x40
const BUFFER_STORAGE = 0x80
const SPLAT_CAP = 8192

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
  d3: '3D 模式：拖曳旋轉相機、滾輪推拉。R0 體渲染／R1 三 slice／R2 點雲；governor 自動降階。',
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

  const adapter = (gpu === undefined ? null : (await gpu.requestAdapter())) as null | {
    requestDevice(d?: unknown): Promise<unknown>
  }
  if (!nogpu && (gpu === undefined || adapter === null)) {
    el.gpuInfo.textContent = 'webgpu: unavailable'
    return
  }
  const device = (await adapter!.requestDevice({
    requiredLimits: { maxStorageBuffersPerShaderStage: 16 },
  })) as Device
  const format = gpu!.getPreferredCanvasFormat()
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

  const mkBuf = (size: number, usage: number): unknown => device.createBuffer({ size, usage }) as unknown
  const uniformBuf = mkBuf(UNIFORM_BYTES, BUFFER_UNIFORM | BUFFER_COPY_DST)
  const commitBuf = mkBuf(COMMIT_BYTES, BUFFER_STORAGE | BUFFER_COPY_DST)
  const realBuf = mkBuf(FW * FH * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
  const imagBuf = mkBuf(FW * FH * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
  const nBuf = mkBuf(9216, BUFFER_STORAGE | BUFFER_COPY_DST)
  const mBuf = mkBuf(9216, BUFFER_STORAGE | BUFFER_COPY_DST)
  const field3Buf = mkBuf(64 * 64 * 64 * 2 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
  const forceBuf = mkBuf(48 * 48 * 10 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
  const dimsBuf = mkBuf(77568 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
  const projBuf = mkBuf(96 * 96 * 3 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
  const splatBuf = mkBuf(SPLAT_CAP * 16, BUFFER_STORAGE | BUFFER_COPY_DST)

  const module = device.createShaderModule({ code: wgslSrc }) as unknown as {
    getCompilationInfo(): Promise<{ messages: { type: string; message: string; lineNum: number }[] }>
  }
  module.getCompilationInfo().then((info) => {
    const errs = info.messages.filter((m) => m.type === 'error')
    if (errs.length > 0) {
      el.gpuInfo.textContent = 'wgsl error L' + String(errs[0].lineNum) + ': ' + errs[0].message
    }
  })
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module, entryPoint: 'vs_main' },
    fragment: { module, entryPoint: 'fs_main', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  }) as unknown
  const pipeline2 = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module, entryPoint: 'vs_splat' },
    fragment: {
      module,
      entryPoint: 'fs_splat',
      targets: [{ format, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }, alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' } } }],
    },
    primitive: { topology: 'triangle-strip' },
  }) as unknown
  const bindGroup = device.createBindGroup({
    layout: (pipeline as { getBindGroupLayout(i: number): unknown }).getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuf } },
      { binding: 1, resource: { buffer: commitBuf } },
      { binding: 2, resource: { buffer: realBuf } },
      { binding: 3, resource: { buffer: imagBuf } },
      { binding: 4, resource: { buffer: nBuf } },
      { binding: 5, resource: { buffer: mBuf } },
      { binding: 6, resource: { buffer: field3Buf } },
      { binding: 7, resource: { buffer: forceBuf } },
      { binding: 8, resource: { buffer: dimsBuf } },
      { binding: 9, resource: { buffer: projBuf } },
    ],
  }) as unknown
  const bindGroup2 = device.createBindGroup({
    layout: (pipeline2 as { getBindGroupLayout(i: number): unknown }).getBindGroupLayout(1),
    entries: [{ binding: 0, resource: { buffer: splatBuf } }],
  }) as unknown

  const renderMode = (): number => {
    const v = el.rmode.value
    if (v === 'slice') return 64
    if (v === 'point') return 128
    if (v === 'ray') return 0
    return govMode
  }
  let govMode = 0

  const flags = (): number =>
    (el.dims.checked ? 1 : 0) |
    (el.duel.checked ? 2 : 0) |
    (el.arrows.checked ? 4 : 0) |
    (el.proj.checked ? 8 : 0) |
    (el.pol.checked ? 16 : 0) |
    (el.dim3.checked ? 32 : 0) |
    renderMode()

  const writeUniform = (oX: number): void => {
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
    device.queue.writeBuffer(uniformBuf, 0, new Uint8Array(ub))
  }

  const uploadCommits = (): void => {
    const v = viewF32(engine.commits_ptr() as unknown as number, Number(engine.commits_f32_len()))
    device.queue.writeBuffer(commitBuf, 0, v)
    el.commitInfo.textContent = 'commits: ' + String(engine.commits_len())
  }
  const uploadField = (): void => {
    device.queue.writeBuffer(realBuf, 0, viewF32(engine.real_ptr() as unknown as number, Number(engine.real_len())))
    device.queue.writeBuffer(imagBuf, 0, viewF32(engine.imag_ptr() as unknown as number, Number(engine.imag_len())))
  }
  const uploadGrids = (): void => {
    device.queue.writeBuffer(nBuf, 0, viewF32(engine.n_ptr() as unknown as number, Number(engine.n_len())))
    device.queue.writeBuffer(mBuf, 0, viewF32(engine.mask_ptr() as unknown as number, Number(engine.mask_len())))
  }
  const uploadForce = (): void => {
    device.queue.writeBuffer(forceBuf, 0, viewF32(engine.force_grid_ptr() as unknown as number, Number(engine.force_grid_len())))
  }
  const uploadDims = (): void => {
    device.queue.writeBuffer(dimsBuf, 0, viewF32(engine.dims_ptr() as unknown as number, Number(engine.dims_f32_len())))
  }
  const uploadField3 = (): void => {
    const len = Number(engine.field3_len())
    if (len > 0) {
      device.queue.writeBuffer(field3Buf, 0, viewF32(engine.field3_ptr() as unknown as number, len))
    }
  }
  const uploadSplats = (): void => {
    const v = viewF32(engine.splats_ptr() as unknown as number, Number(engine.splats_len()) * 4)
    device.queue.writeBuffer(splatBuf, 0, v)
  }
  const uploadProjs = (): void => {
    device.queue.writeBuffer(projBuf, 0, viewF32(engine.projs_ptr() as unknown as number, Number(engine.projs_len())))
  }

  const syncForces = (): void => {
    for (let i = 0; i < 4; i = i + 1) {
      engine.set_force_on(i, fOn[i].checked)
      engine.set_weight(i, num(fW[i].value))
      engine.set_slot(i, Number.parseInt(slotSel[i].value, 10))
    }
    engine.set_lensing(el.lensing.checked)
  }

  const rebuildField = (): void => {
    engine.set_barrier(num(el.barrier.value))
    engine.set_sep(num(el.sep.value))
    engine.set_k(num(el.k.value))
    syncForces()
    engine.set_dim3(el.dim3.checked)
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
    if (el.pol.checked) {
      const a = num(el.polA.value)
      const b = num(el.polB.value)
      t += ' Malus T=' + (Math.cos(a) ** 2 * Math.cos(b - a) ** 2).toFixed(3)
    }
    el.docentSide.textContent = t
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
      const json = engine.run_unity(400) as unknown as string
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

  if (nogpu) {
    el.gpuInfo.textContent = 'raster mode (Rust CPU)'
    const ctx2d = el.canvas.getContext('2d')
    if (ctx2d === null) {
      return
    }
    const off = document.createElement('canvas')
    off.width = 96
    off.height = 96
    const octx = off.getContext('2d')
    if (octx === null) {
      return
    }
    const img = octx.createImageData(96, 96)
    let rasterTicks = 0
    window.setInterval(() => {
      rasterTicks = rasterTicks + 1
      if (rasterTicks === 5) {
        console.log('raster tick 5 ok')
      }
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
      el.canvas.width = Math.max(1, Math.round(r.width))
      el.canvas.height = Math.max(1, Math.round(r.height))
      ctx2d.imageSmoothingEnabled = false
      ctx2d.drawImage(off, 0, 0, el.canvas.width, el.canvas.height)
      el.commitInfo.textContent = 'commits: ' + String(engine.commits_len())
    }, 33)
    wireCommon()
    return
  }

  const context = el.canvas.getContext('webgpu') as unknown as {
    configure(c: unknown): void
    getCurrentTexture(): { createView(): unknown }
  }
  context.configure({ device, format, alphaMode: 'opaque' })

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
    el.scene.addEventListener('change', rebuildField)
    el.barrier.addEventListener('change', rebuildField)
    el.sep.addEventListener('change', rebuildField)
    el.k.addEventListener('change', rebuildField)
    el.dim3.addEventListener('change', rebuildField)
    el.rays.addEventListener('change', () => engine.set_rays(el.rays.checked))
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
      else if (key === 'v') { engine.flip_source(selSource); }
      else if (key === 'x') { engine.remove_source(selSource); }
      else if (key === 'c') { engine.add_source(0.6, 0.4, 0.5, 0); }
      else if (key === 'k') { engine.kick(0.004); }
      else if (key === 't') { engine.reverse_time(); }
      else if (key === 'u') runUnity()
      else if (key === 'r') resample()
      else if (key === 'e') exportSig()
      else if (key === 'q') { selDepth = Math.max(0, selDepth - 0.05); engine.set_source_depth(selSource, selDepth) }
      else if (key === 'e' && ev.shiftKey) { selDepth = Math.min(1, selDepth + 0.05); engine.set_source_depth(selSource, selDepth) }
      else if (key === 'e') exportSig()
      else if (key === 'Tab') { ev.preventDefault(); selSource = (selSource + 1) % Math.max(1, Number(engine.sources_len())) }
      else if (key === ' ') { paused = !paused; ev.preventDefault() }
      else if (key === '[') el.obsW.value = String(Math.max(0, num(el.obsW.value) - 0.02))
      else if (key === ']') el.obsW.value = String(Math.min(0.5, num(el.obsW.value) + 0.02))
      else if (key === 'ArrowLeft' || key === 'ArrowRight') {
        if (el.dim3.checked) {
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

  let camYaw = 0.7
  let camPitch = 0.4
  let camDist = 1.7
  let camPanX = 0
  let camPanY = 0
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
    if (dragging && el.dim3.checked) {
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
    if (el.dim3.checked) {
      ev.preventDefault()
      camDist = Math.max(0.6, Math.min(4.0, camDist + ev.deltaY * 0.001))
      engine.set_cam(camYaw, camPitch, camDist, camPanX, camPanY)
    }
  }, { passive: false })

  rebuildField()
  wireCommon()
  getEl('projBtn').addEventListener('click', () => {
    engine.compute_projs()
    uploadProjs()
  })
  el.gpuInfo.textContent = 'webgpu: ready'

  let frames = 0
  let sweepT = 0
  let ema = 16
  let lastT = performance.now()
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
    const enc = device.createCommandEncoder()
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
    device.queue.submit([enc.finish()])
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

main().catch((e: unknown) => {
  console.error(e)
  document.getElementById('status')!.textContent = 'error'
})






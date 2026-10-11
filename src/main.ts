import './style.css'
import init, { add, WaveEngine } from '../pkg/wave_engine.js'
import wgslSrc from './render/wave_blend.wgsl?raw'

const MAX_COMMITS = 256
const COMMIT_FLOATS = MAX_COMMITS * 4
const COMMIT_BYTES = COMMIT_FLOATS * 4
const UNIFORM_BYTES = 80
const DOT_RADIUS = 0.012
const BUFFER_COPY_DST = 0x08
const BUFFER_UNIFORM = 0x40
const BUFFER_STORAGE = 0x80

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
      draw(n: number): void
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
  s5: '雙縫：波穿兩縫干涉；白點=單次 commit 事件；右緣直方圖=干涉條紋。微粒說在此預測兩坨，畫面否證佢。',
  s1: '影：圓盤擋波；邊緣衍射彎入影區（波動說預測、微粒說解釋唔到）。obs 線打點中間缺口=影嘅簽名。',
  s3: '棱鏡：n=1.45 介質壓縮波長（棋格=相位混疊）、波前輕彎。色散 n(λ) 未實施（M-S2 已知限制）。',
  dims: '維度階梯 D=1..4：強 Huygens 只喺奇數維≥3 成立——D=3 格波前鋭利無尾跡，D=1/2/4 留尾跡。',
  duel: '左=Born 視圖（波場+commits）；右=力律視圖（尾跡增強、波場壓暗）。同一後端、兩種呈現。',
}

async function main(): Promise<void> {
  const wasm = await init()
  getEl('status').textContent = 'ready'
  getEl('result').textContent = add(2n, 2n).toString()

  const engine = new WaveEngine(96, 96)
  const FW = Number(engine.width())
  const FH = Number(engine.height())
  const FIELD_BYTES = FW * FH * 4
  let seed = 12345n
  let paused = false

  const mem = (): WebAssembly.Memory => (wasm as unknown as { memory: WebAssembly.Memory }).memory

  const readF32 = (ptr: number, len: number): Float32Array => {
    try {
      if (len === 0) {
        return new Float32Array(0)
      }
      return new Float32Array(mem().buffer, ptr, len).slice()
    } catch (e) {
      console.error('readF32 fail', ptr, len, e)
      return new Float32Array(0)
    }
  }

  const readCommits = (): Float32Array =>
    readF32(engine.commits_ptr() as unknown as number, Number(engine.commits_f32_len()))

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
    polA: getEl<HTMLInputElement>('polA'),
    polB: getEl<HTMLInputElement>('polB'),
    scene: getEl<HTMLSelectElement>('sceneSel'),
    gpuInfo: getEl('gpuInfo'),
    commitInfo: getEl('commitInfo'),
    timeInfo: getEl('timeInfo'),
    sigInfo: getEl('sigInfo'),
    docentSide: getEl('docentSide'),
    help: getEl('helpOverlay'),
    selftest: getEl('selftest'),
    unityBox: getEl('unityBox'),
    customExpr: getEl<HTMLInputElement>('customExpr'),
  }
  const fOn: HTMLInputElement[] = [0, 1, 2, 3].map((i) => getEl<HTMLInputElement>('fOn' + String(i)))
  const fW: HTMLInputElement[] = [0, 1, 2, 3].map((i) => getEl<HTMLInputElement>('fW' + String(i)))

  const num = (v: string): number => Number.parseFloat(v)
  const obsX = (): number => num(el.obsX.value)
  const sceneId = (): number => Number.parseInt(el.scene.value, 10)

  const gpu = (navigator as unknown as { gpu?: unknown }).gpu as
    | { requestAdapter(): Promise<unknown>; getPreferredCanvasFormat(): string }
    | undefined
  if (gpu === undefined) {
    el.gpuInfo.textContent = 'webgpu: unavailable (backend still works)'
    return
  }
  const adapter = (await gpu.requestAdapter()) as null | { requestDevice(d?: unknown): Promise<unknown> }
  if (adapter === null) {
    el.gpuInfo.textContent = 'webgpu: no adapter'
    return
  }
  const device = (await adapter.requestDevice({
    requiredLimits: { maxStorageBuffersPerShaderStage: 16 },
  })) as Device
  const context = el.canvas.getContext('webgpu') as unknown as {
    configure(c: unknown): void
    getCurrentTexture(): { createView(): unknown }
  }
  const format = gpu.getPreferredCanvasFormat()
  context.configure({ device, format, alphaMode: 'opaque' })

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

  const mkBuf = (size: number, usage: number): unknown =>
    device.createBuffer({ size, usage }) as unknown
  const uniformBuf = mkBuf(UNIFORM_BYTES, BUFFER_UNIFORM | BUFFER_COPY_DST)
  const commitBuf = mkBuf(COMMIT_BYTES, BUFFER_STORAGE | BUFFER_COPY_DST)
  const realBuf = mkBuf(FIELD_BYTES, BUFFER_STORAGE | BUFFER_COPY_DST)
  const imagBuf = mkBuf(FIELD_BYTES, BUFFER_STORAGE | BUFFER_COPY_DST)
  const nBuf = mkBuf(9216, BUFFER_STORAGE | BUFFER_COPY_DST)
  const mBuf = mkBuf(9216, BUFFER_STORAGE | BUFFER_COPY_DST)
  const trailBuf = mkBuf(1024 * 16, BUFFER_STORAGE | BUFFER_COPY_DST)
  const forceBuf = mkBuf(48 * 48 * 10 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
  const dimsBuf = mkBuf(77568 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)
  const projBuf = mkBuf(96 * 96 * 3 * 4, BUFFER_STORAGE | BUFFER_COPY_DST)

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
  const bindGroup = device.createBindGroup({
    layout: (pipeline as { getBindGroupLayout(i: number): unknown }).getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuf } },
      { binding: 1, resource: { buffer: commitBuf } },
      { binding: 2, resource: { buffer: realBuf } },
      { binding: 3, resource: { buffer: imagBuf } },
      { binding: 4, resource: { buffer: nBuf } },
      { binding: 5, resource: { buffer: mBuf } },
      { binding: 6, resource: { buffer: trailBuf } },
      { binding: 7, resource: { buffer: forceBuf } },
      { binding: 8, resource: { buffer: dimsBuf } },
      { binding: 9, resource: { buffer: projBuf } },
    ],
  }) as unknown

  const flags = (): number =>
    (el.dims.checked ? 1 : 0) | (el.duel.checked ? 2 : 0) | (el.arrows.checked ? 4 : 0) |
    (el.proj.checked ? 8 : 0) | (el.pol.checked ? 16 : 0)

  const writeUniform = (oX: number): void => {
    const ub = new ArrayBuffer(UNIFORM_BYTES)
    const dv = new DataView(ub)
    dv.setFloat32(0, oX, true)
    dv.setFloat32(4, num(el.obsW.value), true)
    dv.setFloat32(8, DOT_RADIUS, true)
    dv.setUint32(12, Number(engine.commits_len()), true)
    dv.setUint32(16, FW, true)
    dv.setUint32(20, FH, true)
    dv.setFloat32(24, engine.time(), true)
    dv.setUint32(28, Number(engine.trails_len()), true)
    dv.setFloat32(32, num(el.barrier.value), true)
    dv.setFloat32(36, 0.4, true)
    dv.setFloat32(40, 0.6, true)
    dv.setFloat32(44, el.hist.checked ? 1 : 0, true)
    dv.setUint32(48, flags(), true)
    dv.setFloat32(52, num(el.polA.value), true)
    dv.setFloat32(56, num(el.polB.value), true)
    device.queue.writeBuffer(uniformBuf, 0, new Uint8Array(ub))
  }

  const uploadCommits = (): void => {
    const src = readCommits()
    const padded = new Float32Array(COMMIT_FLOATS)
    padded.set(src.subarray(0, Math.min(src.length, COMMIT_FLOATS)))
    device.queue.writeBuffer(commitBuf, 0, padded)
    el.commitInfo.textContent = 'commits: ' + String(engine.commits_len())
  }

  const uploadField = (): void => {
    const r = readF32(engine.real_ptr() as unknown as number, Number(engine.real_len()))
    const im = readF32(engine.imag_ptr() as unknown as number, Number(engine.imag_len()))
    if (r.length === FW * FH) {
      device.queue.writeBuffer(realBuf, 0, r)
    }
    if (im.length === FW * FH) {
      device.queue.writeBuffer(imagBuf, 0, im)
    }
  }

  const uploadGrids = (): void => {
    const n = readF32(engine.n_ptr() as unknown as number, Number(engine.n_len()))
    const m = readF32(engine.mask_ptr() as unknown as number, Number(engine.mask_len()))
    if (n.length === 2304) {
      device.queue.writeBuffer(nBuf, 0, n)
    }
    if (m.length === 2304) {
      device.queue.writeBuffer(mBuf, 0, m)
    }
  }

  const uploadTrails = (): void => {
    const src = readF32(engine.trails_ptr() as unknown as number, Number(engine.trails_f32_len()))
    const padded = new Float32Array(1024 * 4)
    padded.set(src.subarray(0, Math.min(src.length, 1024 * 4)))
    device.queue.writeBuffer(trailBuf, 0, padded)
  }

  const uploadForce = (): void => {
    const g = readF32(engine.force_grid_ptr() as unknown as number, Number(engine.force_grid_len()))
    if (g.length === 23040) {
      device.queue.writeBuffer(forceBuf, 0, g)
    }
  }

  const uploadDims = (): void => {
    const d = readF32(engine.dims_ptr() as unknown as number, Number(engine.dims_f32_len()))
    if (d.length === 77568) {
      device.queue.writeBuffer(dimsBuf, 0, d)
    }
  }

  const uploadProjs = (): void => {
    const p = readF32(engine.projs_ptr() as unknown as number, Number(engine.projs_len()))
    if (p.length === 96 * 96 * 3) {
      device.queue.writeBuffer(projBuf, 0, p)
    }
  }

  const syncForces = (): void => {
    for (let i = 0; i < 4; i = i + 1) {
      engine.set_force_on(i, fOn[i].checked)
      engine.set_weight(i, num(fW[i].value))
    }
    engine.set_lensing(el.lensing.checked)
  }

  const rebuildField = (): void => {
    engine.set_barrier(num(el.barrier.value))
    engine.set_sep(num(el.sep.value))
    engine.set_k(num(el.k.value))
    syncForces()
    engine.set_scene(sceneId())
    uploadField()
    uploadGrids()
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
    if (el.dims.checked) {
      t = DOCENT.dims
    } else if (el.duel.checked) {
      t = DOCENT.duel
    } else if (el.proj.checked) {
      t = '投影四面板：x-空間／k-空間(|FFT|²)／相空間(Wigner, 藍=負準機率)／路徑密度。觀點維，非空間維。'
    }
    if (el.pol.checked) {
      const a = num(el.polA.value)
      const b = num(el.polB.value)
      const T = Math.cos(a) ** 2 * Math.cos(b - a) ** 2
      t += ' Malus: T=cos²(a)cos²(b−a)=' + T.toFixed(3)
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
    el.unityBox.textContent = 'running batch (sync, ~1-2s)...'
    window.setTimeout(() => {
      const json = engine.run_unity(400) as unknown as string
      const rows = JSON.parse(json) as {
        env: number
        cells: { f: string; pass: boolean; hist: number[] }[]
      }[]
      const names = ['corpuscular', 'wave', 'born', 'guidance', 'hforce']
      let html = '<table style="color:#ddd;font-size:11px;border-collapse:collapse"><tr><td>env\\formula</td>'
      for (const n of names) {
        html += '<td style="padding:2px 6px">' + n + '</td>'
      }
      html += '</tr>'
      for (const r of rows) {
        html += '<tr><td style="padding:2px 6px">scene' + String(r.env) + '</td>'
        for (const c of r.cells) {
          const all = c.pass
          html +=
            '<td style="padding:2px 6px;color:' +
            (all ? '#6f6' : '#f66') +
            '">' +
            (all ? 'PASS' : 'fail') +
            '</td>'
        }
        html += '</tr>'
      }
      html += '</table><div style="font-size:10px;color:#999">一列全綠 = 該公式統一回答所有環境（同時接納判據）</div>'
      el.unityBox.innerHTML = html
    }, 30)
  }

  const exportSig = (): void => {
    const s = engine.signature() as unknown as number[]
    const data = {
      scene: sceneId(),
      t: engine.time(),
      signature: { peaks: s[0], fringe_shift: s[1], deflection: s[2], hist_corr: s[3] },
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'signature.json'
    a.click()
  }

  rebuildField()
  el.gpuInfo.textContent = 'webgpu: ready'

  getEl('resample').addEventListener('click', resample)
  getEl('unityBtn').addEventListener('click', runUnity)
  getEl('exportBtn').addEventListener('click', exportSig)
  getEl('projBtn').addEventListener('click', () => {
    engine.compute_projs()
    uploadProjs()
  })
  el.rays.addEventListener('change', () => {
    engine.set_rays(el.rays.checked)
  })
  el.proj.addEventListener('change', updateDocent)
  el.pol.addEventListener('change', updateDocent)
  el.polA.addEventListener('input', updateDocent)
  el.polB.addEventListener('input', updateDocent)
  getEl('applyExpr').addEventListener('click', () => {
    const ok = engine.set_custom_expr(el.customExpr.value)
    getEl('exprStatus').textContent = ok ? 'expr ok' : 'expr rejected'
  })
  el.scene.addEventListener('change', rebuildField)
  el.barrier.addEventListener('change', rebuildField)
  el.sep.addEventListener('change', rebuildField)
  el.k.addEventListener('change', rebuildField)
  for (let i = 0; i < 4; i = i + 1) {
    fOn[i].addEventListener('change', syncForces)
    fW[i].addEventListener('change', syncForces)
  }
  el.lensing.addEventListener('change', syncForces)
  el.dims.addEventListener('change', updateDocent)
  el.duel.addEventListener('change', updateDocent)
  el.docent.addEventListener('change', updateDocent)

  let dragIdx = -1
  const toUv = (ev: PointerEvent): [number, number] => {
    const r = el.canvas.getBoundingClientRect()
    return [(ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height]
  }
  el.canvas.addEventListener('pointerdown', (ev) => {
    const [u, v] = toUv(ev)
    for (let i = 0; i < 4; i = i + 1) {
      const sx = engine.source_x(i) as unknown as number
      const sy = engine.source_y(i) as unknown as number
      if (Math.hypot(u - sx, v - sy) < 0.04) {
        dragIdx = i
        return
      }
    }
  })
  window.addEventListener('pointermove', (ev) => {
    if (dragIdx < 0) {
      return
    }
    const [u, v] = toUv(ev)
    engine.set_source(dragIdx, u, v, 1.0, dragIdx === 1 ? 1 : 0)
  })
  window.addEventListener('pointerup', () => {
    dragIdx = -1
  })

  window.addEventListener('keydown', (ev) => {
    const key = ev.key
    if (key === '1') {
      el.scene.value = '1'
      rebuildField()
    } else if (key === '2') {
      el.scene.value = '3'
      rebuildField()
    } else if (key === '3') {
      el.scene.value = '5'
      rebuildField()
    } else if (key === 'p') {
      el.particles.checked = !el.particles.checked
    } else if (key === 'h') {
      el.hist.checked = !el.hist.checked
    } else if (key === 'a') {
      el.accum.checked = !el.accum.checked
    } else if (key === 'd') {
      el.duel.checked = !el.duel.checked
      updateDocent()
    } else if (key === 'l') {
      el.dims.checked = !el.dims.checked
      updateDocent()
    } else if (key === 'g') {
      el.docent.checked = !el.docent.checked
      updateDocent()
    } else if (key === 'u') {
      runUnity()
    } else if (key === 'r') {
      resample()
    } else if (key === 'e') {
      exportSig()
    } else if (key === ' ') {
      paused = !paused
      ev.preventDefault()
    } else if (key === '[') {
      el.obsW.value = String(Math.max(0, num(el.obsW.value) - 0.02))
    } else if (key === ']') {
      el.obsW.value = String(Math.min(0.5, num(el.obsW.value) + 0.02))
    } else if (key === 'ArrowLeft') {
      el.obsX.value = String(Math.max(0, obsX() - 0.02))
    } else if (key === 'ArrowRight') {
      el.obsX.value = String(Math.min(1.2, obsX() + 0.02))
    } else if (key === '?') {
      el.help.style.display = el.help.style.display === 'none' ? 'block' : 'none'
    }
  })

  if (window.location.search.includes('selftest')) {
    const json = engine.selftest() as unknown as string
    const lines = JSON.parse(json) as { name: string; pass: boolean }[]
    el.selftest.style.display = 'block'
    el.selftest.textContent = lines
      .map((l) => (l.pass ? 'PASS ' : 'FAIL ') + l.name)
      .join('\n')
    for (const l of lines) {
      console.log((l.pass ? 'PASS ' : 'FAIL ') + l.name)
    }
  }

  let frames = 0
  let sweepT = 0
  const frame = (): void => {
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
    writeUniform(oX)
    uploadField()
    uploadTrails()
    if (frames % 6 === 0) {
      uploadForce()
    }
    if (el.dims.checked && frames % 3 === 0) {
      uploadDims()
    }
    const enc = device.createCommandEncoder()
    const view = context.getCurrentTexture().createView()
    const pass = enc.beginRenderPass({
      colorAttachments: [{ view, loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
    })
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.draw(3)
    pass.end()
    device.queue.submit([enc.finish()])
    frames = frames + 1
    if (frames % 30 === 0) {
      el.commitInfo.textContent = 'commits: ' + String(engine.commits_len())
      el.timeInfo.textContent = 't: ' + engine.time().toFixed(2) + ' obs: ' + oX.toFixed(2)
      const s = engine.signature() as unknown as number[]
      el.sigInfo.textContent =
        'sig peaks=' + s[0].toFixed(0) + ' shift=' + s[1].toFixed(3) + ' corr=' + s[3].toFixed(2)
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

main().catch((e: unknown) => {
  console.error(e)
  document.getElementById('status')!.textContent = 'error'
})


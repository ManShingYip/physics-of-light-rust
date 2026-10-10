import './style.css'
import init, { add, WaveEngine } from '../pkg/wave_engine.js'
import wgslSrc from './render/wave_blend.wgsl?raw'

const MAX_COMMITS = 256
const COMMIT_FLOATS = MAX_COMMITS * 4
const COMMIT_BYTES = COMMIT_FLOATS * 4
const UNIFORM_BYTES = 48
const DOT_RADIUS = 0.012
// GPUBufferUsage bits (WebGPU headers may be absent, so spell them out):
// COPY_SRC = 0x04, COPY_DST = 0x08, UNIFORM = 0x40, STORAGE = 0x80.
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

async function main(): Promise<void> {
  const wasm = await init()
  getEl('status').textContent = 'ready'
  getEl('result').textContent = add(2n, 2n).toString()

  const engine = new WaveEngine(96, 96)
  const FW = Number(engine.width())
  const FH = Number(engine.height())
  const FIELD_BYTES = FW * FH * 4
  let seed = 12345n

  const mem = (): WebAssembly.Memory =>
    (wasm as unknown as { memory: WebAssembly.Memory }).memory

  const readF32 = (ptr: number, len: number): Float32Array => {
    try {
      if (len === 0) {
        return new Float32Array(0)
      }
      return new Float32Array(mem().buffer, ptr, len).slice()
    } catch {
      return new Float32Array(0)
    }
  }

  const readCommits = (): Float32Array =>
    readF32(engine.commits_ptr() as unknown as number, Number(engine.commits_f32_len()))

  const canvas = getEl<HTMLCanvasElement>('canvas')
  const obsXInput = getEl<HTMLInputElement>('obsX')
  const obsWInput = getEl<HTMLInputElement>('obsW')
  const barrierInput = getEl<HTMLInputElement>('barrierX')
  const sepInput = getEl<HTMLInputElement>('slitSep')
  const kInput = getEl<HTMLInputElement>('waveK')
  const sweepInput = getEl<HTMLInputElement>('sweep')
  const speedInput = getEl<HTMLInputElement>('sweepSpeed')
  const accumInput = getEl<HTMLInputElement>('accum')
  const histInput = getEl<HTMLInputElement>('hist')
  const gpuInfo = getEl('gpuInfo')
  const commitInfo = getEl('commitInfo')
  const timeInfo = getEl('timeInfo')

  const currentObsX = (): number => Number.parseFloat(obsXInput.value)
  const currentObsW = (): number => Number.parseFloat(obsWInput.value)
  const currentBarrier = (): number => Number.parseFloat(barrierInput.value)
  const currentSep = (): number => Number.parseFloat(sepInput.value)
  const currentK = (): number => Number.parseFloat(kInput.value)
  const slitYs = (): [number, number] => {
    const s = currentSep()
    return [0.5 - s / 2, 0.5 + s / 2]
  }

  const gpu = (navigator as unknown as { gpu?: unknown }).gpu as
    | {
        requestAdapter(): Promise<unknown>
        getPreferredCanvasFormat(): string
      }
    | undefined
  if (gpu === undefined) {
    gpuInfo.textContent = 'webgpu: unavailable (backend still works)'
    const ys = slitYs()
    engine.init_double_slit(currentBarrier(), ys[0], ys[1], currentK())
    engine.sample_commits(0.75, 12, seed)
    seed = seed + 1n
    commitInfo.textContent = 'commits: ' + String(engine.commits_len())
    return
  }

  const adapter = (await gpu.requestAdapter()) as null | {
    requestDevice(): Promise<unknown>
  }
  if (adapter === null) {
    gpuInfo.textContent = 'webgpu: no adapter'
    return
  }
  const device = (await adapter.requestDevice()) as Device
  const context = canvas.getContext('webgpu') as unknown as {
    configure(c: unknown): void
    getCurrentTexture(): { createView(): unknown }
  }
  const format = gpu.getPreferredCanvasFormat()
  context.configure({ device, format, alphaMode: 'opaque' })

  const fitCanvas = (): void => {
    const r = canvas.getBoundingClientRect()
    const w = Math.max(1, Math.round(r.width))
    const h = Math.max(1, Math.round(r.height))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
  }
  fitCanvas()

  const uniformBuf = device.createBuffer({
    size: UNIFORM_BYTES,
    usage: BUFFER_UNIFORM | BUFFER_COPY_DST,
  }) as unknown
  const commitBuf = device.createBuffer({
    size: COMMIT_BYTES,
    usage: BUFFER_STORAGE | BUFFER_COPY_DST,
  }) as unknown
  const realBuf = device.createBuffer({
    size: FIELD_BYTES,
    usage: BUFFER_STORAGE | BUFFER_COPY_DST,
  }) as unknown
  const imagBuf = device.createBuffer({
    size: FIELD_BYTES,
    usage: BUFFER_STORAGE | BUFFER_COPY_DST,
  }) as unknown
  const module = device.createShaderModule({ code: wgslSrc }) as unknown as {
    getCompilationInfo(): Promise<{
      messages: { type: string; message: string; lineNum: number; linePos: number }[]
    }>
  }
  // Surface WGSL compile errors on-screen: an invalid pipeline draws
  // silently-black, which is otherwise indistinguishable from "working".
  module.getCompilationInfo().then((info) => {
    const errs = info.messages.filter((m) => m.type === 'error')
    if (errs.length > 0) {
      const first = errs[0]
      gpuInfo.textContent = 'wgsl error L' + String(first.lineNum) + ': ' + first.message
      console.error(info.messages)
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
    ],
  }) as unknown

  const writeUniform = (obsX: number): void => {
    const ys = slitYs()
    const ub = new ArrayBuffer(UNIFORM_BYTES)
    const dv = new DataView(ub)
    dv.setFloat32(0, obsX, true)
    dv.setFloat32(4, currentObsW(), true)
    dv.setFloat32(8, DOT_RADIUS, true)
    dv.setUint32(12, Number(engine.commits_len()), true)
    dv.setUint32(16, FW, true)
    dv.setUint32(20, FH, true)
    dv.setFloat32(24, engine.time(), true)
    dv.setFloat32(28, 0, true)
    dv.setFloat32(32, currentBarrier(), true)
    dv.setFloat32(36, ys[0], true)
    dv.setFloat32(40, ys[1], true)
    dv.setFloat32(44, histInput.checked ? 1 : 0, true)
    device.queue.writeBuffer(uniformBuf, 0, new Uint8Array(ub))
  }

  const uploadCommits = (): void => {
    const src = readCommits()
    const padded = new Float32Array(COMMIT_FLOATS)
    padded.set(src.subarray(0, Math.min(src.length, COMMIT_FLOATS)))
    device.queue.writeBuffer(commitBuf, 0, padded)
    commitInfo.textContent = 'commits: ' + String(engine.commits_len())
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

  const rebuildField = (): void => {
    const ys = slitYs()
    engine.init_double_slit(currentBarrier(), ys[0], ys[1], currentK())
    uploadField()
    engine.clear_commits()
    engine.sample_commits(currentObsX(), 12, seed)
    seed = seed + 1n
    writeUniform(currentObsX())
    uploadCommits()
  }

  rebuildField()
  gpuInfo.textContent = 'webgpu: ready'

  getEl('resample').addEventListener('click', () => {
    engine.clear_commits()
    engine.sample_commits(currentObsX(), 12, seed)
    seed = seed + 1n
    writeUniform(currentObsX())
    uploadCommits()
  })
  barrierInput.addEventListener('change', rebuildField)
  sepInput.addEventListener('change', rebuildField)
  kInput.addEventListener('change', rebuildField)

  let frames = 0
  let sweepT = 0
  const frame = (): void => {
    fitCanvas()
    engine.step(0.016)
    let obsX = currentObsX()
    if (sweepInput.checked) {
      sweepT = sweepT + 0.016 * Number.parseFloat(speedInput.value)
      obsX = 0.6 + 0.6 * Math.sin(sweepT)
      obsXInput.value = obsX.toFixed(2)
    }
    // Accumulate: fresh Born samples stream in, oldest drain at 256.
    // Dots pile up exactly where fringes are bright.
    if (accumInput.checked && frames % 20 === 0) {
      engine.sample_commits(obsX, 2, seed)
      seed = seed + 1n
      uploadCommits()
    }
    writeUniform(obsX)
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
      commitInfo.textContent = 'commits: ' + String(engine.commits_len())
      timeInfo.textContent = 't: ' + engine.time().toFixed(2) + ' obs: ' + obsX.toFixed(2)
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

main().catch((e: unknown) => {
  console.error(e)
  document.getElementById('status')!.textContent = 'error'
})

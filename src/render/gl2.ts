export class Gl2Renderer {
  readonly ok: boolean
  private gl: WebGL2RenderingContext
  private progField: WebGLProgram
  private progPoint: WebGLProgram
  private texField: WebGLTexture
  private texMaskN: WebGLTexture
  private vaoPoint: WebGLVertexArrayObject
  private bufPoint: WebGLBuffer
  private histLoc: WebGLUniformLocation | null
  private pointCount = 0

  constructor(canvas: HTMLCanvasElement, src: string) {
    this.ok = false
    const gl = canvas.getContext('webgl2', { antialias: true }) as WebGL2RenderingContext | null
    if (gl === null) {
      this.gl = null as unknown as WebGL2RenderingContext
      this.progField = null as unknown as WebGLProgram
      this.progPoint = null as unknown as WebGLProgram
      this.texField = null as unknown as WebGLTexture
      this.texMaskN = null as unknown as WebGLTexture
      this.vaoPoint = null as unknown as WebGLVertexArrayObject
      this.bufPoint = null as unknown as WebGLBuffer
      this.histLoc = null
      return
    }
    this.gl = gl
    const parts = src.split('----')
    const vsF = this.compile(gl.VERTEX_SHADER, parts[0])
    const fsF = this.compile(gl.FRAGMENT_SHADER, parts[1])
    const vsP = this.compile(gl.VERTEX_SHADER, parts[2])
    const fsP = this.compile(gl.FRAGMENT_SHADER, parts[3])
    this.progField = this.link(vsF, fsF)
    this.progPoint = this.link(vsP, fsP)
    this.texField = this.mkTex()
    this.texMaskN = this.mkTex()
    this.vaoPoint = gl.createVertexArray() as WebGLVertexArrayObject
    this.bufPoint = gl.createBuffer() as WebGLBuffer
    gl.bindVertexArray(this.vaoPoint)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPoint)
    gl.bufferData(gl.ARRAY_BUFFER, 8192 * 12, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 12, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 12, 8)
    gl.bindVertexArray(null)
    this.histLoc = gl.getUniformLocation(this.progField, 'uHist[0]')
    this.ok = true
  }

  private compile(type: number, src: string): WebGLShader {
    const gl = this.gl
    const sh = gl.createShader(type) as WebGLShader
    gl.shaderSource(sh, src.trim())
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh))
    }
    return sh
  }

  private link(a: WebGLShader, b: WebGLShader): WebGLProgram {
    const gl = this.gl
    const p = gl.createProgram() as WebGLProgram
    gl.attachShader(p, a)
    gl.attachShader(p, b)
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(p))
    }
    return p
  }

  private mkTex(): WebGLTexture {
    const gl = this.gl
    const t = gl.createTexture() as WebGLTexture
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }

  setField(re: Float32Array, im: Float32Array, w: number, h: number): void {
    const gl = this.gl
    const inter = new Float32Array(w * h * 2)
    for (let i = 0; i < w * h; i = i + 1) {
      inter[i * 2] = re[i]
      inter[i * 2 + 1] = im[i]
    }
    gl.bindTexture(gl.TEXTURE_2D, this.texField)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, w, h, 0, gl.RG, gl.FLOAT, inter)
  }

  setMaskN(mask: Float32Array, n: Float32Array): void {
    const gl = this.gl
    const inter = new Float32Array(mask.length * 2)
    for (let i = 0; i < mask.length; i = i + 1) {
      inter[i * 2] = mask[i]
      inter[i * 2 + 1] = n[i]
    }
    gl.bindTexture(gl.TEXTURE_2D, this.texMaskN)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, 48, 48, 0, gl.RG, gl.FLOAT, inter)
  }

  setPoints(splats: Float32Array, count: number): void {
    const gl = this.gl
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPoint)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, splats.subarray(0, count * 3))
    this.pointCount = count
  }

  draw(obsX: number, obsW: number, histOn: number, duel: number, hist: number[], fieldW: number, fieldH: number, pointSize: number): void {
    const gl = this.gl
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)
    gl.useProgram(this.progField)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texField)
    gl.uniform1i(gl.getUniformLocation(this.progField, 'uField'), 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.texMaskN)
    gl.uniform1i(gl.getUniformLocation(this.progField, 'uMaskN'), 1)
    gl.uniform2i(gl.getUniformLocation(this.progField, 'uFieldSize'), fieldW, fieldH)
    gl.uniform4f(gl.getUniformLocation(this.progField, 'uObs'), obsX, obsW, histOn, duel)
    gl.uniform1fv(this.histLoc, hist)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    if (this.pointCount > 0) {
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
      gl.useProgram(this.progPoint)
      gl.uniform1f(gl.getUniformLocation(this.progPoint, 'uSize'), pointSize)
      gl.bindVertexArray(this.vaoPoint)
      gl.drawArrays(gl.POINTS, 0, this.pointCount)
      gl.bindVertexArray(null)
      gl.disable(gl.BLEND)
    }
  }
}

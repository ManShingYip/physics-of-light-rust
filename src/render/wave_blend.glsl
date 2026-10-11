#version 300 es
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

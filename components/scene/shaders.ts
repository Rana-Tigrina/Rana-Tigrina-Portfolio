// GLSL for the well. Everything is lit by one thing: the lamp (uLamp, uPower).
import * as THREE from "three";

const shared = () => ({
  uTime: { value: 0 },
  uLamp: { value: new THREE.Vector3() },
  uPower: { value: 1 },
  uDread: { value: 0 }, // 0..1, turns the lamp sickly when the serpent is near
});

const worldPosition = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
  }`;

const noise = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
  vec3 lampColour(float dread) { return mix(vec3(1.0, 0.6, 0.26), vec3(0.5, 0.9, 0.45), dread * 0.7); }`;

// Brick, moss and damp, with carved bands: jaali stars near the top, serpent scales near the bottom.
export const wallShader = {
  uniforms: { ...shared(), uDiyas: { value: [] as THREE.Vector3[] } },
  vertexShader: worldPosition,
  fragmentShader: /* glsl */ `
    uniform float uTime, uPower, uDread;
    uniform vec3 uLamp;
    uniform vec3 uDiyas[8];
    varying vec3 vPos;
    ${noise}

    float band(float y, float centre, float halfHeight) {
      return smoothstep(halfHeight, halfHeight - 0.15, abs(y - centre));
    }

    void main() {
      float turn = atan(vPos.z, vPos.x) / 6.2832; // -0.5..0.5 around the shaft
      float y = vPos.y;
      float deep = clamp(-y / 66.0, 0.0, 1.0);
      vec2 flat2 = vec2(vPos.x * 1.3 + vPos.z * 0.9, y); // seamless stand-in for "along the wall"

      // carvings
      vec2 c = fract(vec2(turn * 48.0, y / 0.52)) - 0.5;
      float star = min(abs(c.x) + abs(c.y), max(abs(c.x), abs(c.y)) * 1.414);
      float jaali = smoothstep(0.34, 0.30, star) - smoothstep(0.2, 0.16, star);
      vec2 s = vec2(turn * 40.0, y / 0.4);
      s.x += mod(floor(s.y), 2.0) * 0.5;
      float scales = smoothstep(0.07, 0.0, abs(length(fract(s) - vec2(0.5, 0.0)) - 0.5));
      float jaaliBand = band(y, -4.0, 0.9) + band(y, -12.0, 0.9) + band(y, -22.0, 0.9) + band(y, -34.0, 0.9);
      float scaleBand = band(y, -46.0, 0.6) + band(y, -54.0, 1.0) + band(y, -60.0, 1.6) + smoothstep(-62.5, -66.0, y);
      float carved = clamp(jaaliBand + scaleBand, 0.0, 1.0);
      float cut = jaali * jaaliBand + scales * scaleBand;

      // bricks (carved bands are smooth slabs)
      vec2 g = vec2(turn * 36.0, y / 0.34);
      g.x += mod(floor(g.y), 2.0) * 0.5;
      vec2 id = floor(g), f = fract(g);
      float face = smoothstep(0.0, 0.05, f.x) * smoothstep(1.0, 0.95, f.x) * smoothstep(0.0, 0.1, f.y) * smoothstep(1.0, 0.9, f.y);
      face = mix(face, 1.0, carved);
      vec3 stone = mix(vec3(0.20, 0.19, 0.16), vec3(0.36, 0.31, 0.24), mix(hash(id), 0.6, carved));
      stone *= 0.45 + 0.55 * face;
      stone *= 1.0 - cut * 0.65;

      float moss = smoothstep(0.52, 0.72, fbm(flat2 * 0.9) + deep * 0.25 - face * 0.08);
      stone = mix(stone, vec3(0.09, 0.15, 0.06), moss * 0.85);
      float wet = smoothstep(0.42, 0.7, fbm(vec2(flat2.x * 1.5, y * 0.3))) * (0.3 + deep * 0.7);
      stone *= 1.0 - wet * 0.45;

      // normal: the wall faces inward, brick edges and carvings tilt it
      vec3 N = -normalize(vec3(vPos.x, 0.0, vPos.z));
      vec3 T = vec3(-N.z, 0.0, N.x);
      float bx = (1.0 - smoothstep(0.0, 0.08, f.x)) - smoothstep(0.92, 1.0, f.x);
      float by = (1.0 - smoothstep(0.0, 0.14, f.y)) - smoothstep(0.86, 1.0, f.y);
      N = normalize(N + (T * bx + vec3(0, 1, 0) * by) * 0.5 * (1.0 - carved) + T * (cut - 0.5) * carved * 0.3);

      vec3 L = uLamp - vPos;
      float d = length(L);
      L /= d;
      float reach = uPower * (exp(-d * d * 0.3) * 1.5 + 0.1 / (1.0 + 0.25 * d * d)); // a pool of light with a long dim tail
      vec3 V = normalize(cameraPosition - vPos);
      float shine = pow(max(dot(reflect(-L, N), V), 0.0), 32.0) * wet * 1.5;
      vec3 lamp = lampColour(uDread);
      vec3 col = stone * lamp * max(dot(N, L), 0.0) * reach * 2.3 + lamp * shine * reach * 2.0;

      for (int i = 0; i < 8; i++) {
        vec3 toDiya = uDiyas[i] - vPos;
        float dd = length(toDiya);
        float flame = 0.9 + 0.1 * sin(uTime * 9.0 + float(i) * 3.0);
        col += stone * vec3(1.0, 0.5, 0.18) * max(dot(N, toDiya / dd), 0.2) * flame * 1.2 / (1.0 + dd * dd * 2.5);
      }

      col += stone * vec3(0.22, 0.30, 0.50) * exp(min(y, 0.0) * 0.4); // moonlight from the mouth
      col *= exp(-distance(cameraPosition, vPos) * 0.06); // the dark swallows what is far away
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`,
};

// Black water. It only shows itself as the lamp's reflection, and as two eyes when you look too long.
export const waterShader = {
  uniforms: { ...shared() },
  vertexShader: worldPosition,
  fragmentShader: /* glsl */ `
    uniform float uTime, uPower, uDread;
    uniform vec3 uLamp;
    varying vec3 vPos;
    ${noise}

    float height(vec2 p) {
      return sin(length(p) * 7.0 - uTime * 1.5) * 0.012 + noise(p * 2.5 + uTime * 0.12) * 0.05;
    }

    void main() {
      vec2 p = vPos.xz;
      vec2 e = vec2(0.03, 0.0);
      vec3 N = normalize(vec3(height(p - e.xy) - height(p + e.xy), 0.12, height(p - e.yx) - height(p + e.yx)));
      vec3 L = uLamp - vPos;
      float d = length(L);
      L /= d;
      vec3 V = normalize(cameraPosition - vPos);
      float glint = pow(max(dot(reflect(-L, N), V), 0.0), 90.0) * uPower * 6.0 / (1.0 + d * 0.3);
      vec3 col = vec3(0.001, 0.003, 0.002) + lampColour(uDread) * glint;

      // Priyadarshan, waiting. Two slit eyes that brighten with dread.
      vec2 q = vec2(abs(p.x) - 0.55, p.y * 0.55);
      float eye = smoothstep(0.34, 0.2, length(q)) * smoothstep(0.02, 0.07, abs(q.x));
      col += vec3(0.9, 0.55, 0.08) * eye * uDread * uDread * 0.5;
      col *= exp(-distance(cameraPosition, vPos) * 0.06); // invisible from the rim

      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`,
};

export const moteShader = {
  uniforms: { ...shared() },
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform vec3 uLamp;
    varying float vGlow;
    void main() {
      vec3 p = position;
      p.x += sin(uTime * 0.2 + position.y * 3.0) * 0.2;
      p.y += sin(uTime * 0.15 + position.x * 5.0) * 0.2;
      vec4 mv = viewMatrix * vec4(p, 1.0);
      vGlow = smoothstep(7.0, 0.5, distance(p, uLamp));
      gl_PointSize = 14.0 / -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform float uPower, uDread;
    varying float vGlow;
    void main() {
      float dot_ = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
      gl_FragColor = vec4(mix(vec3(1.0, 0.7, 0.4), vec3(0.6, 1.0, 0.5), uDread), dot_ * vGlow * uPower * 0.5);
    }`,
};

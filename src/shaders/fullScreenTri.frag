precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;

#define S(a,b,t) smoothstep(a,b,t)

struct ray {
    vec3 o, d;
};

ray CameraSetup(vec2 uv, vec3 camPos, vec3 lookat, float zoom) {
    ray a;
    a.o = camPos;

    vec3 f = normalize(lookat - camPos);
    vec3 r = cross(vec3(0.0, 1.0, 0.0), f);
    vec3 u = cross(f, r);
    vec3 c = a.o + f * zoom;
    vec3 i = c + uv.x * r + uv.y * u;

    a.d = normalize(i - a.o);

    return a;
}

vec3 ClosestPoint(ray r, vec3 p) {
    return r.o + max(0.0, dot(p - r.o, r.d)) * r.d;
}

float DistRay(ray r, vec3 p) {
    return length(p - ClosestPoint(r, p));
}

float Bokeh(ray r, vec3 p, float size, float blur) {
    float d = DistRay(r, p);

    size *= length(p);
    float c = S(size, size*(1.0 - blur), d);
    c *= mix(0.6, 1.0, S(size*0.8, size, d));
    return c;
}

vec3 Streetlights(ray r, float t) {
    float side = step(r.d.x, 0.0);
    r.d.x = abs(r.d.x);
    float s = 1.0/10.0; // 0.1
    float m = 0.0;

    for(float i = 0.0; i < 1.0; i+=0.1) {
        float ti = fract(t + i + side * s * 0.5);
        vec3 p = vec3(2.0, 2.0, 100.0 - ti * 100.0);
        m += Bokeh(r, p, 0.05, 0.1) * ti * ti * ti;
    }

    return vec3(1.0, 0.7, 0.3) * m;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv -= 0.5;
    uv.x *= uResolution.x/uResolution.y;
    
    vec3 camPos = vec3(0.0, 0.2, 0.0);
    vec3 lookat = vec3(0.0, 0.2, 1.0);

    ray r = CameraSetup(uv, camPos, lookat, 2.0);

    float t = uTime * 0.2;

    vec3 col = Streetlights(r, t);
    gl_FragColor = vec4(col, 1.0);
} 
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .01

float GetDist(vec3 p) {
    // sphere
    vec4 s = vec4(0.0, 1.0, 6.0, 1.0);

    float sphereDist = length(p - s.xyz) - s.w;
    float planeDist = p.y;

    float d = min(sphereDist, planeDist);
    return d;
}

float RayMarch(vec3 ro, vec3 rd) {
    // distance that we've marched from the origin
    float dO = 0.0;

    for(int i = 0; i < MAX_STEPS; i++) {
        // p = current marching location
        vec3 p = ro + rd * dO;
        // distance to scene
        float dS = GetDist(p);
        dO += dS;

        // test for exit conditions
        if(dO > MAX_DIST || dS < SURF_DIST) break;
    }

    return dO;
}

vec3 GetNormal(vec3 p) {
    float d = GetDist(p);

    // evaluate distance to surface at points around p as well
    vec2 e = vec2(0.01, 0.0);

    vec3 n = d - vec3(
        GetDist(p-e.xyy),
        GetDist(p-e.yxy),
        GetDist(p-e.yyx)
    );

    return normalize(n);
}

float GetLight(vec3 p) {
    vec3 lightPos = vec3(0.0, 5.0, 6.0);
    // move light around
    lightPos.xz += vec2(sin(uTime), cos(uTime));
    // light vector
    vec3 l = normalize(lightPos - p);
    // normal
    vec3 n = GetNormal(p);

    float dif = clamp(dot(n, l), 0.0, 1.0);

    // calculate shadow
    float d = RayMarch(p + n * SURF_DIST * 2.0, l);
    if(d < length(lightPos - p)) dif *= 0.1;
    return dif;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv -= 0.5;
    uv.x *= uResolution.x/uResolution.y;
    vec3 col = vec3(0.0);

    // camera position - ray origin
    vec3 ro = vec3(0.0, 1.0, 0.0);
    // ray direction
    vec3 rd = normalize(vec3(uv.x, uv.y, 1.0));

    float d = RayMarch(ro, rd);
    vec3 p = ro + rd * d;
    // diffuse lighting
    float dif = GetLight(p);
    col = vec3(dif);

	gl_FragColor = vec4(col, 1.0);
} 
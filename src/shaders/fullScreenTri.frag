precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;

#define S(a, b, t) smoothstep(a, b, t)
#define sat(x) clamp(x, 0.0, 1.0);

float remap01(float a, float b, float t) {
    return sat((t-a)/(b-a));
}

float remap(float a, float b, float c, float d, float t) {
    return sat(((t-a)/(b-a)) * (d-c) + c);
}

vec2 within(vec2 uv, vec4 rect) {
    return (uv-rect.xy)/(rect.zw-rect.xy);
}

vec4 Eye(vec2 uv) {
    vec4 col = vec4(0.0);

    return col;
}

vec4 Mouth(vec2 uv) {
    vec4 col = vec4(0.0);

    return col;
}

vec4 Head(vec2 uv) {
    vec4 col = vec4(.9, .65, .1, 1.);

    float d = length(uv);

    col.a = S(.5, .49, d);

    float edgeShade = remap01(0.35, 0.5, d);
    edgeShade *= edgeShade;
    col.rgb *= 1.0 - edgeShade * 0.5;

    col.rgb = mix(col.rgb, vec3(.6,.3,.1), S(0.47, 0.48, d));

    float highlight = S(.4, .39, d);
    highlight *= remap(.4, -0.1, .75, 0.0, uv.y);
    col.rgb = mix(col.rgb, vec3(1.0), highlight);

    d = length(uv - vec2(0.25, -0.2));
    float cheek = S(0.2, 0.01, d) * .4;
    cheek *= S(0.18, 0.16, d);
    col.rgb = mix(col.rgb, vec3(1.0, 0.1, 0.1), cheek);

    return col;
}

vec4 Smiley(vec2 uv) {
    vec4 col = vec4(0.0);

    uv.x = abs(uv.x);
    vec4 head = Head(uv);
    vec4 eye = Eye(uv);

    col = mix(col, head, head.a);
    col = mix(col, eye, eye.a);

    return col;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv -= 0.5;
    uv.x *= uResolution.x/uResolution.y;
    
	gl_FragColor = Smiley(uv);
}
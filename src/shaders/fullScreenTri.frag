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
    uv -= 0.5;
    vec4 irisCol = vec4(0.3, 0.5, 1.0, 1.0);
    vec4 col = vec4(1.0);
    float d = length(uv);

    col = mix(col, irisCol, S(0.1, 0.9, d));

    col.rgb *= 1.0 - S(0.44, 0.5, d) * 0.5 * sat(-uv.y-uv.x);

    col.rgb = mix(col.rgb, vec3(0.0), S(0.3, 0.28, d));

    irisCol.rgb *= 1.0 + S(0.3, 0.01, d);
    col.rgb = mix(col.rgb, irisCol.rgb, S(0.28, 0.26, d));

    col.rgb = mix(col.rgb, vec3(0.0), S(0.15, 0.13, d));

    float highlight = S(0.12, 0.07, length(uv - vec2(-0.1, 0.1))) * 0.8;
    highlight += S(0.07, 0.02, length(uv - vec2(0.1, -0.1)))* 0.8;

    col.rgb = mix(col.rgb, vec3(1.0), highlight);

    col.a = S(0.5, 0.49, d);
    return col;
}

vec4 Mouth(vec2 uv) {
    // uv -= 0.5;
    vec4 col = vec4(0.5, 0.18, 0.05, 1.0);


    col.a = S(1.0, 0.9, uv.x) * S(1.0, 0.9, uv.y);

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
    vec4 eye = Eye(within(uv, vec4(0.03, -0.1, 0.37, 0.25)));
    vec4 mouth = Mouth(within(uv, vec4(-0.3, -0.4, 0.3, -0.1)));

    col = mix(col, head, head.a);
    col = mix(col, eye, eye.a);
    col = mix(col, mouth, mouth.a);

    return col;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv -= 0.5;
    uv.x *= uResolution.x/uResolution.y;
    
	gl_FragColor = Smiley(uv);
} 
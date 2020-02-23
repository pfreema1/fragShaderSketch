precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;

float lineSegment(vec2 p, vec2 a, vec2 b) {
    float thickness = 1.0/100.0;

    vec2 pa = p - a;
    vec2 ba = b - a;

    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    // ????????
    float idk = length(pa - ba*h);

    return smoothstep(0.0, thickness, idk);
}

float DistLine(vec3 ro, vec3 rd, vec3 p) {
    return length(cross(p-ro, rd))/length(rd);
}

float DrawPoint(vec3 ro, vec3 rd, vec3 p) {
    float d = DistLine(ro, rd, p);
    d = smoothstep(.06, .05, d);
    return d;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv -= 0.5;
    uv.x *= uResolution.x/uResolution.y;

    vec3 ro = vec3(0.0, 0.0, -2.0); // ray origin (camera position)
    vec3 lookat = vec3(0.5);
    float zoom = 1.0;

    // camera vectors
    vec3 f = normalize(lookat-ro);
    vec3 r = cross(vec3(0.0, 1.0, 0.0), f);
    vec3 u = cross(f, r);

    // center point on screen
    vec3 c = ro + f * zoom;
    // intersection point with screen
    vec3 i = c + uv.x * r + uv.y * u;
    // ray direction
    vec3 rd = i - ro;

    float d = 0.0;

    d += DrawPoint(ro, rd, vec3(0., 0., 0.));
    d += DrawPoint(ro, rd, vec3(0., 0., 1.));
    d += DrawPoint(ro, rd, vec3(0., 1., 0.));
    d += DrawPoint(ro, rd, vec3(0., 1., 1.));
    d += DrawPoint(ro, rd, vec3(1., 0., 0.));
    d += DrawPoint(ro, rd, vec3(1., 0., 1.));
    d += DrawPoint(ro, rd, vec3(1., 1., 0.));
    d += DrawPoint(ro, rd, vec3(1., 1., 1.));
    

	gl_FragColor = vec4(d);
} 
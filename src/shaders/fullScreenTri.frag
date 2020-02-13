precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;

float DistLine(vec3 ro, vec3 rd, vec3 p) {
    return length(cross(p-ro, rd))/length(rd);
}

float DrawPoint(vec3 ro, vec3 rd, vec3 p) {
    float d = DistLine(ro, rd, p);
    d = smoothstep(0.06, 0.05, d);
    return d;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv -= 0.5;
    uv.x *= uResolution.x/uResolution.y;
    float t = uTime * 4.0;

    vec3 ro = vec3(3.0 * sin(t), 0.0, -3.0 * cos(t)); // ray origin (camera position)

    float zoom = 1.0;
    vec3 lookat = vec3(0.5);
    vec3 f = normalize(lookat - ro);
    vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
    vec3 u = cross(f, r);

    vec3 c = ro + f * zoom;
    vec3 i = c + uv.x * r + uv.y * u;

    vec3 rd = i - ro; 
    
        
    float d = 0.0;
    d += DrawPoint(ro, rd, vec3(0.0, 0.0, 0.0));
    d += DrawPoint(ro, rd, vec3(0.0, 0.0, 1.0));
    d += DrawPoint(ro, rd, vec3(0.0, 1.0, 0.0));
    d += DrawPoint(ro, rd, vec3(0.0, 1.0, 1.0));
    d += DrawPoint(ro, rd, vec3(1.0, 0.0, 0.0));
    d += DrawPoint(ro, rd, vec3(1.0, 0.0, 1.0));
    d += DrawPoint(ro, rd, vec3(1.0, 1.0, 0.0));
    d += DrawPoint(ro, rd, vec3(1.0, 1.0, 1.0));

	gl_FragColor = vec4(d);
} 
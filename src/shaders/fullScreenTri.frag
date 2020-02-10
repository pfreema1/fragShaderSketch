precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;

float DistLine(vec3 ro, vec3 rd, vec3 p) {
    return length(cross(p-ro, rd))/length(rd);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    uv -= 0.5;
    uv.x *= uResolution.x/uResolution.y;

    vec3 ro = vec3(0.0, 0.0, -2.0); // ray origin (camera position)
    vec3 rd = vec3(uv.x, uv.y, 0.0) - ro; 
    
    float time = uTime * 4.0;
    vec3 p = vec3(sin(time), 0.0, 3.0 + cos(time));
    float d = DistLine(ro, rd, p);

    d = smoothstep(0.1, 0.09, d);

	gl_FragColor = vec4(d);
} 
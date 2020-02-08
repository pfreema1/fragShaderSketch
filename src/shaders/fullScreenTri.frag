precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;

#define PI 3.14
#define TWO_PI 6.28

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float circle(vec2 uv, float radius, float width)
{
    return smoothstep(width, width * 0.5, abs(radius - length(uv)));
}

float circularSector(vec2 uv, float radius, float width, float cutAngle)
{
    float angle = atan(uv.y, uv.x) + PI;
    float circ = circle(uv, radius, width);
    
    float cutBasis = abs(angle - cutAngle);
    float cutVal = smoothstep(cutAngle, cutAngle - 0.2, cutBasis);
    return circ * cutVal;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 st = uv;
    st = st * 2.0 - 1.0;
    
    vec3 color = vec3(0.0);
    float c = 0.0;
    
    
    for(int i = 0; i < 50; i++) {
    	c += circularSector(st, 0.05 * float(i), 0.02, mod(PI * 0.1 * float(i), PI));    
    }
    
    color = mix(color, vec3(1.0), c);
    
	gl_FragColor = vec4(color,1.0);
}
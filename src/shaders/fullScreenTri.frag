precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float mod1;
uniform float mod2;
uniform float mod3;
uniform float mod4;
uniform float mod5;
uniform float mod6;
uniform float mod7;
uniform float mod8;
uniform float mod9;

/*
    used this as starter:  https://www.shadertoy.com/view/3ljSzw
*/

// #define AA 0.005
#define PI 3.14159
#define TAU 2.0 * PI
#define gridThickness 0.05



float remap(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float map(in vec3 pos) {
    float d = length(pos) - 0.25;

    return d;
}

vec3 calcNormal(in vec3 pos) {
    vec2 e = vec2(0.0001, 0.0);
    return normalize( vec3(map(pos+e.xyy) - map(pos-e.xyy),
    map(pos+e.yxy) - map(pos-e.yxy),
    map(pos+e.yyx) - map(pos-e.yyx)) );
}

// void mainImage( out vec4 fragColor, in vec2 fragCoord )
void main()
{
    // vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec2 p = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
    float time = iTime;

    vec3 ro = vec3(0.0, 0.0, 1.0);  // camera pos
    vec3 rd = normalize(vec3(p, -1.5));

    vec3 col = vec3(0.0);

    float t = 0.0;
    for(int i = 0; i < 100; i++) {
        vec3 pos = ro + t*rd;

        float h = map(pos);
        if(h < 0.001) {
            break;
        }
        t += h;
        if(t > 20.0) break; // far clip 

    }

    if(t < 20.0) {
        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal(pos);
        vec3 sun_dir = normalize(vec3(0.8, 0.4, 0.2));
        float sun_dif = clamp( dot(nor, sun_dir), 0.0, 1.0);
        float sky_dif = clamp( dot(nor, vec3(0.0, 1.0, 0.0)), 0.0, 1.0);


        col = vec3(1.0, 0.7, 0.5) * sun_dif;
        col += vec3(0.0, 0.2, 0.4) * sky_dif;
    }

	// fragColor = vec4(col,1.0);
    gl_FragColor = vec4(col, 1.0);
}

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
uniform float camX;
uniform float camY;
uniform float camZ;

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

float sdElipsoid(in vec3 pos, vec3 rad) {
    float k0 = length(pos/rad);
    float k1 = length(pos/rad/rad);
    return k0 * (k0 - 1.0) / k1;

}

float smin(in float a, in float b, float k) {
    float h = max( k - abs(a - b), 0.0 );
    return min(a,b) - h*h/(k*4.0);
}

float opSmoothUnion( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); }

float opSmoothSubtraction( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h); }

    float opUnion( float d1, float d2 )
{
    return min(d1,d2);
}

float opSubtraction( float d1, float d2 )
{
    return max(-d1,d2);
}

float opIntersection( float d1, float d2 )
{
    return max(d1,d2);
}

float sdVerticalCapsule( vec3 p, float h, float r )
{
  p.y -= clamp( p.y, 0.0, h );
  return length( p ) - r;
}

float sdSphere( in vec3 p, in float r )
{
    return length(p)-r;
}


float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)) - r;
}

/*************************************************************
***********************************************************
***********************************************************/

float sdJellyFish( in vec3 p ) {
    float t = fract(iTime);
    float an = sin(iTime);
    // float y = 4.0 * t * (1.0 - t);
    vec3 cen = vec3(0.0, 0.5, 0.0);
    vec3 rad = vec3(0.25, 0.25, 0.25);
    float d = 1e10;
    float d1 = 0.0;
    float d2 = 0.0;
    float dt = 0.0;
    float time = iTime * 2.0;
    float loopTime = 0.0;
    float modTime = 0.0;
    float smoothVal = 0.0;
    vec3 modP = vec3(0.0);


    // small (subtractor)
    d1 = sdSphere(p - vec3(0.0,2.0,0.0) - vec3(0.0, 0.0, 0.13 * 3.0), 0.55 );
    // big (visible)
    d2 = sdSphere(p - vec3(0.0,2.0,0.0) - vec3(0.0, 0.0, 0.0), 1.0 ); 
    smoothVal = remap(sin(time), -1.0, 1.0, 1.0, 0.39);
    dt = opSmoothSubtraction(d1,d2, smoothVal);
    d = min(d, dt);

    // tube
    modP = vec3(p);
    float m = sin(time + modP.y);
    modP.x += m;
    d1 = sdVerticalCapsule(modP - vec3(-0.22, 1.0, 1.0), 5.0, 0.07);
    d = min (d, d1);

    return d; 
}

float map(in vec3 pos) {
    float d1 = sdJellyFish(pos);

    float d2 = pos.y - (-0.55);

    return min(d1, d2);
}

vec3 calcNormal(in vec3 pos) {
    vec2 e = vec2(0.0001, 0.0);
    return normalize( vec3(map(pos+e.xyy) - map(pos-e.xyy),
    map(pos+e.yxy) - map(pos-e.yxy),
    map(pos+e.yyx) - map(pos-e.yyx)) );
}

float castRay(in vec3 ro, vec3 rd) {
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
    if(t > 20.0) t = -1.0;

    return t;
}

// void mainImage( out vec4 fragColor, in vec2 fragCoord )
void main()
{
    // vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec2 p = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
    float time = iTime;
    float an = iTime;
    
    vec3 ro = vec3(camX, camY, camZ);  // camera pos
    vec3 ta = vec3(0.0, 0.8, 0.2);

    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize( cross(ww, vec3(0.0, 1.0, 0.0)) );
    vec3 vv = normalize( cross(uu, ww) );

    vec3 rd = normalize( p.x*uu + p.y*vv + 1.5*ww );

    // sky color
    vec3 col = vec3(0.4, 0.75, 1.0) - 0.7*rd.y;
    col = mix( col, vec3(0.7, 0.75, 0.8), exp(-10.0*rd.y) );
    

    float t = castRay(ro, rd);
    if(t > 0.0) {
        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal(pos);

        vec3 mate = vec3(0.18);

        vec3 sun_dir = normalize(vec3(0.8, 0.4, 0.2));
        float sun_dif = clamp( dot(nor, sun_dir), 0.0, 1.0);
        float sun_sha = step( castRay(pos + nor*0.001, sun_dir), 0.0 );
        float sky_dif = clamp( 0.5 + 0.5*dot(nor, vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
        float bou_dif = clamp( 0.5 + 0.5*dot(nor, vec3(0.0, -1.0, 0.0)), 0.0, 1.0);

        // sun diffuse
        col = mate * vec3(7.0, 4.5, 3.0) * sun_dif * sun_sha;
        // sky diffuse
        col += mate * vec3(0.5, 0.8, 0.9) * sky_dif;
        // light bounce diffuse
        col += mate * vec3(0.7, 0.3, 0.2) * bou_dif;


    }

    // gamma correction
    col = pow( col, vec3(0.4545) );

	// fragColor = vec4(col,1.0);
    gl_FragColor = vec4(col, 1.0);
}

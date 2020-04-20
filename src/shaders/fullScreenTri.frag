precision highp float;
uniform vec2 iResolution;
uniform float iTime;

#define AA 0.005
#define S(a, b, t) smoothstep(a, b, t)
#define B(a, b, blur, t) S(a-blur, a+blur, t)*S(b+blur, b-blur, t)
#define sat(x) clamp(x, 0., 1.)
#define PI 3.14159
#define TAU 2.0 * PI
#define gridThickness 0.01

vec3 headColor = vec3(0.45,0.21,0.67);
vec3 bgColor = vec3(0.55,0.82,0.87);
vec3 headGooColor = vec3(0.87,0.56,0.40);
vec3 blackOutlineColor = vec3(0.14,0.09,0.14);
vec3 gearCol1 = vec3(0.44,0.48,0.80);
vec3 gearCol2 = vec3(0.36,0.83,0.99);
vec3 col = bgColor;
float blackOutlineWidth = 0.02;
vec3 mixedCol = vec3(0.0);

/*********************************************************
**********************************************************
**********************************************************
**********************************************************/

float remap01(float a, float b, float t) {
	return sat((t-a)/(b-a));
}

float remap(float a, float b, float c, float d, float t) {
	return sat((t-a)/(b-a)) * (d-c) + c;
}

vec2 within(vec2 uv, vec4 rect) {
    vec2 val = (uv-rect.xy)/(rect.zw-rect.xy);
    // val.y = remap(val.y, 0.0, 1.0, 1.0, 0.0);
    val.y = -val.y + 1.0;
	return val;
}

float inside01(vec2 p) {
    return step(0.0, p.x) * (1.0 - step(1.0, p.x)) * step(0.0, p.y) * (1.0 - step(1.0, p.y));
}

void addGrid(vec2 p, inout vec3 col) {
    float all = inside01(p);
    vec3 gridOutlineCol = vec3(1.0, 0.0, 0.0);
    vec3 gridCol = vec3(0.0);

    // add outline
    float outline = step(p.x, gridThickness);
    outline += step(1.0 - gridThickness, p.x);
    outline += step(p.y, gridThickness);
    outline += step(1.0 - gridThickness, p.y);

    // p.y = -p.y;
    // p.y += 1.0;

    // float outline = step(0.0, p.y) * (1.0 - step(0.1, p.y));

    col = mix(col, gridOutlineCol, outline * all);
}

/*********************************************************
**********************************************************
**********************************************************
**********************************************************/

float sdCircle( in vec2 p, in float r ) 
{
    return length(p)-r;
}

float sdBox( in vec2 p, in vec2 b, float r)
{
    vec2 d = abs(p) - (b - r);
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0) - r;
}


float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}



float opSmoothUnion( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); }

float opSmoothSubtraction( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h); }

/*********************************************************
**********************************************************
**********************************************************
**********************************************************/
void eye(in vec2 p, inout vec3 col) { 
    // bottom outline
    float r = 0.4;
  	float d = sdSegment(p, vec2(0.5, 0.5), vec2(0.5, 0.6)) - r;
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);

    // bottom gear
    d = sdCircle(p - vec2(0.5, 0.51), 0.39);
    d = smoothstep(0.0, AA, d);
    mixedCol = mix(gearCol1, gearCol2, 1.0 - p.x);
    col = mix(col, mixedCol, 1.0 - d);

    // add lines
    // only where bottom gear is showing
    float lines = step(0.079, mod((p.x + iTime * 0.03) * 2.0, 0.1));
    col = mix(col, vec3(0.0), lines * (1.0 - d));


    r = 0.4;
    d = sdSegment(p, vec2(0.5, 0.58), vec2(0.5, 0.62)) - r;
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);

    r = 0.39;
    d = sdSegment(p, vec2(0.5, 0.59), vec2(0.5, 0.61)) - r;
    d = smoothstep(0.0, AA, d);
    mixedCol = mix(vec3(0.55,0.23,0.65), vec3(0.92,0.54,0.37), p.y);
    col = mix(col, mixedCol, 1.0 - d); 

    addGrid(p, col);
}

void oldEye(in vec2 p, inout vec3 col) {
    
    // bottom outline
  	float d = sdSegment(p, vec2(0.3, -0.3), vec2(0.3, -0.245)) - 0.2;
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);
    
    // bottom gear
    d = sdCircle(p - vec2(0.3, -0.3), 0.19);
    d = smoothstep(0.0, AA, d);
    mixedCol = mix(gearCol1, gearCol2, 1.0 - p.x);
    col = mix(col, mixedCol, 1.0 - d);
    
    // add lines
    // only where bottom gear is showing
    float lines = step(0.079, mod((p.x + iTime * 0.03) * 2.0, 0.1));
    col = mix(col, vec3(0.0), lines * (1.0 - d));
    
    
    d = sdCircle(p - vec2(0.3, -0.26), 0.199);
    //d += sdCircle(p - vec2(0.3, -0.27), 0.18);
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);
    
    // bottom layer
    d = sdCircle(p - vec2(0.3, -0.25), 0.195);
    d = smoothstep(0.0, AA, d);
    mixedCol = mix(vec3(0.55,0.23,0.65), vec3(0.92,0.54,0.37), p.y + 0.5);
    col = mix(col, mixedCol, 1.0 - d); 
    
    
}



void head(in vec2 p, inout vec3 col) {

    // black outline
    vec2 headSegB = vec2(0.5, 0.0);
    vec2 headSegA = vec2(0.5, 0.5);
    float r = 0.5;
	float d = sdSegment(p, headSegA, headSegB) - r;
    d = smoothstep(0.0, AA,d);
    col = mix(blackOutlineColor, bgColor, d);

    // head goo
    d = sdSegment(p, headSegA, headSegB) - r * (1.0 - blackOutlineWidth);
    //d *= sdSegment(p, headSegA, headSegB) - r * 0.5;
    d = smoothstep(0.0, AA, d);
    col = mix(col, headGooColor, 1.0 - d);

    ////////////////////////////////////////////////
    // head black
    // head bg outline color
	r = 0.44;
    float hd = sdSegment(p, headSegA, headSegB) - r;
    
    // bump
    r = 0.03;
    float bumpd = sdSegment(p, vec2(0.85, 0.2), vec2(0.8, 0.2)) - r;
	float added = opSmoothUnion(hd, bumpd, 0.2);
	
    
    // bump
    r = 0.005;
    float sbumpd = sdSegment(p, vec2(0.8,0.7), vec2(0.8,0.7)) - r;
    added = opSmoothUnion(added, sbumpd, 0.3);
    

    // subtract bump
    r = 0.005;
    float bumpd2 = sdSegment(p, vec2(0.72, 0.92), vec2(0.72, 0.92)) - r;
    added = opSmoothSubtraction(bumpd2, added, 0.15);

    // subtract bump
    r = 0.005;
    float bumpd3 = sdSegment(p, vec2(0.92, 0.62), vec2(0.92, 0.62)) - r;
    added = opSmoothSubtraction(bumpd3, added, 0.1);

    added = smoothstep(0.0, AA, added);
    col = mix(col, blackOutlineColor, 1.0 - added);
    
    
    // ////////////////////////////////////////////////
    // head main color

    // head bg outline color
	r = 0.43;
    hd = sdSegment(p, headSegA, headSegB) - r;
    
    // bump
    r = 0.02;
    bumpd = sdSegment(p, vec2(0.85, 0.2), vec2(0.8, 0.2)) - r;
    added = opSmoothUnion(hd, bumpd, 0.2);
	
    
    // bump
    r = 0.004;
    sbumpd = sdSegment(p, vec2(0.8,0.7), vec2(0.8,0.7)) - r;
    added = opSmoothUnion(added, sbumpd, 0.3);
    

    // subtract bump
    r = 0.004;
    bumpd2 = sdSegment(p, vec2(0.72, 0.92), vec2(0.72, 0.92)) - r;
    added = opSmoothSubtraction(bumpd2, added, 0.15);

    // subtract bump
    r = 0.004;
    bumpd3 = sdSegment(p, vec2(0.92, 0.62), vec2(0.92, 0.62)) - r;
    added = opSmoothSubtraction(bumpd3, added, 0.1);

    added = smoothstep(0.0, AA, added);
    col = mix(col, headColor, 1.0 - added);

    // addGrid(p, col);
}



// void mainImage( out vec4 fragColor, in vec2 fragCoord )
void main()
{
    // vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec2 p = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
    

    
    // mirror coords
    p.x = abs(p.x);
    
    head(within(p, vec4(-0.7, 0.6, 0.7, -1.0)), col);
    // oldEye(p, col);

    eye(within(p, vec4(0.1 , -0.25, 0.6, -0.7)), col);
    
    
        

	// fragColor = vec4(col,1.0);
    gl_FragColor = vec4(col, 1.0);
}

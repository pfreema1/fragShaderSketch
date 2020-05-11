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
    -design from: https://dribbble.com/shots/10707556-Another-Dimension
    -sdf functions from iq   
    

*/

// #define AA 0.005
#define PI 3.14159
#define TAU 2.0 * PI
#define gridThickness 0.05

vec3 headColor = vec3(0.45,0.21,0.67);
vec3 bgColor = vec3(0.95,0.92,0.99);
vec3 headGooColor = vec3(0.87,0.56,0.40);
vec3 blackOutlineColor = vec3(0.23,0.24,0.21);
vec3 gearCol1 = vec3(0.44,0.48,0.80);
vec3 gearCol2 = vec3(0.36,0.83,0.99);
vec3 col = bgColor;
float blackOutlineWidth = 0.02;
vec3 mixedCol = vec3(0.0);
float AA = 0.005;

/*********************************************************
**********************************************************
**********************************************************
**********************************************************/

float linearStep(float begin, float end, float t) {
    return clamp((t - begin) / (end - begin), 0.0, 1.0);
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
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

float insideY(vec2 p) {
    return step(0.0, p.y) * (1.0 - step(1.0, p.y));
}

float insideX(vec2 p) {
    return step(0.0, p.x) * (1.0 - step(1.0, p.x));
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

float opSmoothUnion( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); 
}

vec3 returnDottedCol(vec2 p, vec3 bgCol, vec3 dotCol) {
    vec3 dottedCol = vec3(0.0);

    p *= 28.0;
    p.x += 0.48;
    p.y *= 2.49;
    float yIndex = floor(p.y);
    float xIndex = floor(p.x);
    p = fract(p);

    // float circle = smoothstep(mod1, mod2, length(p - vec2(0.5)));
    // circle *= smoothstep(mod3, mod4, length(p - vec2(1.0, 0.0)));

    float circleBool = 0.0;

    float circle = smoothstep(0.3, 0.6, length(p - vec2(0.5)));

    if(mod(xIndex, 2.0) == 0.0 && mod(yIndex, 2.0) == 0.0) {
        circleBool = 0.0;
    } else if(mod(xIndex, 2.0) != 0.0 && mod(yIndex, 2.0) == 0.0) {
        circleBool = 1.0;
    } else if(mod(xIndex, 2.0) == 0.0 && mod(yIndex, 2.0) != 0.0) {
        circleBool = 1.0;
    }

    dottedCol = mix(bgCol, dotCol, (1.0 - circle) * circleBool);

    return dottedCol;
}

float gain(float x, float k) 
{
    float a = 0.5*pow(2.0*((x<0.5)?x:1.0-x), k);
    return (x<0.5)?a:1.0-a;
}

float expImpulse( float x, float k )
{
    float h = k*x;
    return h*exp(1.0-h);
}

float customEase(float x, float k) {
    return pow(x, k);
}

float almostIdentity( float x, float m, float n )
{
    if( x>m ) return x;
    float a = 2.0*n - m;
    float b = 2.0*m - 3.0*n;
    float t = x/m;
    return (a*t + b)*t*t + n;
}

float undulateAngle(int index, float angle, float movementScale, float offsetScale, float timeScale) {
    float offset = float(index) * offsetScale;
    float m = angle + sin(iTime * timeScale + offset) * movementScale;
    return m;
}



/*********************************************************
**********************************************************
**********************************************************
**********************************************************/

float sdCircle( in vec2 p, in float r ) 
{
    return length(p)-r;
}

float sdCross( in vec2 p, in vec2 b, float r ) 
{
    p = abs(p); p = (p.y>p.x) ? p.yx : p.xy;
    vec2  q = p - b;
    float k = max(q.y,q.x);
    vec2  w = (k>0.0) ? q : vec2(b.y-p.x,-k);
    return sign(k)*length(max(w,0.0)) + r;
}



float returnTween4Dist(vec2 p, float t, float circleRadius) {
    // t = normalized time
    vec2 from = vec2(0.5, 0.66);
    vec2 to = vec2(0.5, 0.3);
    float radius = (from.y - to.y) / 2.0;
    float startAngle = (3.0 * PI) / 2.0;
    float endAngle = PI;
    float angle = map(t, 0.0, 1.0, startAngle, endAngle);
    float angleOffset = -PI * 2.0;
    // cycle through angle based on t
    vec2 pos = vec2(sin(angle + angleOffset) * radius, cos(angle + angleOffset) * radius);
    pos += 0.5;
    float d = sdCircle(p - pos, circleRadius);
    return d;
}

float returnTween5Dist(vec2 p, float t, float circleRadius) {
    // t = normalized time
    vec2 from = vec2(0.5, 0.32);
    vec2 to = vec2(0.5, -0.3);
    vec2 pos = mix(from, to, t);
    float d = sdCircle(p - pos, circleRadius);
    return d;
}

float returnTween1Dist(vec2 p, float t, float circleRadius) {
    // t = normalized time
    vec2 from = vec2(0.5, 1.0);
    vec2 to = vec2(0.5, 0.66);
    vec2 pos = mix(from, to, t);
    float d = sdCircle(p - pos, circleRadius);
    return d;
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

void makeSecondSwoop(vec2 p, inout float d, float loopTime, inout vec3 col, float time) {
    p -= vec2(0.28, 0.02);
    // p -= vec2(0.58, 0.02);  // debug view

    for(int i = 0; i < 5; i++) {
        float d1 = 0.0;
        float margin = sin(float(i) + time) * 1.0;
        float modTime = fract((time + margin) / loopTime);
        float circleRadius = map(modTime, 0.0, 1.0, 0.0, 0.15);

        if(modTime < 0.5) {
            d1 = returnTween4Dist(p, linearStep(0.0, 0.5, modTime), circleRadius);
        } else {
            d1 = returnTween5Dist(p, linearStep(0.5, 1.0, modTime), circleRadius);
        }
       
        // d1 = smoothstep(0.0, AA, d1);
        // col = mix(col, vec3(1.0), 1.0 - d1);

        if(i != 0) {
            d = opSmoothUnion(d, d1, 0.04);
        }
    }
}

float returnTween2Dist(vec2 p, float t, float circleRadius) {
    // t = normalized time
    vec2 from = vec2(0.5, 0.66);
    vec2 to = vec2(0.5, 0.33);
    float radius = (from.y - to.y) / 2.0;
    float startAngle = PI / 2.0;
    float endAngle = (3.0 * PI) / 2.0;
    float angle = map(t, 0.0, 1.0, startAngle, endAngle);
    float angleOffset = -PI * 0.5;
    // cycle through angle based on t
    vec2 pos = vec2(sin(angle + angleOffset) * radius, cos(angle + angleOffset) * radius);
    pos += 0.5;
    float d = sdCircle(p - pos, circleRadius);
    return d;
}

float returnTween3Dist(vec2 p, float t, float circleRadius) {
    // t = normalized time
    vec2 from = vec2(0.5, 0.33);
    vec2 to = vec2(0.66, -0.1);
    vec2 pos = mix(from, to, t);
    float d = sdCircle(p - pos, circleRadius);
    return d;
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





float opSmoothSubtraction( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h); 
}

float opSubtraction( float d1, float d2 ) { return max(-d1,d2); }

float sdRoundBox( in vec2 p, in vec2 b, in vec4 r ) 
{
    r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
    
    vec2 q = abs(p)-b+r.x;
    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
}

float sdTriangle( in vec2 p, in vec2 p0, in vec2 p1, in vec2 p2 )
{
    vec2 e0 = p1-p0, e1 = p2-p1, e2 = p0-p2;
    vec2 v0 = p -p0, v1 = p -p1, v2 = p -p2;
    vec2 pq0 = v0 - e0*clamp( dot(v0,e0)/dot(e0,e0), 0.0, 1.0 );
    vec2 pq1 = v1 - e1*clamp( dot(v1,e1)/dot(e1,e1), 0.0, 1.0 );
    vec2 pq2 = v2 - e2*clamp( dot(v2,e2)/dot(e2,e2), 0.0, 1.0 );
    float s = sign( e0.x*e2.y - e0.y*e2.x );
    vec2 d = min(min(vec2(dot(pq0,pq0), s*(v0.x*e0.y-v0.y*e0.x)),
                     vec2(dot(pq1,pq1), s*(v1.x*e1.y-v1.y*e1.x))),
                     vec2(dot(pq2,pq2), s*(v2.x*e2.y-v2.y*e2.x)));
    return -sqrt(d.x)*sign(d.y);
}

float dot2(in vec2 v ) { return dot(v,v); }

// trapezoid / capped cone, specialized for Y alignment
float sdTrapezoid( in vec2 p, in float r1, float r2, float he )
{
    vec2 k1 = vec2(r2,he);
    vec2 k2 = vec2(r2-r1,2.0*he);

	p.x = abs(p.x);
    vec2 ca = vec2(max(0.0,p.x-((p.y<0.0)?r1:r2)), abs(p.y)-he);
    vec2 cb = p - k1 + k2*clamp( dot(k1-p,k2)/dot2(k2), 0.0, 1.0 );
    
    float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
    
    return s*sqrt( min(dot2(ca),dot2(cb)) );
}

float sdArc( in vec2 p, in vec2 sca, in vec2 scb, in float ra, float rb )
{
    p *= mat2(sca.x,sca.y,-sca.y,sca.x);
    p.x = abs(p.x);
    float k = (scb.y*p.x>scb.x*p.y) ? dot(p.xy,scb) : length(p.xy);
    return sqrt( dot(p,p) + ra*ra - 2.0*ra*k ) - rb;
}

float sdBezier( in vec2 pos, in vec2 A, in vec2 B, in vec2 C )
{    
    vec2 a = B - A;
    vec2 b = A - 2.0*B + C;
    vec2 c = a * 2.0;
    vec2 d = A - pos;
    float kk = 1.0/dot(b,b);
    float kx = kk * dot(a,b);
    float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
    float kz = kk * dot(d,a);      
    float res = 0.0;
    float p = ky - kx*kx;
    float p3 = p*p*p;
    float q = kx*(2.0*kx*kx-3.0*ky) + kz;
    float h = q*q + 4.0*p3;
    if( h >= 0.0) 
    { 
        h = sqrt(h);
        vec2 x = (vec2(h,-h)-q)/2.0;
        vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
        float t = clamp( uv.x+uv.y-kx, 0.0, 1.0 );
        res = dot2(d + (c + b*t)*t);
    }
    else
    {
        float z = sqrt(-p);
        float v = acos( q/(p*z*2.0) ) / 3.0;
        float m = cos(v);
        float n = sin(v)*1.732050808;
        vec3  t = clamp(vec3(m+m,-n-m,n-m)*z-kx,0.0,1.0);
        res = min( dot2(d+(c+b*t.x)*t.x),
                   dot2(d+(c+b*t.y)*t.y) );
        // the third root cannot be the closest
        // res = min(res,dot2(d+(c+b*t.z)*t.z));
    }
    return sqrt( res );
}

/*********************************************************
**********************************************************
**********************************************************
**********************************************************/




void bg(vec2 p, inout vec3 col, vec2 origP) {
    // col = mix(col, vec3(0.90,0.76,0.34), map(origP.y, 0.39, 0.74, 0.0, 1.0));

    // col = mix(col, vec3(0.76,0.78,0.53), map(origP.y, -0.09, -0.59, 0.0, 1.0));
}

void cranium(vec2 p, inout vec3 col, vec2 origP) {
    float d = 0.0;
    float d1 = 0.0;
    float d2 = 0.0;
    float d3 = 0.0;
    float r = 0.0;
    vec2 modP = vec2(0.0);
    vec3 mixedCol = vec3(0.0);
    float modTime = 0.0;
    float loopTime = 0.0;
    
    /////////////////
    // blackbottom
    ////////////////
    // cranium circle
    d = sdCircle(origP - vec2(0.0, 0.1), 0.59);
    // mandible box
    d1 = sdBox(origP - vec2(0.0, -0.37), vec2(0.33, 0.33), 0.11);
    d = opSmoothUnion(d, d1, 0.22);
    // cheek indents
    d1 = sdCircle(p - vec2(0.74, -0.5), 0.39);
    d = opSmoothSubtraction(d1, d, 0.15);
    // eye socket protrusions
    d1 = sdRoundBox(p - vec2(0.34, -0.22), vec2(0.22, 0.2), vec4(0.07, 0.11, 0.22, 0.22));
    d = opSmoothUnion(d, d1, 0.04);
    // cheek indents
    d1 = sdCircle(p - vec2(0.41, -0.46), 0.04);
    d = opSmoothSubtraction(d1, d, 0.04);
    // temple indents
    d1 = sdCircle(p - vec2(0.7, -0.17), 0.15);
    d = opSmoothSubtraction(d1, d, 0.02);


    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);
}

// void mainImage( out vec4 fragColor, in vec2 fragCoord )
void main()
{
    // vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec2 p = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
    

    vec2 origP = vec2(p.x, p.y);
    // mirror coords
    p.x = abs(p.x);

    
    bg(p, col, origP);
    cranium(p, col, origP);

	// fragColor = vec4(col,1.0);
    gl_FragColor = vec4(col, 1.0);
}

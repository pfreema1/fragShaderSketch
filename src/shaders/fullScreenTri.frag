precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float mod1;
uniform float mod2;
uniform float mod3;
uniform float mod4;
uniform float mod5;
uniform float mod6;

/*
    This code is ugly and inefficient, just like ur mum.  
*/

#define AA 0.005
#define S(a, b, t) smoothstep(a, b, t)
#define B(a, b, blur, t) S(a-blur, a+blur, t)*S(b+blur, b-blur, t)
#define sat(x) clamp(x, 0., 1.)
#define PI 3.14159
#define TAU 2.0 * PI
#define gridThickness 0.005

vec3 headColor = vec3(0.45,0.21,0.67);
vec3 bgColor = vec3(0.55,0.82,0.87);
vec3 headGooColor = vec3(0.87,0.56,0.40);
vec3 blackOutlineColor = vec3(0.09,0.08,0.16);
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
    return mix( d2, d1, h ) - k*h*(1.0-h); 
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

/*********************************************************
**********************************************************
**********************************************************
**********************************************************/


void eye(in vec2 p, inout vec3 col) { 
    // eye lash black bottom
    float r = 0.06;
  	float d = sdSegment(p, vec2(0.5, 0.5), vec2(0.5, 1.04)) - r;
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);

    // eye lash color
    r = 0.045;
  	d = sdSegment(p, vec2(0.5, 0.5), vec2(0.5, 1.04)) - r;
    d = smoothstep(0.0, AA, d);
    col = mix(col, vec3(0.90,0.76,0.34), 1.0 - d);

    // bottom outline
    r = 0.4;
  	d = sdSegment(p, vec2(0.5, 0.5), vec2(0.5, 0.6)) - r;
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);

    // bottom gear
    d = sdCircle(p - vec2(0.5, 0.51), 0.39);
    d = smoothstep(0.0, AA, d);
    mixedCol = mix(gearCol1, gearCol2, smoothstep(0.67, 0.83, p.x));
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
    mixedCol = mix(vec3(0.55,0.23,0.65), vec3(0.92,0.54,0.37), smoothstep(0.18, 0.92, p.y));
    col = mix(col, mixedCol, 1.0 - d); 
    
    ///////////////////////////////////////////////////////////
    // top gear
    // black bottom of top gear
    r = 0.3;
    d = sdSegment(p, vec2(0.5, 0.59), vec2(0.5, 0.66)) - r;
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d); 

    // top gear
    d = sdCircle(p - vec2(0.5, 0.6), 0.29);
    d = smoothstep(0.0, AA, d);
    mixedCol = mix(vec3(0.40,0.70,0.61), vec3(0.87,0.76,0.37), 1.0 - p.x);
    col = mix(col, mixedCol, 1.0 - d);

    // top gear lines
    lines = step(0.079, mod((p.x - iTime * 0.03) * 2.0, 0.1));
    col = mix(col, vec3(0.0), lines * (1.0 - d));

    //black bottom of top colored gear
    r = 0.3;
    d = sdSegment(p, vec2(0.5, 0.67), vec2(0.5, 0.67)) - r;
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d); 

    r = 0.285;
    d = sdSegment(p, vec2(0.5, 0.67), vec2(0.5, 0.67)) - r;
    d = smoothstep(0.0, AA, d);
    mixedCol = mix(vec3(0.99,0.96,0.86), vec3(0.92,0.81,0.48), p.x);
    col = mix(col, mixedCol, 1.0 - d); 

    // pupil
    r = 0.2;
    d = sdSegment(p, vec2(0.5, 0.67), vec2(0.5, 0.67)) - r;
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d); 

    // iris
    r = 0.05;
    d = sdSegment(p, vec2(0.5, 0.67), vec2(0.5, 0.67)) - r;
    d = smoothstep(0.0, AA, d);
    mixedCol = mix(vec3(0.75,0.76,0.55), vec3(0.48,0.82,0.86), p.x);
    col = mix(col, mixedCol, 1.0 - d); 

    // addGrid(p, col);
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

void mouth(in vec2 p, inout vec3 col) {
    // vec3 mixedCol = vec3(0.0);
    float isInside = inside01(p);

    // light bg
    vec3 mixedCol = mix(vec3(0.94,0.85,0.59), vec3(1.00,0.98,0.91), p.y);
    col = mix(col, mixedCol, isInside);

    // circle black bottom
    float r = 0.37;
    vec2 pMod = vec2(p.x, p.y * 0.5);
    float d = sdCircle(pMod - vec2(0.5, -0.2), r);
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);

    // circle color
    r = 0.36;
    d = sdCircle(pMod - vec2(0.5, -0.21), r);
    d = smoothstep(0.0, AA, d);
    col = mix(col, vec3(0.91,0.54,0.36), 1.0 - d);
    
    /////////////////////////////////////////////////////////////////////
    // OIL
    /////////////////////////////////////////////////////////////////
    // oil pipe
    r = 0.03;
    float baseOilPipe = sdSegment(p, vec2(0.75, 0.9), vec2(0.75, 0.0)) - r;

    // setup oilBulge1 anim
    float yPos = 0.0;
    float loopTime = 3.0;
    float modTime = mod(iTime, loopTime);
    float moveMin = -0.2;
    float moveMax = 0.5;
    modTime = 1.0 - (modTime / loopTime); // normalize looptime to 0 -> 1
    yPos = ((abs(moveMin) + abs(moveMax)) * modTime) + moveMin; // convert 0 -> 1 to new range
    vec2 bulge1Pos = vec2(0.75, yPos);
    // get sd of oilBulge1
    r = 0.05 * isInside;
    pMod = vec2(p.x, p.y * 0.4);
    float oilBulge1 = sdSegment(pMod, bulge1Pos, bulge1Pos) - r;
    d = opSmoothUnion(baseOilPipe, oilBulge1, 0.11);

   // setup oilBulge2 anim
    float timeOffset = 1.0;
    modTime = mod(iTime + timeOffset, loopTime);
    modTime = 1.0 - (modTime / loopTime);
    yPos = ((abs(moveMin) + abs(moveMax)) * modTime) + moveMin; // convert 0 -> 1 to new range
    vec2 bulge2Pos = vec2(0.75, yPos);
    
    // sd of oilbulge2
    r = 0.03 * isInside;
    float oilBulge2 = sdSegment(pMod, bulge2Pos, bulge2Pos) - r;
    d = opSmoothUnion(d, oilBulge2, 0.11);

    // setup oilBulge3 anim
    timeOffset = 2.0;
    modTime = mod(iTime + timeOffset, loopTime);
    modTime = 1.0 - (modTime / loopTime);
    yPos = ((abs(moveMin) + abs(moveMax)) * modTime) + moveMin; // convert 0 -> 1 to new range
    vec2 bulge3Pos = vec2(0.75, yPos);
    
    // sd of oilbulge3
    r = 0.01 * isInside;
    float oilBulge3 = sdSegment(pMod, bulge3Pos, bulge3Pos) - r;
    d = opSmoothUnion(d, oilBulge3, 0.11);

    //////////////////////////////////////////////////////////////
    // middle oil pipe
    r = 0.01;
    float middleOilPipe = sdSegment(p, vec2(0.5, 0.9), vec2(0.5, 0.0)) - r;
    d = opSmoothUnion(d, middleOilPipe, 0.11);

    // middle bulge 1
    loopTime = 3.8;
    modTime = mod(iTime, loopTime);
    modTime = 1.0 - (modTime / loopTime);
    yPos = ((abs(moveMin) + abs(moveMax)) * modTime) + moveMin;
    bulge1Pos = vec2(0.5, yPos);
    r = 0.01 * isInside;
    oilBulge1 = sdSegment(pMod, bulge1Pos, bulge1Pos) - r;
    d = opSmoothUnion(d, oilBulge1, 0.11);

    // middle bulge 2
    timeOffset = 1.3;
    modTime = mod(iTime + timeOffset, loopTime);
    modTime = 1.0 - (modTime / loopTime);
    yPos = ((abs(moveMin) + abs(moveMax)) * modTime) + moveMin; // convert 0 -> 1 to new range
    bulge2Pos = vec2(0.5, yPos);

    // sd of middle oilbulge2
    r = 0.05 * isInside;
    oilBulge2 = sdSegment(pMod, bulge2Pos, bulge2Pos) - r;
    d = opSmoothUnion(d, oilBulge2, 0.11);

    // setup middle oilBulge3 anim
    timeOffset = 2.6;
    modTime = mod(iTime + timeOffset, loopTime);
    modTime = 1.0 - (modTime / loopTime);
    yPos = ((abs(moveMin) + abs(moveMax)) * modTime) + moveMin; // convert 0 -> 1 to new range
    bulge3Pos = vec2(0.5, yPos);
    
    // sd of middle oilbulge3
    r = 0.03 * isInside;
    oilBulge3 = sdSegment(pMod, bulge3Pos, bulge3Pos) - r;
    d = opSmoothUnion(d, oilBulge3, 0.11);

    //////////////////////////////////////////////////////////
    // TOP OIL LINE

    loopTime = 3.0;
    modTime = mod(iTime, loopTime);
    modTime /= loopTime;
    r = 0.04;
    float m = (abs(sin(modTime * TAU)) + 0.2) * 0.3;//remap(sin(modTime * TAU), -1.0, 1.0, 0.13, 0.4);
    float topOilLine = sdSegment(p, vec2(0.0, 0.96), vec2(1.0, 0.96)) - r;
    d = opSmoothUnion(d, topOilLine, m);

    //////////////////////////////////////////////
    // SIDE OIL LINE
    r = 0.015;
    float sideOilLine = sdSegment(p, vec2(1.0, 1.0), vec2(1.0, 0.0)) - r;
    d = opSmoothUnion(d, sideOilLine, 0.11);

    // draw oil
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, (1.0 - d) * isInside);

}

void nose(in vec2 p, inout vec3 col) {
    float isInside = inside01(p);
    float isInsideY = insideY(p);
    float isInsideX = insideX(p);
    vec2 modP = vec2(0.0);
    vec3 mixedCol = vec3(0.0);

    ////////////////////////////////////////////////////////
    // hourglass black bottom - top triangle
    float d2 = sdTriangle(p, vec2(0.48, 0.63), vec2(0.48, 0.85), vec2(1.0, 0.85));
    // hourglass black bottom - bottom triangle
    float d1 = sdTriangle(p, vec2(0.91, 0.39), vec2(0.52, 0.64), vec2(0.0, 0.41));
    float d = opSmoothUnion(d1, d2, 0.14);
    // hourglass black bottom - middle bend
    modP = vec2(p.x, p.y * 2.0);
    float d3 = sdCircle(modP - vec2(0.68, 1.26), 0.04);
    d = opSmoothUnion(d, d3, 0.1);
    // hourglass black bottom - top bend
    d1 = sdCircle(modP - vec2(0.85, 1.64), 0.11);
    d = opSmoothUnion(d, d1, 0.11);
    // draw hourglass black bottom
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);
    //////////////////////////////////////////////////////
    // hourglass colored - top triangle
    d2 = sdTriangle(p, vec2(0.40, 0.63), vec2(0.47, 0.84), vec2(0.91, 0.84));
    // hourglass colored - bottom triangle
    d1 = sdTriangle(p, vec2(0.8645, 0.39), vec2(0.494, 0.64), vec2(0.0, 0.41));
    d = opSmoothUnion(d1, d2, 0.14);
    // hourglass colored - middle bend
    modP = vec2(p.x, p.y * 2.0);
    d3 = sdCircle(modP - vec2(0.65, 1.26), 0.01);
    d = opSmoothUnion(d, d3, 0.16);
    // hourglass colored - top bend
    d1 = sdCircle(modP - vec2(0.85, 1.64), 0.09);
    d = opSmoothUnion(d, d1, 0.11);
    // draw hourglass colored
    d = smoothstep(0.0, AA, d);
    vec3 dottedCol = returnDottedCol(p, vec3(0.89,0.76,0.34), vec3(0.81,0.43,0.12));
    col = mix(col, dottedCol, 1.0 - d);


    ////////////////////////////////////////////////////
    // black bottom
    modP = vec2(p.x, p.y * 3.0);
    float r = 0.5;
    d1 = sdSegment(modP, vec2(0.5, 0.9), vec2(0.5, 0.4)) - r;
    float subtractR = 0.07;
    d2 = sdSegment(p, vec2(0.67, -0.1), vec2(0.5, -0.1)) - subtractR;

    d3 = opSmoothSubtraction(d2, d1, 0.5);

    r = 0.05;
    d = sdSegment(p, vec2(0.93, 0.1), vec2(0.93, 0.02)) - r;
    d = opSmoothUnion(d, d3, 0.01);

    r = 0.005;
    d1 = sdSegment(p, vec2(0.7, -0.01), vec2(1.4, -0.01)) - r;
    float loopTime = 2.0;
    float modTime = mod(iTime, loopTime) / loopTime;
    float smoothVal = (abs(sin(modTime * TAU))) * 0.085;
    d = opSmoothUnion(d, d1, smoothVal * isInsideY);

    // middle bottom pipe
    r = 0.05;
    d2 = sdSegment(p, vec2(0.5, 0.1), vec2(0.5, -0.01)) - r;
    d = opSmoothUnion(d, d2, 0.09);

    // middle bottom pipe connector
    r = 0.005;
    d1 = sdSegment(p, vec2(0.4, -0.01), vec2(0.6, -0.01)) - r;
    loopTime = 2.0;
    modTime = mod(iTime + 0.5, loopTime) / loopTime;
    smoothVal = (abs(sin(modTime * TAU)) + 0.07) * 0.1;
    d = opSmoothUnion(d, d1, smoothVal);

    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);

    ///////////////////////////////////////////////////
    // nose tubes

    r = 0.13;
    vec2 pMod = vec2(p.x * 0.9, p.y * 2.5);
    d = sdSegment(pMod, vec2(0.59, 0.69), vec2(0.59, 0.37)) - r;
    mixedCol = mix(vec3(0.40,0.36,0.67), vec3(0.35,0.84,0.99), smoothstep(0.54, 0.85, p.x));
    d = smoothstep(0.0, AA, d);
    col = mix(col, mixedCol, 1.0 - d);

    // nose tube bottom black
    d = sdCircle(pMod - vec2(0.59, 0.36), 0.13);
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);

    // nose tube middle black ring
    loopTime = 2.0;
    modTime = mod(iTime, loopTime) / loopTime;
    float m = 0.06 * abs(sin(modTime * TAU)) + 0.54;
    d = sdCircle(pMod - vec2(0.59, 0.52), 0.14);
    d2 = sdCircle(pMod - vec2(0.59, m), 0.13);
    d = opSubtraction(d, d2);
    d = smoothstep(0.0, AA, d);
    col = mix(col, blackOutlineColor, 1.0 - d);

    // nose tube bottom color
    d = sdCircle(pMod - vec2(0.59, 0.34), 0.12);
    d = smoothstep(0.0, AA, d);
    mixedCol = mix(vec3(0.58,0.28,0.56), vec3(0.90,0.53,0.37), smoothstep(0.09, 0.18, p.y));
    col = mix(col, mixedCol, 1.0 - d);

    addGrid(p, col);

}

// void mainImage( out vec4 fragColor, in vec2 fragCoord )
void main()
{
    // vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec2 p = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
    

    
    // mirror coords
    p.x = abs(p.x);
    
    head(within(p, vec4(-0.7, 0.6, 0.7, -1.0)), col);
    eye(within(p, vec4(0.1 , -0.25, 0.6, -0.7)), col);
    
    mouth(within(p, vec4(-0.3, -0.75, 0.3, -1.0)), col);

    nose(within(p, vec4(-0.1, -0.2, 0.1, -0.75)), col);        

	// fragColor = vec4(col,1.0);
    gl_FragColor = vec4(col, 1.0);
}

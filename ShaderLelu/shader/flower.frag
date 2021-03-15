precision highp float;

varying vec2 v_pos;
varying vec2 v_tex;

uniform mat4 u_matrix;
uniform mat4 c_matrix;
uniform mat4 p_matrix;
uniform float time;
uniform vec2 resolution;

uniform sampler2D texture;
#define PI 3.14159265
#define MAXIT 180
#define EPSILON 0.05
 
#define minx4(a, b) ((a.w) < (b.w) ? (a) : (b))
#define minx2(a, b) ((a.x) < (b.x) ? (a) : (b))

mat3 rotX(float a)
{
    return mat3(
        1., 0., 0.,
        0., cos(a), -sin(a),
        0., sin(a), cos(a)
    );
}
 
mat3 rotY(float a)
{
    return mat3(
        cos(a), 0.0, -sin(a),
        0., 1., 0.,
        sin(a), 0.0, cos(a)
    );
}
 
mat3 rotZ(float a)
{
    return mat3(
        cos(a), -sin(a), 0.,
        sin(a), cos(a), 0.,
        0., 0., 1.
    );
}
 
float t;
 
float sphere(vec3 r, float a)
{
    return length(r) - a;
}
 
float torus(vec3 r, vec2 a)
{
    vec2 p = vec2(length(r.xz) - a.x, r.y);
    return length(p) - a.y;
}
 
float plane(vec3 r, vec3 o, vec3 n) {
    return dot(r - o, n);
}

float cylinder(vec3 r, vec2 a)
{
	vec2 p = abs(vec2(length(r.xz), r.y)) - a;
	
	return min(max(p.x, p.y), 0.0) + length(max(p, 0.));
}
 
float bud(vec3 r, float a)
{
	r.xz += cos((r.y + r.z) * 3.) * 0.2;
	
	r.y += sin(length(r.xzx) * 6.) * 0.2;
	
    return length(r) - a + sin(length(r.xz) * 12.) * 0.4;
}

float stem(vec3 r, vec2 a)
{
	r.xz += cos(r.y) * 0.15 + sin(r.y * 1.5) * 0.3;
	r.xz += cos(r.y * 0.25) * 1.;
	
	vec2 p = abs(vec2(length(r.xz), r.y)) - a;
	
	return min(max(p.x, p.y), 0.0) + length(max(p, 0.));
}

float leaf(vec3 r, vec3 a)
{
	r.xz += sin(length(r.xz + 1.) * 1.5);
	r.y += (r.x + r.z) * 0.5;
	r.x *= 0.9;
	
    vec3 p = abs(r) - a;
	
    return length(max(p, 0.));
}

float box(vec3 r, vec3 a)
{
    vec3 p = (abs(r) - a);
    return length(max(p, 0.));
}
 
float shade(vec3 n, vec3 rd)
{
    return clamp(max(dot(n, -rd), 0.) + 1., 0., 1.);
}
 
vec3 fog(float z, vec3 col, vec3 fogCol)
{
    return mix(fogCol, col, exp(-z));
}
 
float hash(vec2 r) {
    return fract(sin(dot(r, vec2(15.5921, 96.654654))) * 23626.3663);
}

mat3 obj;
 
vec2 map(vec3 r)
{
    float b = 0.05;
    vec3 rr = vec3(0.);
    rr.x = floor(r.x / b) * b;
    rr.y = floor(r.y / b) * b;
    rr.z = floor(r.z / b) * b;
	
    vec3 rb1 = obj * rr;
    
    vec2 b1 = vec2(
        bud(rotX(0.6) * rotZ(-0.1) * rb1, 2.),
        floor(mod((sin(rb1.xyz * 5.) * cos(rb1.yxz * 5.) * 2.), 2.))
    );
	vec2 s1 = vec2(
        stem(rb1 + vec3(0., 7., 1.), vec2(.3, 6.81)),
        floor(mod((sin(rb1.y * 3.1) * 2.), 2.) + 2.)
    );
	
	vec2 l1 = vec2(
        leaf(rb1 + vec3(1.5, 5., 2.2), vec3(1., 0.1, 1.0)),
        floor(mod((sin(rb1.x * rb1.z * 4.1) * 2.), 2.)) + 4.
    );
    
    return minx2(l1, minx2(b1, s1));
}

vec3 matCol(vec2 o)
{
    if (o.y == 0.)
        return normalize(vec3(1., 0., .0));
   
    if (o.y == 1.)
        return normalize(vec3(1.1, 0., .6));
    
    if (o.y == 2.)
        return (vec3(0.4, .5, 0.));
    
    if (o.y == 3.)
        return normalize(vec3(.2, 1., 0.4));
    
    if (o.y == 4.)
        return (vec3(0.8, .5, 0.));
    
    if (o.y == 5.)
        return normalize(vec3(.5, .5, 0.));
   
    return vec3(0.);
}

void main()
{
    t = -time * 0.4;
    
    obj = rotY(t);
    obj *= mat3(2.);
   
    vec2 uv = v_pos * 0.5;
    uv.x *= resolution.x / resolution.y;

    mat3 cam = rotY(-PI) * rotX(0.3);
       
    vec3 ro = vec3(0., 0.5, -3.3);
    vec3 rd = cam * normalize(vec3(uv * 2., -1.));
    vec3 r = ro;
   
    vec3 bcol = normalize(vec3(.8, 2., 0.7)) * (.7 + cos(length(uv.xy) * 1.5) * .6) * 0.8;
    vec4 col = vec4(0.);
    col.rgb = bcol;
   
    float sh = 1.;
   
    for (int i = 0; i < MAXIT; ++i) {
        vec2 d = map(r);
        float z = length(r - ro);
       
        if (d.x < EPSILON) {
            col.rgb = mix(col.rgb, 
				matCol(d), 
				shade(normalize(r), rd));
            col.rgb = fog(z * 0.1, col.rgb, bcol);
            break;
        }
       
        d.x *= 0.7 - 0.1 * hash(uv);
		r += rd * d.x * 0.15;
       
        sh = (float(i) / float(MAXIT));
    }
   
    if (sh < 0.8)
		col.rgb *= exp(-sqrt(sh) * 1.2);
   
    gl_FragColor = vec4(col.rgb, 1.);
}

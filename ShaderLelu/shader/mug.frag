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
#define MAXIT 200
#define EPSILON 0.001
 
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

float mug(vec3 r, float m)
{
	vec2 p = abs(vec2(length(r.xz), r.y)) - vec2(2.);
    float cyl = (min(max(p.x, p.y), 0.0) + length(max(p, 0.)));
    
	p = abs(vec2(length(r.xz), r.y - 1. - 4. * (1. - m)*4.)) - vec2(1.5 - (1.-m)*3., 3.);
    float icyl = (min(max(p.x, p.y), 0.0) + length(max(p, 0.)));
    
    vec3 rr = r;
    rr.x += 1.5;
    p = vec2(length(rr.xy) - 1.5, rr.z);
    float tor = (length(p) - 0.25);
	
	return min(max(-icyl, cyl), max(-icyl, tor)) * m;
}

float torusm(vec3 r, float m)
{
    vec3 rr = r;
    rr.x += 1.5;
    vec2 p = vec2(length(rr.xy) - 1.5, rr.z);
    float tor = (length(p) - 0.25);
	
    return tor * m;
}
 
float plane(vec3 r, vec3 o, vec3 n)
{
    return dot(r - o, n);
}

float cylinder(vec3 r, vec2 a)
{
	vec2 p = abs(vec2(length(r.xz), r.y)) - a;
	
	return min(max(p.x, p.y), 0.0) + length(max(p, 0.));
}

float hash(vec2 r)
{
    return fract(sin(dot(r, vec2(15.5921, 96.654654))) * 23626.3663);
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

mat3 obj;

vec2 map(vec3 r)
{    
    obj = rotY(t) * rotX(sin(t*0.33) * 0.1 - 0.1);
    
    r = obj * r;
    
    float m = (sin(t * 0.5) + 1.) * 0.5;
        
    r.x -= (1.-m) * 1.5;
    
    float d = torusm(r, 1. - m);
    d += mug(r, m);
    
    return vec2(d, 1.);
}

vec3 matCol(vec2 o)
{
    return vec3(1.0, 0.5, 0.);
}

void main()
{
    t = time;
   
    vec2 uv = v_pos * 0.5;
    uv.x *= resolution.x / resolution.y;

    mat3 cam = rotY(-PI) * rotX(0.5);
       
    vec3 ro = vec3(0., 3.0, -5.0);
    vec3 rd = cam * normalize(vec3(uv * 2., -1.));
    vec3 r = ro;
   
    vec3 bcol = vec3(0.0, (1.+uv.y)*0.5, (1.+uv.y*0.5)*0.5)*2. + vec3(0.5);
    vec4 col = vec4(0.);
    col.rgb = bcol;
   
    float sh = 1.;
   
    int ch = 1;
   
    for (int i = 0; i < MAXIT; ++i) {
        vec2 d = map(r);
        float z = length(r - ro);
    
        if (d.x < EPSILON) {
            col.rgb = mix(col.rgb, 
				matCol(d), 
				shade(normalize(r), rd));
            col.rgb = fog(z * 0.05, col.rgb, bcol);
            break;
        }
       
        d.x *= 0.6 - 0.1 * hash(uv);
		r += rd * d.x;
        
        sh = (float(i) / float(MAXIT));
    }
   
    
	col.rgb *= exp(-sh * 1.0);
   
    gl_FragColor = vec4(col.rgb, 1.);
}

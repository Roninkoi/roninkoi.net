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
#define MAXIT 160
#define EPSILON 0.007

#define minx4(a, b) ((a.w) < (b.w) ? (a) : (b))
#define minx2(a, b) ((a.x) < (b.x) ? (a) : (b))

float t;

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

float hash(vec2 r) {
    return fract(sin(dot(r, vec2(15.5921, 96.654654))) * 23626.3663);
}

float box(vec3 r, vec3 a)
{
    float tt = t;
    a.y += sin(t) * 0.1;
    r.x += cos(r.y + t);
    r *= rotY(r.y) * rotX(sin(t * 0.5) * 0.2);
    r += 1.;
    r *= rotZ(r.y * 1.);
    r -= 1.;
    r.z = mod(r.z + 7., 14.) -  7.;
    r.x = mod(r.x + 10., 20.) -  10.;
    vec3 p = (abs(r) - a);

    p += sin(5. * t + p.y * 0.7) * 0.4;

    float eps = 0.5;
    float fy = fract(p.y + t - eps)/3. + fract(p.y + t)/3. + fract(p.y + t + eps)/3.;
    float fx = fract(p.x + t - eps)/3. + fract(p.x + t)/3. + fract(p.x + t + eps)/3.;
    p.z += (fx*0.3+fy*0.6) * 0.8 * p.x - 0.8;
    p.x -= 3.;
    p.x += (fx) * .9 *p.x - 0.1 + 0.8 * p.y * sin(p.x);

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

#define CY sin(sin(t * 2.))*0.5 + cos(t * 1.3)*0.3
#define CX sin(t*2.1) * 0.1 + sin(t*4.53)*0.05
vec2 map(vec3 r)
{
    obj = mat3(0.8) * rotY(CY) * rotX(CX);
    vec3 rb1 = obj * r;

    float s = 15.;
    vec2 b1 = vec2(box(rb1, vec3(1., 4., 1.)), 1.);

    b1.y = 0.;

    return b1;
}

vec3 matCol(vec2 o)
{
    if (o.y == 1. )
    return normalize(vec3(1.0, 0.5, 0.0));

    return normalize(vec3(1.0, 0.5 + o.x * 500., fract(o.x) * 100.));
}

void main()
{
    t = time;

    vec2 uv = v_pos.xy * 0.5;

    mat3 cam = rotY(-PI) * rotX(0.3);

    vec3 ro = vec3(0., 2.0, -10.0);
    vec3 rd = cam * normalize(vec3(uv * 2., -1.));
    vec3 r = ro;

    vec3 bcol = vec3(sin(uv.y*uv.x*16. + t*5.)*0.9,
    cos(uv.x*6. / (uv.y * uv.y) - CY * 50. + uv.y*uv.x),
    cos(uv.y)) * 2. * (uv.y * uv.y * uv.y) + vec3(0.8, 0.3, 0.1);

    vec4 col = vec4(0.);
    col.rgb = bcol;

    float sh = 1.;

    float glow = 0.;

    int ch = 1;

    for (int i = 0; i < MAXIT; ++i) {
        vec2 d = map(r);
        float z = length(r - ro);

        glow += exp(-d.x);

        if (d.x < EPSILON) {
            col.rgb = mix(col.rgb,
            matCol(d),
            shade(normalize(r), rd));
            col.rgb = fog(z * 0.03, col.rgb, bcol);
            break;
        }

        d.x *= 0.8 - 0.2 * hash(uv);
        r += rd * d.x * 0.15;

        sh = (float(i) / float(MAXIT));
    }

    if (sh < 0.5)
    col.rgb *= exp(-sh * 1.8 + 1.0);

    gl_FragColor = vec4(col.rgb, 1.);
}

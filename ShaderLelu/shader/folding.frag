precision highp float;

varying vec2 v_pos;
varying vec2 v_tex;

uniform mat4 u_matrix;
uniform mat4 c_matrix;
uniform mat4 p_matrix;
uniform float time;
uniform vec2 resolution;

uniform sampler2D texture;

#define round(x) (floor(x + 0.5))
#define PI 3.145926

#define N 6

#define NCONST 0

void main()
{
    vec2 uv = v_pos.xy * 0.5;
    uv.x *= resolution.x / resolution.y;
    
    float x = uv.x;
    float y = uv.y;
    
    float a = time + 0.8;
    
    x = cos(a) * uv.x - sin(a) * uv.y; // rotation
    y = sin(a) * uv.x + cos(a) * uv.y;
   
    float axy = atan(x, y); // folding
    float rxy = sqrt(x * x  + y * y) + sin(a*0.23); // bulging
        
    float n = sin(0.05*a) * 3. + 4.;
    
    if (NCONST == 1) n = float(N);
    
    float f = PI / (n * 0.5);
    
    float q = floor(axy / f) * f + 3.;
    
    axy = mod(axy, f) - f * 0.5;
    
    x = rxy * cos(axy);
    y = rxy * sin(axy);
    
    float z = x + (cos(a*2.) * 0.5 + 0.5);
    
    vec3 pos = vec3(uv.x, uv.y, z);
    vec3 norm = normalize(vec3(-cos(a+q), -sin(a+q), -z));
    
    vec3 lightPos = vec3(10.*cos(0.1*a), 10.*sin(0.1*a), -1.);
    vec3 lightDir = normalize(lightPos - pos);

    vec3 col = vec3(1.);
    
    col *= 0.6 + 2.0*max(dot(norm, lightDir), 0.);
    
    col *= round(0.5 + 0.5*sin(20.*x)) * (sin(a)*0.5) + 1.0; // stripes
    
    q += 0.4;
    vec3 cm = vec3(
        sin(q), sin(q + PI / 3.0), sin(q + 2. * (PI / 3.0)) // colors
    );
    cm = normalize(cm);
    cm = cm * 0.5 + vec3(0.5);
    col *= cm;
    col /= exp(z*z);

    gl_FragColor = vec4(col, 1.0);
}

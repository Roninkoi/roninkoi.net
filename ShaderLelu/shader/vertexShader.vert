precision highp float;

attribute vec4 a_pos;

attribute vec4 a_tex;

uniform mat4 u_matrix;
uniform mat4 c_matrix;
uniform mat4 p_matrix;
uniform float time;
uniform vec2 resolution;

varying vec2 v_pos;
varying vec2 v_tex;

void main() {
    gl_Position = vec4(a_pos.xyz, 1.0);

    v_pos = a_pos.xy;
    v_tex = vec2(a_tex.x*a_tex.z, a_tex.y*a_tex.w);
}

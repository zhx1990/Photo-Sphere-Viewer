// this one was copied from https://github.com/pchen66/panolens.js/blob/master/src/shaders/StereographicShader.js

uniform sampler2D panorama;
uniform float resolution;
uniform mat4 transform;
uniform float zoom;
uniform float opacity;

varying vec2 vUv;

const float PI = 3.1415926535897932384626433832795;

void main() {
    vec2 position = -1.0 + 2.0 * vUv;
    position *= vec2( zoom * resolution, zoom * 0.5 );

    float x2y2 = position.x * position.x + position.y * position.y;
    vec3 sphere_pnt = vec3( 2. * position, x2y2 - 1. ) / ( x2y2 + 1. );
    sphere_pnt = vec3( transform * vec4( sphere_pnt, 1.0 ) );

    vec2 sampleUV = vec2(
            1.0 - (atan(sphere_pnt.y, sphere_pnt.x) / PI + 1.0) * 0.5,
            (asin(sphere_pnt.z) / PI + 0.5)
    );

    gl_FragColor = texture2D( panorama, sampleUV );
    gl_FragColor.a *= opacity;
}

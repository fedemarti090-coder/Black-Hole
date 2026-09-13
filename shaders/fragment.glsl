uniform vec2 u_resolution;
uniform vec3 u_cameraPos;
uniform mat4 u_invProjMatrix;
uniform mat4 u_invViewMatrix;
uniform vec3 u_blackHolePos;
uniform float u_radius;
uniform sampler2D u_starMap;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 dirToUV(vec3 dir) {
    float u = 0.5 + atan(dir.z, dir.x) / (2.0 * 3.14159265);
    float v = 0.5 + asin(clamp(dir.y, -1.0, 1.0)) / 3.14159265;
    return vec2(u, v);
}

vec3 getRayDirection(vec2 uv) {
    vec4 ndc = vec4(uv * 2.0 - 1.0, -1.0, 1.0);
    vec4 viewTarget = u_invProjMatrix * ndc;
    vec3 rayDirView = normalize(viewTarget.xyz / viewTarget.w);
    vec3 rayDirWorld = (u_invViewMatrix * vec4(rayDirView, 0.0)).xyz;
    return normalize(rayDirWorld);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    vec3 ro = u_cameraPos;
    vec3 rd = getRayDirection(uv);

    // Dithering per eliminare ogni traccia di banding
    float jitter = random(gl_FragCoord.xy) * 0.08;
    vec3 currentPos = ro + rd * jitter;
    vec3 currentDir = rd;
    
    vec3 diskColorAccum = vec3(0.0);
    bool hitBlackHole = false;

    float diskInner = u_radius * 1.3;
    float diskOuter = u_radius * 6.5;
    
    // Aumentiamo i passaggi a 140 per una precisione fluida e morbida
    for (int i = 0; i < 140; i++) {
        vec3 toCenter = u_blackHolePos - currentPos;
        float distToCenter = length(toCenter);

        // 1. COLLISIONE BUCO NERO
        if (distToCenter < u_radius) {
            hitBlackHole = true;
            break;
        }

        if (distToCenter > 200.0) {
            break;
        }

        // STEP SIZE MOLTO PIÙ PICCOLO SUL DISCO:
        // Evita i salti enormi che creavano i denti sui lati
        float distToSurface = max(0.001, distToCenter - u_radius);
        float stepSize = clamp(distToSurface * 0.05, 0.015, 0.6);

        // 2. DISCO DI ACCRESCIMENTO (Sfumatura Gaussiana continua)
        float heightFromEquator = abs(currentPos.y - u_blackHolePos.y);
        
        // Niente più IF rigidi: usiamo exp() per una sfumatura verticale morbida senza bordi netti
        if (distToCenter > diskInner && distToCenter < diskOuter) {
            float normDist = (distToCenter - diskInner) / (diskOuter - diskInner);
            
            // Sfumatura d'altezza gaussiana (elimina del tutto le dentellature)
            float verticalFade = exp(-pow(heightFromEquator / 0.18, 2.0));
            float radialDensity = exp(-normDist * 2.5) * sin(normDist * 3.14159265);
            float diskDensity = radialDensity * verticalFade;

            // Palette di colori soffici incandescente
            vec3 coreColor = vec3(4.0, 2.6, 1.4);
            vec3 edgeColor = vec3(2.0, 0.4, 0.02);
            vec3 fireColor = mix(coreColor, edgeColor, normDist);
            
            diskColorAccum += fireColor * diskDensity * stepSize * 3.5;
        }

        // 3. DEFLESSIONE GRAVITAZIONALE
        vec3 gravityDir = normalize(toCenter);
        float force = (1.5 * u_radius) / (distToCenter * distToCenter);
        currentDir = normalize(currentDir + gravityDir * force * stepSize);

        currentPos += currentDir * stepSize;
    }

    vec3 finalColor = vec3(0.0);

    if (hitBlackHole) {
        finalColor = diskColorAccum; 
    } else {
        vec2 starUV = dirToUV(currentDir);
        vec3 starColor = texture2D(u_starMap, starUV).rgb * 1.8; 
        finalColor = starColor + diskColorAccum;
    }

    finalColor = finalColor / (finalColor + vec3(0.8));
    finalColor = pow(finalColor, vec3(0.9)); 

    gl_FragColor = vec4(finalColor, 1.0);
}
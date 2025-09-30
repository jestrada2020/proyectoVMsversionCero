// Simulador 3D Simple pero Funcional
let simpleScene, simpleCamera, simpleRenderer, simpleControls;
let simpleVMs = [];
let simpleConnections = [];
let simplePackets = [];
let simpleAnimationId;
let simpleIsRunning = false;

// Variables de estadísticas
let simpleStats = {
    latency: 0.5,
    bandwidth: 1.2,
    packetsPerSecond: 1250,
    efficiency: 95
};

function initSimpleSimulator() {
    console.log('Inicializando simulador simple...');

    const container = document.getElementById('simulator3d');
    if (!container) {
        console.error('Contenedor no encontrado');
        return;
    }

    // Limpiar contenedor
    container.innerHTML = '';

    try {
        // Verificar que Three.js esté disponible
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js no está disponible');
        }

        // Crear escena
        simpleScene = new THREE.Scene();
        simpleScene.background = new THREE.Color(0x1a202c);

        // Crear cámara
        const width = container.clientWidth;
        const height = container.clientHeight;
        simpleCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        simpleCamera.position.set(0, 20, 30);

        // Crear renderer
        simpleRenderer = new THREE.WebGLRenderer({ antialias: true });
        simpleRenderer.setSize(width, height);
        simpleRenderer.shadowMap.enabled = true;
        simpleRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(simpleRenderer.domElement);

        // Crear controles
        simpleControls = new THREE.OrbitControls(simpleCamera, simpleRenderer.domElement);
        simpleControls.enableDamping = true;
        simpleControls.dampingFactor = 0.05;
        simpleControls.minDistance = 10;
        simpleControls.maxDistance = 100;

        // Agregar iluminación
        addSimpleLighting();

        // Crear objetos
        createSimpleObjects();

        // Crear UI
        createSimpleUI();

        // Iniciar animación
        simpleIsRunning = true;
        animateSimple();

        // Iniciar estadísticas
        startSimpleStats();

        console.log('Simulador simple inicializado correctamente');

    } catch (error) {
        console.error('Error al inicializar simulador simple:', error);

        // Mostrar mensaje de error en el contenedor
        container.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100%;
                color: white;
                text-align: center;
                padding: 20px;
                background: #1a202c;
            ">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 20px;"></i>
                <h3 style="margin: 0 0 10px 0;">Error al cargar el simulador 3D</h3>
                <p style="margin: 0; color: #94a3b8;">Three.js no se pudo cargar correctamente</p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">Error: ${error.message}</p>
            </div>
        `;
    }
}

function addSimpleLighting() {
    // Luz ambiental
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    simpleScene.add(ambientLight);

    // Luz direccional
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(20, 20, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    simpleScene.add(directionalLight);
}

function createSimpleObjects() {
    // Crear suelo
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3748, transparent: true, opacity: 0.8 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    simpleScene.add(floor);

    // Grid
    const gridHelper = new THREE.GridHelper(40, 20, 0x4f46e5, 0x4f46e5);
    gridHelper.position.y = -1.9;
    simpleScene.add(gridHelper);

    // Función para crear laptop simple
    function createSimpleLaptop() {
        const laptop = new THREE.Group();

        // Base de la laptop
        const baseGeometry = new THREE.BoxGeometry(5, 0.3, 3.8);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x2d3748,
            shininess: 50
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        base.receiveShadow = true;
        laptop.add(base);

        // Pantalla
        const screenGeometry = new THREE.BoxGeometry(5, 3.5, 0.25);
        const screenMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            shininess: 80
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 2.1, -1.7);
        screen.rotation.x = Math.PI * 0.15;
        screen.castShadow = true;
        screen.receiveShadow = true;
        laptop.add(screen);

        // Pantalla activa (display)
        const displayGeometry = new THREE.BoxGeometry(4.5, 3, 0.08);
        const displayMesh = new THREE.Mesh(displayGeometry);
        displayMesh.position.set(0, 2.1, -1.6);
        displayMesh.rotation.x = Math.PI * 0.15;
        laptop.add(displayMesh);

        laptop.userData.display = displayMesh;
        return laptop;
    }

    // Crear VMs como laptops
    const vmConfigs = [
        { name: "Windows 7", ip: "192.168.1.6", color: 0xff0000, position: [-10, 2, -5] },
        { name: "Ubuntu Desktop", ip: "192.168.1.7", color: 0x00ff00, position: [10, 2, -5] },
        { name: "Ubuntu Server", ip: "192.168.1.8", color: 0x0066ff, position: [0, 2, 8] }
    ];

    vmConfigs.forEach(config => {
        // Crear laptop
        const laptop = createSimpleLaptop();
        laptop.position.set(config.position[0], config.position[1], config.position[2]);

        // Aplicar color a la pantalla
        const displayMaterial = new THREE.MeshPhongMaterial({
            color: config.color,
            emissive: config.color,
            emissiveIntensity: 0.3,
            shininess: 100
        });
        laptop.userData.display.material = displayMaterial;

        laptop.userData = {
            ...laptop.userData,
            name: config.name,
            ip: config.ip
        };

        simpleScene.add(laptop);
        simpleVMs.push(laptop);

        // Crear label
        const label = createSimpleLabel(config.name + '\\n' + config.ip);
        label.position.set(0, 3.5, 0);
        laptop.add(label);
    });

    // Crear switch central
    const switchGeometry = new THREE.CylinderGeometry(2, 2, 1, 8);
    const switchMaterial = new THREE.MeshPhongMaterial({
        color: 0xffaa00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3
    });
    const switchObj = new THREE.Mesh(switchGeometry, switchMaterial);
    switchObj.position.set(0, 0.5, 0);
    switchObj.castShadow = true;
    switchObj.receiveShadow = true;
    simpleScene.add(switchObj);

    // Label para switch
    const switchLabel = createSimpleLabel('Switch Central\\n192.168.1.0/24');
    switchLabel.position.set(0, 2, 0);
    switchObj.add(switchLabel);

    // Crear conexiones
    simpleVMs.forEach(vm => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(vm.position.x, 1, vm.position.z),
            new THREE.Vector3(0, 1, 0)
        ]);

        const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
        const line = new THREE.Line(geometry, material);
        simpleScene.add(line);
        simpleConnections.push(line);
    });
}

function createSimpleLabel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'white';
    context.font = '16px Arial';
    context.textAlign = 'center';

    const lines = text.split('\\n');
    lines.forEach((line, index) => {
        context.fillText(line, canvas.width / 2, 40 + index * 25);
    });

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(4, 2, 1);

    return sprite;
}

function createSimpleUI() {
    const container = document.getElementById('simulator3d');

    // Panel de controles
    const controlsHTML = `
        <div class="simple-controls-panel">
            <h3><i class="fas fa-cogs"></i> Controles</h3>
            <div class="simple-buttons">
                <button class="simple-btn" onclick="toggleSimpleSimulation()">
                    <i class="fas fa-play"></i> <span id="simpleToggleText">Iniciar</span>
                </button>
                <button class="simple-btn" onclick="resetSimpleSimulation()">
                    <i class="fas fa-redo"></i> Reiniciar
                </button>
                <button class="simple-btn" onclick="toggleSimplePackets()">
                    <i class="fas fa-cube"></i> Paquetes
                </button>
            </div>
        </div>
    `;

    // Panel de estadísticas
    const statsHTML = `
        <div class="simple-stats-panel">
            <h3><i class="fas fa-chart-line"></i> Estadísticas en Tiempo Real</h3>
            <div class="simple-stats">
                <div class="simple-stat">
                    <span>Latencia:</span>
                    <span class="simple-value" id="simpleLatency">0.5ms</span>
                </div>
                <div class="simple-stat">
                    <span>Ancho de Banda:</span>
                    <span class="simple-value" id="simpleBandwidth">1.2 Gbps</span>
                </div>
                <div class="simple-stat">
                    <span>Paquetes/s:</span>
                    <span class="simple-value" id="simplePackets">1250</span>
                </div>
                <div class="simple-stat">
                    <span>Eficiencia:</span>
                    <span class="simple-value" id="simpleEfficiency">95%</span>
                </div>
                <div class="simple-efficiency-bar">
                    <div class="simple-efficiency-fill" id="simpleEfficiencyFill" style="width: 95%"></div>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', controlsHTML);
    container.insertAdjacentHTML('beforeend', statsHTML);
}

function animateSimple() {
    if (!simpleIsRunning) return;

    simpleAnimationId = requestAnimationFrame(animateSimple);

    // Actualizar controles
    if (simpleControls) {
        simpleControls.update();
    }

    // Rotación suave de objetos
    const time = Date.now() * 0.001;
    simpleVMs.forEach((vm, index) => {
        vm.rotation.y += 0.005;

        // Efecto de flotación
        vm.position.y = 3 + Math.sin(time + index * 2) * 0.2;
    });

    // Actualizar paquetes
    updateSimplePackets();

    // Renderizar
    if (simpleRenderer && simpleScene && simpleCamera) {
        simpleRenderer.render(simpleScene, simpleCamera);
    }
}

function updateSimplePackets() {
    // Generar paquetes ocasionalmente
    if (Math.random() < 0.02) {
        createSimplePacket();
    }

    // Actualizar paquetes existentes
    simplePackets.forEach((packet, index) => {
        packet.userData.progress += 0.02;

        if (packet.userData.progress >= 1) {
            simpleScene.remove(packet);
            simplePackets.splice(index, 1);
        } else {
            const pos = new THREE.Vector3().lerpVectors(
                packet.userData.start,
                packet.userData.end,
                packet.userData.progress
            );
            pos.y += Math.sin(packet.userData.progress * Math.PI * 4) * 0.5 + 2;
            packet.position.copy(pos);
            packet.rotation.x += 0.1;
            packet.rotation.y += 0.05;
        }
    });
}

function createSimplePacket() {
    if (simpleVMs.length < 2) return;

    const sourceIndex = Math.floor(Math.random() * simpleVMs.length);
    let targetIndex;
    do {
        targetIndex = Math.floor(Math.random() * simpleVMs.length);
    } while (targetIndex === sourceIndex);

    const geometry = new THREE.SphereGeometry(0.3);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x004444,
        emissiveIntensity: 0.5
    });

    const packet = new THREE.Mesh(geometry, material);
    packet.userData = {
        start: simpleVMs[sourceIndex].position.clone(),
        end: simpleVMs[targetIndex].position.clone(),
        progress: 0
    };
    packet.position.copy(packet.userData.start);

    simpleScene.add(packet);
    simplePackets.push(packet);
}

function toggleSimpleSimulation() {
    simpleIsRunning = !simpleIsRunning;
    const button = document.getElementById('simpleToggleText');

    if (simpleIsRunning) {
        button.textContent = 'Pausar';
        animateSimple();
    } else {
        button.textContent = 'Iniciar';
        if (simpleAnimationId) {
            cancelAnimationFrame(simpleAnimationId);
        }
    }
}

function resetSimpleSimulation() {
    // Limpiar paquetes
    simplePackets.forEach(packet => {
        simpleScene.remove(packet);
    });
    simplePackets = [];

    // Resetear estadísticas
    simpleStats = {
        latency: 0.5,
        bandwidth: 1.2,
        packetsPerSecond: 1250,
        efficiency: 95
    };

    updateSimpleStatsDisplay();
}

function toggleSimplePackets() {
    // Toggle de visualización de paquetes
    console.log('Toggle paquetes');
}

function startSimpleStats() {
    setInterval(() => {
        if (simpleIsRunning) {
            // Variar estadísticas
            simpleStats.latency = 0.3 + Math.random() * 0.4;
            simpleStats.bandwidth = 1.0 + Math.random() * 0.4;
            simpleStats.packetsPerSecond = 1000 + Math.floor(Math.random() * 500);
            simpleStats.efficiency = 90 + Math.random() * 8;

            updateSimpleStatsDisplay();
        }
    }, 1000);
}

function updateSimpleStatsDisplay() {
    const latencyEl = document.getElementById('simpleLatency');
    const bandwidthEl = document.getElementById('simpleBandwidth');
    const packetsEl = document.getElementById('simplePackets');
    const efficiencyEl = document.getElementById('simpleEfficiency');
    const efficiencyFillEl = document.getElementById('simpleEfficiencyFill');

    if (latencyEl) latencyEl.textContent = simpleStats.latency.toFixed(1) + 'ms';
    if (bandwidthEl) bandwidthEl.textContent = simpleStats.bandwidth.toFixed(1) + ' Gbps';
    if (packetsEl) packetsEl.textContent = simpleStats.packetsPerSecond.toString();
    if (efficiencyEl) efficiencyEl.textContent = simpleStats.efficiency.toFixed(0) + '%';

    if (efficiencyFillEl) {
        efficiencyFillEl.style.width = simpleStats.efficiency + '%';

        // Color basado en eficiencia
        if (simpleStats.efficiency > 90) {
            efficiencyFillEl.style.background = 'linear-gradient(90deg, #00ff88, #44ff88)';
        } else if (simpleStats.efficiency > 80) {
            efficiencyFillEl.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc44)';
        } else {
            efficiencyFillEl.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
        }
    }
}

function onSimpleWindowResize() {
    const container = document.getElementById('simulator3d');
    if (container && simpleCamera && simpleRenderer) {
        simpleCamera.aspect = container.clientWidth / container.clientHeight;
        simpleCamera.updateProjectionMatrix();
        simpleRenderer.setSize(container.clientWidth, container.clientHeight);
    }
}

function disposeSimpleSimulator() {
    console.log('Limpiando simulador simple...');

    simpleIsRunning = false;

    if (simpleAnimationId) {
        cancelAnimationFrame(simpleAnimationId);
    }

    // Limpiar objetos
    simpleVMs = [];
    simpleConnections = [];
    simplePackets = [];

    // Limpiar renderer
    if (simpleRenderer) {
        simpleRenderer.dispose();
        simpleRenderer = null;
    }

    // Limpiar escena
    if (simpleScene) {
        simpleScene = null;
    }

    simpleCamera = null;
    simpleControls = null;
}

// Event listener para resize
window.addEventListener('resize', onSimpleWindowResize);
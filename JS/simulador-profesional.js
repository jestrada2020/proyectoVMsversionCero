// Simulador 3D Profesional - Basado en la imagen de referencia
class ProfessionalNetworkSimulator {
    constructor(containerId) {
        this.containerId = containerId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Estados de simulación
        this.isSimulating = false;
        this.latency = 0.5;
        this.bandwidth = 1.2;
        this.packetsPerSecond = 1250;
        this.efficiency = 95;

        // Objetos 3D
        this.vms = [];
        this.connections = [];
        this.dataPackets = [];

        // UI Elements
        this.controlsPanel = null;
        this.statsPanel = null;

        this.init();
    }

    init() {
        this.createScene();
        this.createRenderer();
        this.createCamera();
        this.createControls();
        this.createLighting();
        this.createObjects();
        this.createUI();
        this.startAnimation();
        this.startStats();
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a); // Fondo oscuro como la referencia
    }

    createRenderer() {
        const container = document.getElementById(this.containerId);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });

        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        container.appendChild(this.renderer.domElement);
    }

    createCamera() {
        const container = document.getElementById(this.containerId);
        const aspect = container.clientWidth / container.clientHeight;

        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.camera.position.set(30, 25, 30);
        this.camera.lookAt(0, 0, 0);
    }

    createControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 15;
        this.controls.maxDistance = 80;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.enablePan = true;
        this.controls.panSpeed = 1.2;
        this.controls.rotateSpeed = 0.8;
        this.controls.zoomSpeed = 1.0;
    }

    createLighting() {
        // Luz ambiental suave
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Luz direccional principal
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);

        // Luz de relleno
        const fillLight = new THREE.DirectionalLight(0x8cb4d4, 0.4);
        fillLight.position.set(-25, 25, -25);
        this.scene.add(fillLight);

        // Luz de efecto
        const pointLight = new THREE.PointLight(0x66aaff, 0.8, 50);
        pointLight.position.set(0, 20, 0);
        this.scene.add(pointLight);
    }

    createObjects() {
        this.createFloor();
        this.createVMs();
        this.createConnections();
    }

    createFloor() {
        // Suelo con grid
        const gridSize = 100;
        const gridDivisions = 20;
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x333333, 0x222222);
        gridHelper.position.y = -0.1;
        this.scene.add(gridHelper);

        // Plano invisible para sombras
        const planeGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
        const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);
    }

    createVMs() {
        const vmConfigs = [
            {
                name: "Ubuntu Desktop",
                ip: "192.168.1.7",
                color: 0x3498db, // Azul como en la referencia
                position: [-15, 5, -8],
                size: [8, 6, 6]
            },
            {
                name: "Windows 10",
                ip: "192.168.1.6",
                color: 0xf39c12, // Naranja como en la referencia
                position: [0, 4, 8],
                size: [7, 5, 8]
            },
            {
                name: "Ubuntu Server",
                ip: "192.168.1.8",
                color: 0xe74c3c, // Rojo como en la referencia
                position: [15, 6, -5],
                size: [9, 7, 6]
            }
        ];

        vmConfigs.forEach((config, index) => {
            const vm = this.createVM(config);
            this.scene.add(vm);
            this.vms.push(vm);
        });
    }

    createLaptop() {
        const laptop = new THREE.Group();

        // Base de la laptop (teclado)
        const baseGeometry = new THREE.BoxGeometry(5, 0.35, 3.8);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x2d3748,
            shininess: 80,
            specular: 0x444444
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        base.receiveShadow = true;
        laptop.add(base);

        // Pantalla
        const screenGeometry = new THREE.BoxGeometry(5, 3.5, 0.25);
        const screenMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            shininess: 100,
            specular: 0x333333
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

    createVM(config) {
        // Crear laptop en lugar de caja
        const laptop = this.createLaptop();
        laptop.position.set(config.position[0], config.position[1], config.position[2]);
        laptop.castShadow = true;
        laptop.receiveShadow = true;

        // Aplicar color a la pantalla
        const displayMaterial = new THREE.MeshPhongMaterial({
            color: config.color,
            emissive: config.color,
            emissiveIntensity: 0.4,
            shininess: 100,
            specular: 0x222222
        });
        laptop.userData.display.material = displayMaterial;

        laptop.userData = {
            ...laptop.userData,
            name: config.name,
            ip: config.ip,
            type: 'vm',
            originalColor: config.color
        };

        // Crear label flotante
        const label = this.createLabel(config.name, config.ip);
        label.position.set(0, 4, 0);
        laptop.add(label);

        return laptop;
    }

    createLabel(name, ip) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 120;

        // Fondo del label
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Borde
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.strokeRect(2, 2, canvas.width-4, canvas.height-4);

        // Texto del nombre
        context.fillStyle = '#ffffff';
        context.font = 'bold 28px Arial';
        context.textAlign = 'center';
        context.fillText(name, canvas.width/2, 40);

        // Texto de la IP
        context.fillStyle = '#00ff88';
        context.font = '20px Arial';
        context.fillText(ip, canvas.width/2, 70);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(6, 1.8, 1);

        return sprite;
    }

    createConnections() {
        // Crear conexiones entre todas las VMs
        for (let i = 0; i < this.vms.length; i++) {
            for (let j = i + 1; j < this.vms.length; j++) {
                this.createConnection(this.vms[i], this.vms[j]);
            }
        }
    }

    createConnection(vm1, vm2) {
        const start = vm1.position.clone();
        const end = vm2.position.clone();

        // Ajustar altura de conexión
        start.y = 2;
        end.y = 2;

        // Crear línea de conexión
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0x00aaff,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });

        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.connections.push(line);

        // Crear tubo para conexión más visible
        const curve = new THREE.LineCurve3(start, end);
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.2, 8, false);
        const tubeMaterial = new THREE.MeshPhongMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.6,
            emissive: 0x002244,
            emissiveIntensity: 0.3
        });

        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        this.scene.add(tube);
        this.connections.push(tube);
    }

    createUI() {
        this.createControlsPanel();
        this.createStatsPanel();
    }

    createControlsPanel() {
        const container = document.getElementById(this.containerId);

        this.controlsPanel = document.createElement('div');
        this.controlsPanel.className = 'simulator-controls-panel';
        this.controlsPanel.innerHTML = `
            <h3>Controles</h3>
            <div class="control-buttons">
                <button class="control-btn start-btn" onclick="professionalSimulator.startSimulation()">
                    <i class="fas fa-play"></i> Iniciar
                </button>
                <button class="control-btn pause-btn" onclick="professionalSimulator.pauseSimulation()">
                    <i class="fas fa-pause"></i> Pausar
                </button>
                <button class="control-btn reset-btn" onclick="professionalSimulator.resetSimulation()">
                    <i class="fas fa-redo"></i> Reiniciar
                </button>
                <button class="control-btn packets-btn" onclick="professionalSimulator.togglePackets()">
                    <i class="fas fa-cube"></i> Paquetes
                </button>
            </div>
        `;

        container.appendChild(this.controlsPanel);
    }

    createStatsPanel() {
        const container = document.getElementById(this.containerId);

        this.statsPanel = document.createElement('div');
        this.statsPanel.className = 'simulator-stats-panel';
        this.statsPanel.innerHTML = `
            <h3>Estadísticas en Tiempo Real</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Latencia:</span>
                    <span class="stat-value" id="latency-value">0.5ms</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Ancho de Banda:</span>
                    <span class="stat-value" id="bandwidth-value">1.2 Gbps</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Paquetes/s:</span>
                    <span class="stat-value" id="packets-value">1250</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Eficiencia:</span>
                    <span class="stat-value" id="efficiency-value">95%</span>
                </div>
                <div class="efficiency-bar">
                    <div class="efficiency-fill" id="efficiency-fill"></div>
                </div>
            </div>
        `;

        container.appendChild(this.statsPanel);
    }

    startSimulation() {
        this.isSimulating = true;
        console.log('Simulación iniciada');

        // Actualizar estilos de botones
        document.querySelector('.start-btn').classList.add('active');
        document.querySelector('.pause-btn').classList.remove('active');
    }

    pauseSimulation() {
        this.isSimulating = false;
        console.log('Simulación pausada');

        // Actualizar estilos de botones
        document.querySelector('.start-btn').classList.remove('active');
        document.querySelector('.pause-btn').classList.add('active');
    }

    resetSimulation() {
        this.isSimulating = false;

        // Limpiar paquetes
        this.dataPackets.forEach(packet => {
            this.scene.remove(packet);
        });
        this.dataPackets = [];

        // Resetear estadísticas
        this.latency = 0.5;
        this.bandwidth = 1.2;
        this.packetsPerSecond = 1250;
        this.efficiency = 95;

        console.log('Simulación reiniciada');
    }

    togglePackets() {
        const btn = document.querySelector('.packets-btn');
        btn.classList.toggle('active');

        if (btn.classList.contains('active')) {
            this.generateRandomPackets();
        }
    }

    generateRandomPackets() {
        if (!this.isSimulating) return;

        // Generar paquetes entre VMs aleatoriamente
        if (Math.random() < 0.1) {
            const sourceIndex = Math.floor(Math.random() * this.vms.length);
            let targetIndex;
            do {
                targetIndex = Math.floor(Math.random() * this.vms.length);
            } while (targetIndex === sourceIndex);

            this.createDataPacket(this.vms[sourceIndex], this.vms[targetIndex]);
        }
    }

    createDataPacket(source, target) {
        const packetGeometry = new THREE.SphereGeometry(0.5);
        const packetMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            emissive: 0x004422,
            emissiveIntensity: 0.5,
            shininess: 100
        });

        const packet = new THREE.Mesh(packetGeometry, packetMaterial);
        packet.position.copy(source.position);
        packet.position.y += 3;

        packet.userData = {
            source: source,
            target: target,
            progress: 0,
            speed: 0.02
        };

        this.scene.add(packet);
        this.dataPackets.push(packet);

        // Remover después de completar el viaje
        setTimeout(() => {
            this.scene.remove(packet);
            const index = this.dataPackets.indexOf(packet);
            if (index > -1) {
                this.dataPackets.splice(index, 1);
            }
        }, 5000);
    }

    updateDataPackets() {
        this.dataPackets.forEach(packet => {
            const userData = packet.userData;
            userData.progress += userData.speed;

            if (userData.progress >= 1) {
                return; // El packet se eliminará por timeout
            }

            // Mover packet de source a target
            const currentPos = new THREE.Vector3().lerpVectors(
                userData.source.position,
                userData.target.position,
                userData.progress
            );

            // Añadir movimiento ondulatorio
            currentPos.y += 3 + Math.sin(userData.progress * Math.PI * 3) * 1;
            packet.position.copy(currentPos);

            // Rotación
            packet.rotation.x += 0.1;
            packet.rotation.y += 0.05;
        });
    }

    updateStats() {
        if (!this.isSimulating) return;

        // Simular variaciones en las estadísticas
        this.latency = 0.3 + Math.random() * 0.4;
        this.bandwidth = 1.0 + Math.random() * 0.4;
        this.packetsPerSecond = 1000 + Math.floor(Math.random() * 500);
        this.efficiency = 92 + Math.random() * 6;

        // Actualizar UI
        document.getElementById('latency-value').textContent = this.latency.toFixed(1) + 'ms';
        document.getElementById('bandwidth-value').textContent = this.bandwidth.toFixed(1) + ' Gbps';
        document.getElementById('packets-value').textContent = this.packetsPerSecond.toString();
        document.getElementById('efficiency-value').textContent = this.efficiency.toFixed(0) + '%';

        // Actualizar barra de eficiencia
        const fill = document.getElementById('efficiency-fill');
        if (fill) {
            fill.style.width = this.efficiency + '%';

            // Color basado en eficiencia
            if (this.efficiency > 90) {
                fill.style.background = 'linear-gradient(90deg, #00ff88, #44ff88)';
            } else if (this.efficiency > 80) {
                fill.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc44)';
            } else {
                fill.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
            }
        }
    }

    startStats() {
        setInterval(() => {
            this.updateStats();
        }, 100); // Actualizar cada 100ms para fluidez
    }

    startAnimation() {
        const animate = () => {
            requestAnimationFrame(animate);

            // Actualizar controles
            this.controls.update();

            // Generar y actualizar paquetes
            if (this.isSimulating) {
                this.generateRandomPackets();
                this.updateDataPackets();
            }

            // Animaciones de objetos
            const time = Date.now() * 0.001;

            // Pulsar conexiones
            this.connections.forEach((connection, index) => {
                if (connection.material && connection.material.emissiveIntensity !== undefined) {
                    connection.material.emissiveIntensity = 0.2 + Math.sin(time * 2 + index) * 0.1;
                }
            });

            // Renderizar
            this.renderer.render(this.scene, this.camera);
        };

        animate();
    }

    onWindowResize() {
        const container = document.getElementById(this.containerId);
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    dispose() {
        if (this.controlsPanel) {
            this.controlsPanel.remove();
        }
        if (this.statsPanel) {
            this.statsPanel.remove();
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Variable global para el simulador profesional
let professionalSimulator = null;

// Función para inicializar el simulador profesional
function initProfessionalSimulator() {
    const container = document.getElementById('simulator3d');
    if (!container) {
        console.error('Contenedor del simulador no encontrado');
        return;
    }

    // Limpiar contenedor
    container.innerHTML = '';

    try {
        professionalSimulator = new ProfessionalNetworkSimulator('simulator3d');
        console.log('Simulador profesional inicializado correctamente');

        // Configurar resize
        window.addEventListener('resize', () => {
            professionalSimulator.onWindowResize();
        });

    } catch (error) {
        console.error('Error al inicializar simulador profesional:', error);
    }
}

// Función para limpiar el simulador profesional
function disposeProfessionalSimulator() {
    if (professionalSimulator) {
        professionalSimulator.dispose();
        professionalSimulator = null;
    }
}
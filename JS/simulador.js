// Variables globales del simulador
let scene, camera, renderer, controls;
let switch3D, vms = [];
let animationSpeed = 1;
let packetsSent = 0, packetsReceived = 0;
let isAutoRotating = false;
let networkFailure = false;
let topology = 'star';
let packets = [];
let isSimulating = false;
let showPackets = true;

// Variables para interacción con VMs
let selectedVM = null;
let isDragging = false;
let dragPlane = new THREE.Plane();
let dragOffset = new THREE.Vector3();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// Variables para el panel de configuración
let vmConfigData = {};

// Variables de estado del simulador
let simulatorInitialized = false;
let isTestMode = true; // Empezar en modo test para visibilidad garantizada

// Función para mostrar mensaje de carga
function showLoadingMessage() {
    const container = document.getElementById('simulator3d');
    container.innerHTML = `
        <div style="
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100%; 
            color: white; 
            font-family: Inter, sans-serif;
            flex-direction: column;
            background: linear-gradient(135deg, #1e293b, #0f172a);
        ">
            <div style="margin-bottom: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #4f46e5;"></i>
            </div>
            <h3 style="margin: 0; color: #e2e8f0;">Inicializando Simulador 3D...</h3>
            <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 14px;">Cargando máquinas virtuales y red</p>
        </div>
    `;
}

// Inicializar simulador 3D mejorado
function initSimulator() {
    const container = document.getElementById('simulator3d');
    if (!container) {
        console.error('Contenedor del simulador no encontrado');
        return;
    }
    
    if (simulatorInitialized) {
        console.log('Simulador ya inicializado');
        return;
    }
    
    // Mostrar mensaje de carga
    showLoadingMessage();
    
    // Delay para que se vea el mensaje de carga
    setTimeout(() => {
        initActualSimulator();
    }, 1000);
}

function initActualSimulator() {
    const container = document.getElementById('simulator3d');
    console.log('Iniciando inicialización del simulador 3D...');
    
    // Limpiar el contenedor
    container.innerHTML = '';

    // Configuración de la escena
    console.log('Creando escena...');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c); // Fondo más claro para mejor visibilidad

    // Cámara
    console.log('Configurando cámara...');
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 20, 25);

    // Renderer
    console.log('Configurando renderer...');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    console.log('Canvas agregado al contenedor');
    
    // Renderizado inicial para test
    renderer.render(scene, camera);
    console.log('Primer renderizado completado');

    // Controles de órbita
    try {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = false; // Desactivar pan para no interferir con el arrastre
        controls.minDistance = 5;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI / 2;
    } catch (error) {
        console.warn('OrbitControls no está disponible:', error);
        controls = null;
    }

    // Iluminación mejorada con múltiples fuentes
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Luz adicional para mejor iluminación
    const pointLight = new THREE.PointLight(0x4f46e5, 0.6, 30);
    pointLight.position.set(0, 10, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);
    
    // Luz de relleno
    const fillLight = new THREE.DirectionalLight(0x7c3aed, 0.3);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);

    if (isTestMode) {
        // Crear objetos de test simples
        createTestObjects();
    } else {
        // Crear los objetos reales del simulador
        try {
            console.log('Creando switch central...');
            createEnhancedSwitch();
            
            console.log('Creando VMs...');
            createEnhancedVMs();
            
            console.log('Creando conexiones de red...');
            createNetworkConnections();
            
            console.log('Creando suelo...');
            createFloor();
            
            console.log('Todos los objetos creados exitosamente');
        } catch (error) {
            console.error('Error creando objetos 3D:', error);
        }
    }

    // Iniciar loop de animación
    animate();

    // Event listeners para controles
    setupControlListeners();

    // Iniciar logging
    startNetworkLogging();
    
    // Iniciar simulación automáticamente
    setTimeout(() => {
        startNetworkSimulation();
    }, 2000);
    
    // Añadir animación de partículas ambientales
    animateAmbientParticles();
    
    // Test básico para verificar que todo funciona
    console.log('Elementos creados:');
    console.log('- VMs:', vms.length);
    console.log('- Switch3D:', !!switch3D);
    console.log('- Scene children:', scene.children.length);
}

function animateAmbientParticles() {
    const animateParticles = () => {
        scene.traverse((child) => {
            if (child.userData && child.userData.isAmbientParticles) {
                const positions = child.geometry.attributes.position.array;
                const time = Date.now() * 0.001;
                
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += Math.sin(time + i) * 0.01; // Movimiento vertical suave
                    
                    // Mantener partículas dentro del área
                    if (positions[i + 1] > 20) positions[i + 1] = 2;
                    if (positions[i + 1] < 2) positions[i + 1] = 20;
                }
                
                child.geometry.attributes.position.needsUpdate = true;
                child.rotation.y += 0.002; // Rotación lenta
            }
            
            // Animar partículas de flujo de datos
            if (child.userData && child.userData.isDataFlow) {
                child.userData.progress += child.userData.speed;
                
                if (child.userData.progress <= 1) {
                    const pos = new THREE.Vector3().lerpVectors(
                        child.userData.start,
                        child.userData.end,
                        child.userData.progress
                    );
                    child.position.copy(pos);
                    
                    // Efecto de brillo pulsante
                    const pulse = Math.sin(child.userData.progress * Math.PI * 8) * 0.5 + 0.5;
                    child.material.opacity = 0.5 + pulse * 0.5;
                }
            }
        });
        
        requestAnimationFrame(animateParticles);
    };
    
    animateParticles();

    // Configurar interacción con VMs
    setupVMInteraction();

    // Mostrar tooltip inicial
    setTimeout(() => {
        const tooltip = document.getElementById('simulator-tooltip');
        if (tooltip) {
            tooltip.classList.add('active');
            setTimeout(() => {
                tooltip.classList.remove('active');
            }, 5000);
        }
    }, 2000);

    // Responsive
    window.addEventListener('resize', onWindowResize);
    
    // Marcar como inicializado
    simulatorInitialized = true;
    console.log('Simulador 3D inicializado correctamente');
}

// Función para crear objetos de test simples
function createTestObjects() {
    console.log('Creando objetos de test...');
    
    // Cubo de test en el centro
    const testGeometry = new THREE.BoxGeometry(2, 2, 2);
    const testMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff4444,
        emissive: 0x440000,
        emissiveIntensity: 0.2
    });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testCube.position.set(0, 1, 0);
    testCube.castShadow = true;
    testCube.receiveShadow = true;
    scene.add(testCube);
    
    // Esferas de test alrededor
    for (let i = 0; i < 3; i++) {
        const sphereGeometry = new THREE.SphereGeometry(0.8);
        const sphereMaterial = new THREE.MeshPhongMaterial({ 
            color: [0x4444ff, 0x44ff44, 0xffff44][i],
            emissive: [0x000044, 0x004400, 0x444400][i],
            emissiveIntensity: 0.1
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        const angle = (i / 3) * Math.PI * 2;
        sphere.position.set(Math.cos(angle) * 5, 1, Math.sin(angle) * 5);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        scene.add(sphere);
    }
    
    // Plano de test
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x222222,
        transparent: true,
        opacity: 0.5
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    plane.receiveShadow = true;
    scene.add(plane);
    
    console.log('Objetos de test creados');
}

function createEnhancedSwitch() {
    console.log('Creando switch básico...');
    const switchGeometry = new THREE.CylinderGeometry(2, 2, 1, 8);
    const switchMaterial = new THREE.MeshPhongMaterial({
        color: 0xff4444, // Rojo claro para el switch
        emissive: 0xff1111,
        emissiveIntensity: 0.4,
        transparent: false,
        opacity: 1,
        shininess: 100
    });

    switch3D = new THREE.Mesh(switchGeometry, switchMaterial);
    switch3D.position.set(0, 0.5, 0);
    switch3D.castShadow = true;
    switch3D.receiveShadow = true;
    scene.add(switch3D);
    console.log('Switch agregado a la escena en posición central');

    // Solo una luz indicadora central
    const ledGeometry = new THREE.SphereGeometry(0.1);
    const ledMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.4
    });
    const led = new THREE.Mesh(ledGeometry, ledMaterial);
    led.position.set(0, 0.3, 0);
    switch3D.add(led);
}

// Función para crear geometría de laptop
function createLaptopGeometry() {
    const laptop = new THREE.Group();

    // Base de la laptop (teclado)
    const baseGeometry = new THREE.BoxGeometry(4, 0.3, 3);
    const baseMaterial = new THREE.MeshPhongMaterial({
        color: 0x2d3748,
        shininess: 50
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    laptop.add(base);

    // Pantalla
    const screenGeometry = new THREE.BoxGeometry(4, 2.8, 0.2);
    const screenMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        shininess: 80
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 1.7, -1.3);
    screen.rotation.x = Math.PI * 0.15; // Inclinación de 27 grados
    screen.castShadow = true;
    screen.receiveShadow = true;
    laptop.add(screen);

    // Pantalla activa (display)
    const displayGeometry = new THREE.BoxGeometry(3.6, 2.4, 0.05);
    const displayMesh = new THREE.Mesh(displayGeometry);
    displayMesh.position.set(0, 1.7, -1.2);
    displayMesh.rotation.x = Math.PI * 0.15;
    laptop.add(displayMesh);

    // Guardar referencia al display para cambiar color después
    laptop.userData.display = displayMesh;

    return laptop;
}

function createEnhancedVMs() {
    console.log('Creando VMs como laptops para visibilidad...');
    vms = []; // Reset array

    const vmConfigs = [
        {
            name: "Windows 7",
            ip: "192.168.1.6",
            color: 0xff0000, // Rojo brillante
            position: [-6, 1, -4]
        },
        {
            name: "Ubuntu Desktop",
            ip: "192.168.1.7",
            color: 0x00ff00, // Verde brillante
            position: [6, 1, -4]
        },
        {
            name: "Ubuntu Server",
            ip: "192.168.1.8",
            color: 0x0066ff, // Azul brillante
            position: [0, 1, 6]
        }
    ];

    vmConfigs.forEach((config, index) => {
        console.log(`Creando VM laptop: ${config.name}`);

        // Crear laptop
        const laptop = createLaptopGeometry();
        laptop.position.set(config.position[0], config.position[1], config.position[2]);

        // Aplicar color a la pantalla
        const displayMaterial = new THREE.MeshPhongMaterial({
            color: config.color,
            emissive: config.color,
            emissiveIntensity: 0.4,
            shininess: 100
        });
        laptop.userData.display.material = displayMaterial;

        // Datos básicos
        laptop.userData = {
            ...laptop.userData,
            name: config.name,
            ip: config.ip,
            originalColor: config.color,
            type: "vm"
        };

        scene.add(laptop);
        vms.push(laptop);
        console.log(`VM ${config.name} agregada a la escena en:`, config.position);

        // Luz de estado en la base del laptop
        const statusLightGeometry = new THREE.SphereGeometry(0.08);
        const statusLightMaterial = new THREE.MeshPhongMaterial({
            color: 0x10b981,
            emissive: 0x10b981,
            emissiveIntensity: 0.5
        });
        const statusLight = new THREE.Mesh(statusLightGeometry, statusLightMaterial);
        statusLight.position.set(-1.5, 0.2, 1.2);
        laptop.add(statusLight);
    });

    console.log(`Total VMs creadas: ${vms.length}`);
    console.log('VMs laptops agregadas a la escena exitosamente');
}

function createNetworkConnections() {
    // Remover conexiones existentes incluyendo nodos y efectos
    scene.children = scene.children.filter(child => {
        if (child instanceof THREE.Line && !child.userData.keepAlive) {
            return false;
        }
        if (child.userData && (child.userData.isGlow || child.userData.isConnectionNode)) {
            return false;
        }
        return true;
    });
    
    // Crear nuevas conexiones según la topología
    switch(topology) {
        case 'star':
            createStarTopology();
            break;
        case 'bus':
            createBusTopology();
            break;
        case 'ring':
            createRingTopology();
            break;
        case 'mesh':
            createMeshTopology();
            break;
    }
}

function createStarTopology() {
    console.log('Creando conexiones de red básicas...');
    // Conexiones simples desde cada VM al switch
    vms.forEach((vm) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(vm.position.x, vm.position.y - 0.5, vm.position.z),
            new THREE.Vector3(0, 0.5, 0)
        ]);
        
        const material = new THREE.LineBasicMaterial({
            color: 0xffff00, // Amarillo brillante para las conexiones
            transparent: true,
            opacity: 1.0,
            linewidth: 3
        });
        
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        console.log(`Conexión creada desde ${vm.userData.name} al switch`);
    });
}

function createBusTopology() {
    // Línea principal del bus mejorada
    const busPoints = [
        new THREE.Vector3(-15, 0, 0),
        new THREE.Vector3(15, 0, 0)
    ];
    createNetworkLine(busPoints, 0x8b5cf6, true); // Morado para el bus principal
    
    // Conexiones de VMs al bus con diferentes colores
    vms.forEach((vm, index) => {
        const busConnection = [
            new THREE.Vector3(vm.position.x, vm.position.y - 1, vm.position.z),
            new THREE.Vector3(vm.position.x, 0, 0)
        ];
        
        // Colores alternados para mejor visualización
        const colors = [0x10b981, 0xf59e0b, 0xef4444, 0x3b82f6];
        createNetworkLine(busConnection, colors[index % colors.length]);
    });
}

function createRingTopology() {
    // Conexiones en anillo con colores graduales
    const ringColors = [0xf59e0b, 0xef4444, 0x8b5cf6, 0x06b6d4, 0x10b981, 0xf97316];
    
    for (let i = 0; i < vms.length; i++) {
        const currentVM = vms[i];
        const nextVM = vms[(i + 1) % vms.length];
        
        // Crear curva para conexiones más suaves
        const start = new THREE.Vector3(currentVM.position.x, currentVM.position.y - 1, currentVM.position.z);
        const end = new THREE.Vector3(nextVM.position.x, nextVM.position.y - 1, nextVM.position.z);
        const mid = new THREE.Vector3(
            (start.x + end.x) / 2,
            Math.max(start.y, end.y) + 2, // Elevar el punto medio
            (start.z + end.z) / 2
        );
        
        // Crear curva Bézier cuadrática
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(20);
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: ringColors[i % ringColors.length],
            transparent: true,
            opacity: 0.8,
            linewidth: 4
        });
        
        const line = new THREE.Line(geometry, material);
        line.computeLineDistances();
        scene.add(line);
    }
}

function createMeshTopology() {
    // Conexiones malla completa mejorada con colores dinámicos
    const meshColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899];
    let colorIndex = 0;
    
    for (let i = 0; i < vms.length; i++) {
        for (let j = i + 1; j < vms.length; j++) {
            const vm1 = vms[i];
            const vm2 = vms[j];
            
            // Determinar color basado en tipos de VMs
            let connectionColor = meshColors[colorIndex % meshColors.length];
            
            if (vm1.userData.type === 'server' || vm2.userData.type === 'server') {
                connectionColor = 0x3b82f6; // Azul para conexiones con servidor
            }
            
            const points = [
                new THREE.Vector3(vm1.position.x, vm1.position.y - 1, vm1.position.z),
                new THREE.Vector3(vm2.position.x, vm2.position.y - 1, vm2.position.z)
            ];
            
            createNetworkLine(points, connectionColor);
            colorIndex++;
        }
    }
}

function createNetworkLine(points, color, isBus = false) {
    // Crear línea principal
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: isBus ? 0.9 : 0.7,
        linewidth: isBus ? 8 : 4
    });
    
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances(); // Necesario para líneas punteadas
    if (isBus) line.userData.keepAlive = true;
    
    // Añadir efecto de brillo para conexiones activas
    if (!isBus) {
        const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const glowMaterial = new THREE.LineBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.3,
            linewidth: 8
        });
        
        const glowLine = new THREE.Line(glowGeometry, glowMaterial);
        glowLine.computeLineDistances();
        glowLine.userData.isGlow = true;
        scene.add(glowLine);
        
        // Animación de pulso para el brillo
        glowLine.userData.pulsePhase = Math.random() * Math.PI * 2;
    }
    
    // Añadir puntos de conexión en los extremos
    points.forEach((point, index) => {
        const nodeGeometry = new THREE.SphereGeometry(0.1);
        const nodeMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            shininess: 100
        });
        
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.copy(point);
        node.userData.isConnectionNode = true;
        scene.add(node);
    });
    
    scene.add(line);
    return line;
}

function createFloor() {
    console.log('Creando suelo básico...');
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshPhongMaterial({
        color: 0x2d3748,
        transparent: true,
        opacity: 0.7
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    scene.add(floor);
    console.log('Suelo agregado a la escena');

    // Grid más grande
    const gridHelper = new THREE.GridHelper(40, 40, 0x4f46e5, 0x4f46e5);
    gridHelper.position.y = -1.9;
    scene.add(gridHelper);
    console.log('Grid agregado a la escena');
}

function createAmbientParticles() {
    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 35;
        positions[i * 3 + 1] = Math.random() * 20 + 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 35;
        
        // Colores aleatorios en tonos azules y morados
        const colorVariant = Math.random();
        if (colorVariant > 0.7) {
            colors[i * 3] = 0.31; colors[i * 3 + 1] = 0.27; colors[i * 3 + 2] = 0.90; // Azul
        } else if (colorVariant > 0.4) {
            colors[i * 3] = 0.49; colors[i * 3 + 1] = 0.23; colors[i * 3 + 2] = 0.93; // Morado
        } else {
            colors[i * 3] = 0.06; colors[i * 3 + 1] = 0.73; colors[i * 3 + 2] = 0.51; // Verde
        }
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.08,
        transparent: true,
        opacity: 0.6,
        vertexColors: true,
        blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.userData.isAmbientParticles = true;
    scene.add(particles);
}

function createDataFlowEffects() {
    // Esta función creará efectos visuales de datos fluyendo por las conexiones
    setInterval(() => {
        if (isSimulating && Math.random() > 0.8) {
            // Crear pequeñas partículas que se mueven por las conexiones
            scene.traverse((child) => {
                if (child instanceof THREE.Line && !child.userData.keepAlive && !child.userData.isGlow) {
                    createDataFlowParticle(child);
                }
            });
        }
    }, 1000);
}

function createDataFlowParticle(connection) {
    const geometry = new THREE.SphereGeometry(0.05);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });
    
    const particle = new THREE.Mesh(geometry, material);
    const points = connection.geometry.attributes.position.array;
    
    if (points.length >= 6) {
        const start = new THREE.Vector3(points[0], points[1], points[2]);
        const end = new THREE.Vector3(points[3], points[4], points[5]);
        
        particle.position.copy(start);
        particle.userData = {
            start: start,
            end: end,
            progress: 0,
            speed: 0.02 + Math.random() * 0.03,
            isDataFlow: true
        };
        
        scene.add(particle);
        
        // Remover después de la animación
        setTimeout(() => {
            scene.remove(particle);
        }, 3000);
    }
}

function createTextLabel(text, x, y, z) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = '16px Inter';
    context.textAlign = 'center';
    
    const lines = text.split('\n');
    lines.forEach((line, index) => {
        context.fillText(line, canvas.width / 2, 40 + index * 25);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(x, y, z);
    sprite.scale.set(4, 2, 1);
    scene.add(sprite);
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001 * animationSpeed;

    // Animación simple y robusta
    scene.traverse((object) => {
        if (object.isMesh) {
            // Rotación básica para todos los objetos
            if (object.userData && object.userData.animationPhase !== undefined) {
                const phase = object.userData.animationPhase;
                object.rotation.y += 0.003 * animationSpeed;
                
                // Escala pulsante
                const scale = 1 + Math.sin(time + phase) * 0.02;
                object.scale.set(scale, scale, scale);
            } else {
                // Objetos de test - rotación simple
                object.rotation.y += 0.01;
            }
            
            // Efectos de emissive para materiales que lo soporten
            if (object.material && object.material.emissive) {
                const pulse = Math.sin(time * 2 + (object.position.x + object.position.z)) * 0.2 + 0.3;
                object.material.emissiveIntensity = pulse;
            }
        }
    });

    // Actualizar paquetes si existen
    if (typeof updatePackets === 'function' && showPackets) {
        try {
            updatePackets();
        } catch (error) {
            console.warn('Error actualizando paquetes:', error);
        }
    }

    // Generar tráfico si existe
    if (typeof generateNetworkTraffic === 'function' && isSimulating) {
        try {
            generateNetworkTraffic();
        } catch (error) {
            console.warn('Error generando tráfico:', error);
        }
    }

    // Controles de cámara
    if (controls) {
        if (isAutoRotating) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 1.0;
        } else {
            controls.autoRotate = false;
        }
        controls.update();
    }

    // Renderizar la escena
    try {
        renderer.render(scene, camera);
    } catch (error) {
        console.error('Error renderizando:', error);
    }

    // Actualizar estadísticas del simulador
    updateSimulatorStats();
    
    // Actualizar estadísticas si existe la función
    if (typeof updateNetworkStats === 'function') {
        try {
            updateNetworkStats();
        } catch (error) {
            console.warn('Error actualizando estadísticas:', error);
        }
    }
}

// Función para crear animación de paquetes mejorada
function createPacketAnimation(startPos, endPos, packetType = 'data') {
    const geometry = new THREE.SphereGeometry(0.15, 16, 16);
    let material;
    
    switch(packetType) {
        case 'ping':
            material = new THREE.MeshPhongMaterial({ 
                color: 0x22d3ee,
                emissive: 0x22d3ee,
                emissiveIntensity: 0.4
            });
            break;
        case 'error':
            material = new THREE.MeshPhongMaterial({ 
                color: 0xef4444,
                emissive: 0xef4444,
                emissiveIntensity: 0.6
            });
            break;
        default:
            material = new THREE.MeshPhongMaterial({ 
                color: 0x10b981,
                emissive: 0x10b981,
                emissiveIntensity: 0.4
            });
    }
    
    const packet = new THREE.Mesh(geometry, material);
    packet.position.copy(startPos);
    packet.position.y += 0.5; // Elevar ligeramente
    
    packet.userData = {
        start: startPos.clone(),
        end: endPos.clone(),
        progress: 0,
        speed: 0.008 + Math.random() * 0.012,
        type: packetType,
        createdAt: Date.now()
    };
    
    scene.add(packet);
    packets.push(packet);
    
    return packet;
}

// Función para actualizar paquetes
function updatePackets() {
    packets.forEach((packet, index) => {
        packet.userData.progress += packet.userData.speed;
        
        if (packet.userData.progress >= 1) {
            scene.remove(packet);
            packets.splice(index, 1);
            packetsReceived++;
        } else {
            // Interpolación suave entre posiciones
            const pos = new THREE.Vector3().lerpVectors(
                packet.userData.start,
                packet.userData.end,
                packet.userData.progress
            );
            
            // Añadir movimiento de flotación
            pos.y += Math.sin(packet.userData.progress * Math.PI * 6) * 0.3 + 1;
            packet.position.copy(pos);
            
            // Rotación del paquete
            packet.rotation.x += 0.1;
            packet.rotation.y += 0.05;
            
            // Efecto de brillo pulsante
            const pulse = (Math.sin(Date.now() * 0.01) + 1) * 0.5;
            packet.material.emissiveIntensity = 0.3 + pulse * 0.3;
        }
    });
}

// Función para generar tráfico de red automático
function generateNetworkTraffic() {
    if (!isSimulating || vms.length < 2) return;
    
    // Probabilidad de generar un paquete
    if (Math.random() < 0.03) {
        const sourceIndex = Math.floor(Math.random() * vms.length);
        let targetIndex;
        do {
            targetIndex = Math.floor(Math.random() * vms.length);
        } while (targetIndex === sourceIndex);
        
        const sourceVM = vms[sourceIndex];
        const targetVM = vms[targetIndex];
        
        // Determinar tipo de paquete
        const packetTypes = ['data', 'ping', 'data', 'data']; // Más paquetes de datos
        const packetType = packetTypes[Math.floor(Math.random() * packetTypes.length)];
        
        createPacketAnimation(sourceVM.position, targetVM.position, packetType);
        packetsSent++;
    }
}

// Funciones de control de simulación
function startNetworkSimulation() {
    isSimulating = true;
    addLogEntry('[SIM] Simulación de red iniciada', 'success');
}

function pauseNetworkSimulation() {
    isSimulating = false;
    addLogEntry('[SIM] Simulación pausada', 'info');
}

function togglePacketVisibility() {
    showPackets = !showPackets;
    packets.forEach(packet => {
        packet.visible = showPackets;
    });
    addLogEntry(`[VIS] Visibilidad de paquetes: ${showPackets ? 'ON' : 'OFF'}`, 'info');
}

// Función para alternar entre modo test y modo completo
function toggleTestMode() {
    isTestMode = !isTestMode;
    const btn = document.getElementById('testModeBtn');
    if (btn) {
        btn.innerHTML = isTestMode ? 
            '<i class="fas fa-vials"></i> Modo Test' : 
            '<i class="fas fa-cube"></i> Modo Completo';
        btn.style.background = isTestMode ? '#3b82f6' : '#4f46e5';
    }
    
    console.log('Cambiando a modo:', isTestMode ? 'Test' : 'Completo');
    // Reiniciar el simulador con el nuevo modo
    restartSimulator();
}

// Variables para FPS counter
let lastTime = performance.now();
let frameCount = 0;
let fps = 60;

// Función para actualizar estadísticas del simulador
function updateSimulatorStats() {
    // Calcular FPS
    const currentTime = performance.now();
    frameCount++;
    
    if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
    }
    
    // Actualizar elementos de la UI
    const stats = {
        simulatorMode: isTestMode ? 'Test' : 'Completo',
        objectCount: scene ? scene.children.length : 0,
        fpsCounter: fps,
        activeVMs: vms ? vms.length : 0,
        networkStatus: simulatorInitialized ? 'Activo' : 'Inicializando'
    };
    
    Object.keys(stats).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = stats[key];
            
            // Colores dinámicos basados en valores
            if (key === 'fpsCounter') {
                element.style.color = fps > 30 ? '#10b981' : fps > 15 ? '#f59e0b' : '#ef4444';
            } else if (key === 'networkStatus') {
                element.style.color = simulatorInitialized ? '#10b981' : '#f59e0b';
            } else if (key === 'simulatorMode') {
                element.style.color = isTestMode ? '#3b82f6' : '#8b5cf6';
            }
        }
    });
}

// Función para reiniciar el simulador
function restartSimulator() {
    console.log('Reiniciando simulador...');
    
    // Limpiar escena
    if (scene) {
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
    }
    
    // Limpiar variables
    vms = [];
    packets = [];
    switch3D = null;
    
    // Reinicializar
    simulatorInitialized = false;
    initActualSimulator();
}

function onWindowResize() {
    const container = document.getElementById('simulator3d');
    if (container && camera && renderer) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}
// Simulador 3D Básico - Garantizado para funcionar
let basicScene, basicCamera, basicRenderer, basicControls;
let basicVMs = [];
let basicConnections = [];
let basicIsRunning = false;
let basicAnimationId;
let basicRaycaster, basicMouse;
let basicSwitch;

// Estadísticas básicas
let basicStats = {
    latency: 0.5,
    bandwidth: 1.2,
    packetsPerSecond: 1250,
    efficiency: 95
};

function initBasicSimulator() {
    console.log('Inicializando simulador básico...');

    const container = document.getElementById('simulator3d');
    if (!container) {
        console.error('Contenedor no encontrado');
        return;
    }

    // Limpiar contenedor
    container.innerHTML = '';

    // Verificar Three.js con múltiples intentos
    let attempts = 0;
    const maxAttempts = 3;

    function tryInitialize() {
        attempts++;
        console.log(`Intento ${attempts} de inicialización...`);

        if (typeof THREE !== 'undefined') {
            console.log('Three.js encontrado, inicializando...');
            actuallyInitialize();
        } else if (attempts < maxAttempts) {
            console.log('Three.js no encontrado, reintentando en 1 segundo...');
            setTimeout(tryInitialize, 1000);
        } else {
            console.log('Three.js no disponible, mostrando simulador 2D alternativo');
            show2DAlternative();
        }
    }

    tryInitialize();
}

function actuallyInitialize() {
    const container = document.getElementById('simulator3d');

    try {
        // Crear escena básica con fondo oscuro como la referencia
        basicScene = new THREE.Scene();
        basicScene.background = new THREE.Color(0x0a0a0a);

        // Crear cámara con perspectiva similar a la referencia
        const aspect = container.clientWidth / container.clientHeight;
        basicCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
        basicCamera.position.set(15, 20, 25);
        basicCamera.lookAt(0, 0, 0);

        // Crear renderer
        basicRenderer = new THREE.WebGLRenderer({ antialias: true });
        basicRenderer.setSize(container.clientWidth, container.clientHeight);
        basicRenderer.shadowMap.enabled = true;
        container.appendChild(basicRenderer.domElement);

        // Crear controles si OrbitControls está disponible
        if (typeof THREE.OrbitControls !== 'undefined') {
            basicControls = new THREE.OrbitControls(basicCamera, basicRenderer.domElement);
            basicControls.enableDamping = true;
            basicControls.dampingFactor = 0.05;
        } else {
            console.log('OrbitControls no disponible, usando controles manuales');
            setupManualControls();
        }

        // Configurar raycasting para clicks
        basicRaycaster = new THREE.Raycaster();
        basicMouse = new THREE.Vector2();
        setupClickHandlers();
        setupHoverHandlers();

        // Agregar iluminación básica
        addBasicLighting();

        // Crear objetos simples
        createBasicObjects();

        // Crear UI básica
        createBasicUI();

        // Iniciar animación
        basicIsRunning = true;
        animateBasic();

        // Iniciar estadísticas
        startBasicStats();

        console.log('Simulador básico inicializado correctamente');

    } catch (error) {
        console.error('Error en simulador básico:', error);
        show2DAlternative();
    }
}

function addBasicLighting() {
    // Luz ambiental más suave como en la referencia
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    basicScene.add(ambientLight);

    // Luz direccional principal
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    basicScene.add(directionalLight);

    // Luz de relleno para mejor visibilidad
    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.3);
    fillLight.position.set(-10, 10, -10);
    basicScene.add(fillLight);

    // Luz puntual suave para destacar objetos
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight.position.set(0, 15, 0);
    basicScene.add(pointLight);
}

// Función global para crear laptop en el simulador básico
function createBasicLaptop() {
    const laptop = new THREE.Group();

    // Base de la laptop (teclado)
    const baseGeometry = new THREE.BoxGeometry(6, 0.4, 4.5);
    const baseMaterial = new THREE.MeshLambertMaterial({
        color: 0x2d3748
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    laptop.add(base);

    // Pantalla
    const screenGeometry = new THREE.BoxGeometry(6, 4.2, 0.3);
    const screenMaterial = new THREE.MeshLambertMaterial({
        color: 0x1a1a1a
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 2.5, -2);
    screen.rotation.x = Math.PI * 0.15;
    screen.castShadow = true;
    screen.receiveShadow = true;
    laptop.add(screen);

    // Pantalla activa (display)
    const displayGeometry = new THREE.BoxGeometry(5.4, 3.6, 0.08);
    const displayMesh = new THREE.Mesh(displayGeometry);
    displayMesh.position.set(0, 2.5, -1.85);
    displayMesh.rotation.x = Math.PI * 0.15;
    laptop.add(displayMesh);

    laptop.userData.display = displayMesh;

    return laptop;
}

function createBasicObjects() {
    // Crear suelo más sutil como en la referencia
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshLambertMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.3
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    basicScene.add(floor);

    // Crear VMs como laptops
    const vmData = [
        { name: "Ubuntu Desktop", ip: "192.168.1.7", color: 0x4a90e2, position: [-12, 2, 0] }, // Azul
        { name: "Ubuntu Server", ip: "192.168.1.8", color: 0xe74c3c, position: [8, 2, 8] },   // Rojo
        { name: "Windows 7", ip: "192.168.1.6", color: 0xff6b35, position: [0, 2, 0] }       // Naranja (switch)
    ];

    vmData.forEach((data, index) => {
        let vm;

        if (index === 2) {
            // Switch central más grande como en la referencia
            const geometry = new THREE.BoxGeometry(6, 4, 6);
            const material = new THREE.MeshLambertMaterial({
                color: data.color,
                transparent: false
            });
            vm = new THREE.Mesh(geometry, material);
            vm.userData = { name: "Switch Central", ip: "192.168.1.0/24", type: 'switch' };
            basicSwitch = vm;

            // Etiqueta para switch
            const switchLabel = createBasicLabel("Switch Virtual\n192.168.1.0/24");
            switchLabel.position.set(0, 4, 0);
            vm.add(switchLabel);

            // Bordes para el switch
            const edges = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.3
            });
            const wireframe = new THREE.LineSegments(edges, lineMaterial);
            vm.add(wireframe);
        } else {
            // VMs como laptops
            vm = createBasicLaptop();

            // Aplicar color a la pantalla
            const displayMaterial = new THREE.MeshLambertMaterial({
                color: data.color,
                emissive: data.color,
                emissiveIntensity: 0.3
            });
            vm.userData.display.material = displayMaterial;

            vm.userData = {
                ...vm.userData,
                name: data.name,
                ip: data.ip,
                type: 'vm'
            };
            basicVMs.push(vm);

            // Etiqueta para VM
            const label = createBasicLabel(`${data.name} VM\n${data.ip}`);
            label.position.set(0, 4.5, 0);
            vm.add(label);
        }

        vm.position.set(data.position[0], data.position[1], data.position[2]);
        vm.castShadow = true;
        vm.receiveShadow = true;

        basicScene.add(vm);
    });

    // Crear conexiones más visibles como en la referencia
    basicVMs.forEach(vm => {
        const points = [
            new THREE.Vector3(vm.position.x, vm.position.y - 1, vm.position.z),
            new THREE.Vector3(basicSwitch.position.x, basicSwitch.position.y, basicSwitch.position.z)
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x00bfff,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        const line = new THREE.Line(geometry, material);
        basicScene.add(line);
        basicConnections.push(line);
    });
}

function createBasicLabel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    // Fondo semi-transparente con borde
    context.fillStyle = 'rgba(0, 0, 0, 0.9)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Borde brillante
    context.strokeStyle = 'rgba(79, 70, 229, 0.8)';
    context.lineWidth = 4;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Texto blanco más grande
    context.fillStyle = 'white';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.shadowColor = 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = 3;
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;

    const lines = text.split('\n');
    const lineHeight = 35;
    const startY = (canvas.height - (lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
        context.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(6, 3, 1);

    // Añadir userData para identificar como etiqueta
    sprite.userData = { isLabel: true };

    return sprite;
}

function updateLabelScale(object) {
    // Buscar la etiqueta (sprite) en los hijos del objeto
    const label = object.children.find(child =>
        child.userData && child.userData.isLabel
    );

    if (label && basicCamera) {
        // Calcular distancia entre cámara y objeto
        const distance = basicCamera.position.distanceTo(object.position);

        // Escalar etiqueta inversamente a la distancia (más cerca = más grande)
        // Con límites mínimos y máximos para evitar extremos
        const baseScale = 6;
        const minScale = 3;
        const maxScale = 12;
        const scaleFactor = Math.max(minScale, Math.min(maxScale, baseScale * (30 / distance)));

        label.scale.set(scaleFactor, scaleFactor * 0.5, 1);

        // Hacer que las etiquetas siempre miren a la cámara
        label.lookAt(basicCamera.position);
    }
}

function setupClickHandlers() {
    const canvas = basicRenderer.domElement;

    canvas.addEventListener('click', (event) => {
        event.preventDefault();

        // Calcular posición del mouse en coordenadas normalizadas
        const rect = canvas.getBoundingClientRect();
        basicMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        basicMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Configurar raycaster
        basicRaycaster.setFromCamera(basicMouse, basicCamera);

        // Buscar intersecciones con VMs y switch
        const allObjects = [...basicVMs, basicSwitch];
        const intersects = basicRaycaster.intersectObjects(allObjects);

        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            handleObjectClick(selectedObject);
        }
    });
}

function handleObjectClick(object) {
    const userData = object.userData;

    if (userData.type === 'vm') {
        showVMConfigPanel(userData);
    } else if (userData.type === 'switch') {
        showSwitchInfoPanel(userData);
    }
}

function showVMConfigPanel(vmData) {
    // Cerrar cualquier panel existente
    closeConfigPanels();

    const configPanel = document.createElement('div');
    configPanel.className = 'vm-config-panel';
    configPanel.innerHTML = `
        <div class="config-header">
            <h3><i class="fas fa-desktop"></i> Configuración de ${vmData.name}</h3>
            <button class="close-btn" onclick="closeConfigPanels()">×</button>
        </div>
        <div class="config-content">
            <div class="config-section">
                <label>Nombre:</label>
                <input type="text" id="vmName" value="${vmData.name}" />
            </div>
            <div class="config-section">
                <label>Dirección IP:</label>
                <input type="text" id="vmIP" value="${vmData.ip}" />
            </div>
            <div class="config-section">
                <label>Estado:</label>
                <select id="vmStatus">
                    <option value="running">Ejecutándose</option>
                    <option value="stopped">Detenida</option>
                    <option value="paused">Pausada</option>
                </select>
            </div>
            <div class="config-section">
                <label>RAM:</label>
                <select id="vmRAM">
                    <option value="1024">1 GB</option>
                    <option value="2048">2 GB</option>
                    <option value="4096">4 GB</option>
                    <option value="8192">8 GB</option>
                </select>
            </div>
            <div class="config-section">
                <label>CPU:</label>
                <select id="vmCPU">
                    <option value="1">1 Core</option>
                    <option value="2">2 Cores</option>
                    <option value="4">4 Cores</option>
                </select>
            </div>
            <div class="config-section mcp-section">
                <label>🔧 Configuración MCP:</label>
                <div class="mcp-toggle">
                    <input type="checkbox" id="mcpEnabled" checked>
                    <label for="mcpEnabled">Habilitar MCP</label>
                </div>
                <select id="mcpLevel">
                    <option value="basic">MCP Básico</option>
                    <option value="advanced" selected>MCP Avanzado</option>
                    <option value="enterprise">MCP Empresarial</option>
                </select>
                <div class="mcp-features-config">
                    <small>• Monitoreo en tiempo real</small>
                    <small>• Configuración remota</small>
                    <small>• Gestión centralizada</small>
                    <small>• Políticas de seguridad</small>
                </div>
            </div>
        </div>
        <div class="config-actions">
            <button class="config-btn save-btn" onclick="saveVMConfig('${vmData.name}')">
                <i class="fas fa-save"></i> Guardar
            </button>
            <button class="config-btn restart-btn" onclick="restartVM('${vmData.name}')">
                <i class="fas fa-redo"></i> Reiniciar
            </button>
            <button class="config-btn mcp-btn" onclick="configureMCP('${vmData.name}')">
                <i class="fas fa-cogs"></i> Configurar MCP
            </button>
        </div>
    `;

    document.getElementById('simulator3d').appendChild(configPanel);
}

function showSwitchInfoPanel(switchData) {
    // Cerrar cualquier panel existente
    closeConfigPanels();

    const infoPanel = document.createElement('div');
    infoPanel.className = 'switch-info-panel';
    infoPanel.innerHTML = `
        <div class="config-header">
            <h3><i class="fas fa-network-wired"></i> ${switchData.name} Virtual</h3>
            <button class="close-btn" onclick="closeConfigPanels()">×</button>
        </div>
        <div class="config-content">
            <div class="info-section">
                <h4>🌐 Switch Virtual - Concepto Clave</h4>
                <p><strong>Este es un switch completamente virtual</strong> creado dentro del servidor para conectar las máquinas virtuales. No es un dispositivo físico, sino una abstracción de software que simula el comportamiento de un switch real.</p>
            </div>
            <div class="info-section">
                <h4>🖥️ Virtualización Completa:</h4>
                <ul>
                    <li><strong>Creado por software:</strong> El switch existe solo dentro del servidor</li>
                    <li><strong>Conecta VMs virtuales:</strong> Une máquinas que también son virtuales</li>
                    <li><strong>Red interna:</strong> Toda la comunicación ocurre dentro del servidor físico</li>
                    <li><strong>Aislamiento:</strong> Red completamente separada del exterior</li>
                </ul>
            </div>
            <div class="info-section">
                <h4>⚙️ Configuración MCP Adicional:</h4>
                <div class="mcp-config">
                    <div class="mcp-item">
                        <strong>🔧 MCP (Management Configuration Protocol)</strong>
                        <p>Protocolo necesario para gestión avanzada de VMs</p>
                    </div>
                    <div class="mcp-features">
                        <span>• Monitoreo en tiempo real</span>
                        <span>• Configuración remota de recursos</span>
                        <span>• Gestión centralizada de red virtual</span>
                        <span>• Políticas de seguridad automatizadas</span>
                    </div>
                </div>
            </div>
            <div class="info-section">
                <h4>📊 Estado Actual:</h4>
                <div class="network-info">
                    <span><strong>Subred Virtual:</strong> ${switchData.ip}</span>
                    <span><strong>VMs Conectadas:</strong> ${basicVMs.length}</span>
                    <span><strong>Tipo:</strong> Switch Virtual</span>
                    <span><strong>MCP:</strong> <span class="mcp-status">Requerido</span></span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('simulator3d').appendChild(infoPanel);
}

function closeConfigPanels() {
    const existingPanels = document.querySelectorAll('.vm-config-panel, .switch-info-panel');
    existingPanels.forEach(panel => panel.remove());
}

function saveVMConfig(vmName) {
    const name = document.getElementById('vmName').value;
    const ip = document.getElementById('vmIP').value;
    const status = document.getElementById('vmStatus').value;

    console.log(`Configuración guardada para ${vmName}:`, { name, ip, status });

    // Aquí podrías actualizar el objeto VM real
    const vm = basicVMs.find(vm => vm.userData.name === vmName);
    if (vm) {
        vm.userData.name = name;
        vm.userData.ip = ip;
        vm.userData.status = status;
    }

    closeConfigPanels();
    alert('Configuración guardada correctamente');
}

function restartVM(vmName) {
    console.log(`Reiniciando VM: ${vmName}`);
    alert(`Reiniciando ${vmName}...`);
    closeConfigPanels();
}

function setupHoverHandlers() {
    const canvas = basicRenderer.domElement;
    let hoveredObject = null;

    canvas.addEventListener('mousemove', (event) => {
        event.preventDefault();

        // Calcular posición del mouse
        const rect = canvas.getBoundingClientRect();
        basicMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        basicMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Configurar raycaster
        basicRaycaster.setFromCamera(basicMouse, basicCamera);

        // Buscar intersecciones
        const allObjects = [...basicVMs, basicSwitch];
        const intersects = basicRaycaster.intersectObjects(allObjects);

        // Remover hover anterior
        if (hoveredObject) {
            const previousLabel = hoveredObject.children.find(child =>
                child.userData && child.userData.isLabel
            );
            if (previousLabel) {
                // Restaurar opacidad normal
                previousLabel.material.opacity = 1.0;
            }
            hoveredObject = null;
            canvas.style.cursor = 'default';
        }

        // Aplicar nuevo hover
        if (intersects.length > 0) {
            hoveredObject = intersects[0].object;
            const label = hoveredObject.children.find(child =>
                child.userData && child.userData.isLabel
            );
            if (label) {
                // Hacer la etiqueta más brillante y grande en hover
                label.material.opacity = 1.0;
                const currentScale = label.scale.x;
                label.scale.set(currentScale * 1.3, currentScale * 0.65, 1);
            }
            canvas.style.cursor = 'pointer';

            // Mostrar tooltip
            showTooltip(event, hoveredObject.userData);
        } else {
            hideTooltip();
        }
    });
}

function showTooltip(event, userData) {
    let tooltip = document.getElementById('simulator-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'simulator-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            z-index: 10000;
            pointer-events: none;
            border: 1px solid rgba(79, 70, 229, 0.5);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-family: 'Inter', sans-serif;
        `;
        document.body.appendChild(tooltip);
    }

    tooltip.textContent = `${userData.name} - ${userData.ip}`;
    tooltip.style.left = (event.clientX + 10) + 'px';
    tooltip.style.top = (event.clientY - 10) + 'px';
    tooltip.style.display = 'block';
}

function hideTooltip() {
    const tooltip = document.getElementById('simulator-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

function setupManualControls() {
    const canvas = basicRenderer.domElement;
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;

    canvas.addEventListener('mousedown', (event) => {
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    canvas.addEventListener('mousemove', (event) => {
        if (!isMouseDown) return;

        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        // Rotar cámara alrededor del centro
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(basicCamera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        basicCamera.position.setFromSpherical(spherical);
        basicCamera.lookAt(0, 0, 0);

        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    canvas.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    canvas.addEventListener('wheel', (event) => {
        const zoom = event.deltaY > 0 ? 1.1 : 0.9;
        basicCamera.position.multiplyScalar(zoom);

        // Limitar zoom para mejor visibilidad
        const distance = basicCamera.position.length();
        if (distance < 15) basicCamera.position.normalize().multiplyScalar(15);
        if (distance > 100) basicCamera.position.normalize().multiplyScalar(100);
    });
}

function createBasicUI() {
    const container = document.getElementById('simulator3d');

    // Panel de configuración de VMs
    const vmConfigHTML = `
        <div class="vm-setup-panel">
            <h3><i class="fas fa-network-wired"></i> Configuración de Red</h3>
            <div class="vm-quantity-section">
                <label>¿Cuántas VMs deseas simular?</label>
                <select id="vmQuantity" onchange="updateVMQuantity()">
                    <option value="3" selected>3 VMs (Configuración actual)</option>
                    <option value="4">4 VMs</option>
                    <option value="5">5 VMs</option>
                    <option value="6">6 VMs</option>
                    <option value="7">7 VMs</option>
                    <option value="8">8 VMs (Máximo)</option>
                </select>
            </div>
            <div class="recommended-configs">
                <h4>Configuraciones Recomendadas:</h4>
                <div class="config-options">
                    <button class="config-option" onclick="applyRecommendedConfig('development')">
                        <i class="fas fa-code"></i> Desarrollo (4 VMs)
                    </button>
                    <button class="config-option" onclick="applyRecommendedConfig('testing')">
                        <i class="fas fa-vial"></i> Testing (6 VMs)
                    </button>
                    <button class="config-option" onclick="applyRecommendedConfig('production')">
                        <i class="fas fa-server"></i> Producción (8 VMs)
                    </button>
                </div>
            </div>
        </div>
    `;

    // Panel de controles
    const controlsHTML = `
        <div class="basic-controls-panel">
            <h3><i class="fas fa-cogs"></i> Controles</h3>
            <div class="basic-buttons">
                <button class="basic-btn" onclick="toggleBasicSimulation()">
                    <i class="fas fa-play"></i> <span id="basicToggleText">Iniciar</span>
                </button>
                <button class="basic-btn" onclick="resetBasicSimulation()">
                    <i class="fas fa-redo"></i> Reiniciar
                </button>
                <button class="basic-btn" onclick="changeBasicView()">
                    <i class="fas fa-eye"></i> Vista
                </button>
                <button class="basic-btn" onclick="showNetworkTopology()">
                    <i class="fas fa-project-diagram"></i> Topología
                </button>
            </div>
        </div>
    `;

    // Panel de estadísticas
    const statsHTML = `
        <div class="basic-stats-panel">
            <h3><i class="fas fa-chart-line"></i> Estadísticas</h3>
            <div class="basic-stats">
                <div class="basic-stat">
                    <span>Latencia:</span>
                    <span class="basic-value" id="basicLatency">0.5ms</span>
                </div>
                <div class="basic-stat">
                    <span>Ancho de Banda:</span>
                    <span class="basic-value" id="basicBandwidth">1.2 Gbps</span>
                </div>
                <div class="basic-stat">
                    <span>Paquetes/s:</span>
                    <span class="basic-value" id="basicPackets">1250</span>
                </div>
                <div class="basic-stat">
                    <span>Eficiencia:</span>
                    <span class="basic-value" id="basicEfficiency">95%</span>
                </div>
                <div class="basic-efficiency-bar">
                    <div class="basic-efficiency-fill" id="basicEfficiencyFill" style="width: 95%"></div>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', vmConfigHTML);
    container.insertAdjacentHTML('beforeend', controlsHTML);
    container.insertAdjacentHTML('beforeend', statsHTML);
}

function animateBasic() {
    if (!basicIsRunning) return;

    basicAnimationId = requestAnimationFrame(animateBasic);

    // Actualizar controles si existen
    if (basicControls) {
        basicControls.update();
    }

    // Animaciones básicas
    const time = Date.now() * 0.001;

    // Rotar VMs y actualizar etiquetas
    basicVMs.forEach((vm, index) => {
        vm.rotation.y += 0.01;
        vm.position.y = 2 + Math.sin(time + index * 2) * 0.1;

        // Actualizar escala de etiquetas basada en distancia de cámara
        updateLabelScale(vm);
    });

    // Actualizar etiqueta del switch también
    if (basicSwitch) {
        updateLabelScale(basicSwitch);
    }

    // Renderizar
    if (basicRenderer && basicScene && basicCamera) {
        basicRenderer.render(basicScene, basicCamera);
    }
}

function toggleBasicSimulation() {
    basicIsRunning = !basicIsRunning;
    const button = document.getElementById('basicToggleText');

    if (basicIsRunning) {
        button.textContent = 'Pausar';
        animateBasic();
    } else {
        button.textContent = 'Iniciar';
        if (basicAnimationId) {
            cancelAnimationFrame(basicAnimationId);
        }
    }
}

function resetBasicSimulation() {
    basicStats = {
        latency: 0.5,
        bandwidth: 1.2,
        packetsPerSecond: 1250,
        efficiency: 95
    };
    updateBasicStatsDisplay();
}

function changeBasicView() {
    if (basicCamera) {
        // Cambiar entre diferentes vistas predefinidas (expandidas para más VMs)
        const views = [
            { x: 0, y: 25, z: 40 },
            { x: 35, y: 20, z: 35 },
            { x: -25, y: 30, z: 25 },
            { x: 0, y: 50, z: 0 },
            { x: 40, y: 15, z: 0 }
        ];

        const currentView = Math.floor(Math.random() * views.length);
        const view = views[currentView];

        basicCamera.position.set(view.x, view.y, view.z);
        basicCamera.lookAt(0, 0, 0);
    }
}

function configureMCP(vmName) {
    alert(`Configuración MCP para ${vmName}:\n\n• Protocolo habilitado\n• Nivel: Avanzado\n• Monitoreo activo\n• Configuración remota disponible`);
    closeConfigPanels();
}

function updateVMQuantity() {
    const quantity = parseInt(document.getElementById('vmQuantity').value);
    recreateVMNetwork(quantity);
}

function applyRecommendedConfig(configType) {
    let quantity, message;

    switch(configType) {
        case 'development':
            quantity = 4;
            message = 'Configuración de Desarrollo aplicada:\n• 1 VM Web Server\n• 1 VM Database\n• 1 VM Testing\n• 1 VM Load Balancer';
            break;
        case 'testing':
            quantity = 6;
            message = 'Configuración de Testing aplicada:\n• 2 VMs Web Servers\n• 1 VM Database\n• 2 VMs Testing\n• 1 VM Monitoring';
            break;
        case 'production':
            quantity = 8;
            message = 'Configuración de Producción aplicada:\n• 3 VMs Web Servers\n• 2 VMs Database (Master/Slave)\n• 1 VM Load Balancer\n• 1 VM Monitoring\n• 1 VM Backup';
            break;
    }

    document.getElementById('vmQuantity').value = quantity;
    recreateVMNetwork(quantity);
    alert(message);
}

function showNetworkTopology() {
    alert(`Topología Actual:\n\n• ${basicVMs.length} VMs conectadas\n• 1 Switch Virtual Central\n• Layout en grafo circular\n• Protocolo MCP habilitado\n• Red aislada virtual`);
}

function recreateVMNetwork(quantity) {
    // Limpiar VMs existentes
    basicVMs.forEach(vm => {
        basicScene.remove(vm);
    });

    // Limpiar conexiones existentes
    basicConnections.forEach(connection => {
        basicScene.remove(connection);
    });

    basicVMs = [];
    basicConnections = [];

    // Crear nuevas VMs con layout en grafo
    createVMsInGraphLayout(quantity);

    console.log(`Red recreada con ${quantity} VMs`);
}

function createVMsInGraphLayout(quantity) {
    // Configuraciones de VMs expandidas con colores sólidos como la referencia
    const vmConfigs = [
        { name: "Ubuntu Desktop", ip: "192.168.1.7", color: 0x4a90e2, os: "Linux" },      // Azul
        { name: "Ubuntu Server", ip: "192.168.1.8", color: 0xe74c3c, os: "Linux" },       // Rojo
        { name: "Windows 7", ip: "192.168.1.6", color: 0x2ecc71, os: "Windows" },         // Verde
        { name: "CentOS Web", ip: "192.168.1.9", color: 0x9b59b6, os: "Linux" },          // Púrpura
        { name: "Windows Server", ip: "192.168.1.10", color: 0xf39c12, os: "Windows" },   // Amarillo
        { name: "Debian DB", ip: "192.168.1.11", color: 0x1abc9c, os: "Linux" },          // Turquesa
        { name: "Alpine Docker", ip: "192.168.1.12", color: 0xe67e22, os: "Linux" },      // Naranja
        { name: "FreeBSD", ip: "192.168.1.13", color: 0x34495e, os: "BSD" }               // Gris azulado
    ];

    // Layout espaciado como en la referencia (ajustado para laptops Y=1)
    const positions = [
        [-15, 1, -8],   // Posición 1
        [15, 1, 8],     // Posición 2
        [-8, 1, 12],    // Posición 3
        [12, 1, -5],    // Posición 4
        [-12, 1, 5],    // Posición 5
        [8, 1, -12],    // Posición 6
        [5, 1, 15],     // Posición 7
        [-5, 1, -15]    // Posición 8
    ];

    for (let i = 0; i < quantity; i++) {
        const config = vmConfigs[i];
        const position = positions[i] || [Math.random() * 20 - 10, 1, Math.random() * 20 - 10];

        // Crear VM como laptop
        const vm = createBasicLaptop();
        vm.position.set(position[0], position[1], position[2]);
        vm.castShadow = true;
        vm.receiveShadow = true;

        // Aplicar color a la pantalla
        const displayMaterial = new THREE.MeshLambertMaterial({
            color: config.color,
            emissive: config.color,
            emissiveIntensity: 0.3
        });
        vm.userData.display.material = displayMaterial;

        vm.userData = {
            ...vm.userData,
            name: config.name,
            ip: config.ip,
            type: 'vm',
            os: config.os,
            mcpEnabled: true,
            mcpLevel: 'advanced'
        };

        basicScene.add(vm);
        basicVMs.push(vm);

        // Etiqueta mejorada
        const label = createBasicLabel(`${config.name} VM\n${config.ip}`);
        label.position.set(0, 4.5, 0);
        vm.add(label);

        // Conexión al switch central
        const points = [
            new THREE.Vector3(position[0], position[1] - 1, position[2]),
            new THREE.Vector3(0, 2, 0)
        ];

        const connectionGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const connectionMaterial = new THREE.LineBasicMaterial({
            color: 0x00bfff,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        const line = new THREE.Line(connectionGeometry, connectionMaterial);
        basicScene.add(line);
        basicConnections.push(line);
    }
}

function startBasicStats() {
    setInterval(() => {
        if (basicIsRunning) {
            basicStats.latency = 0.3 + Math.random() * 0.4;
            basicStats.bandwidth = 1.0 + Math.random() * 0.4;
            basicStats.packetsPerSecond = 1000 + Math.floor(Math.random() * 500);
            basicStats.efficiency = 88 + Math.random() * 10;

            updateBasicStatsDisplay();
        }
    }, 1500);
}

function updateBasicStatsDisplay() {
    const elements = {
        latency: document.getElementById('basicLatency'),
        bandwidth: document.getElementById('basicBandwidth'),
        packets: document.getElementById('basicPackets'),
        efficiency: document.getElementById('basicEfficiency'),
        fill: document.getElementById('basicEfficiencyFill')
    };

    if (elements.latency) elements.latency.textContent = basicStats.latency.toFixed(1) + 'ms';
    if (elements.bandwidth) elements.bandwidth.textContent = basicStats.bandwidth.toFixed(1) + ' Gbps';
    if (elements.packets) elements.packets.textContent = basicStats.packetsPerSecond.toString();
    if (elements.efficiency) elements.efficiency.textContent = basicStats.efficiency.toFixed(0) + '%';

    if (elements.fill) {
        elements.fill.style.width = basicStats.efficiency + '%';

        if (basicStats.efficiency > 90) {
            elements.fill.style.background = 'linear-gradient(90deg, #00ff88, #44ff88)';
        } else if (basicStats.efficiency > 80) {
            elements.fill.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc44)';
        } else {
            elements.fill.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
        }
    }
}

function show2DAlternative() {
    console.log('Mostrando alternativa 2D...');
    const container = document.getElementById('simulator3d');

    container.innerHTML = `
        <div class="simulator-2d-fallback">
            <div class="fallback-header">
                <h3><i class="fas fa-network-wired"></i> Simulador de Red VirtualBox</h3>
                <p>Visualización 2D - Modo de compatibilidad</p>
            </div>

            <div class="network-diagram">
                <div class="vm-node vm-windows">
                    <div class="vm-icon">🪟</div>
                    <div class="vm-info">
                        <div class="vm-name">Windows 7</div>
                        <div class="vm-ip">192.168.1.6</div>
                    </div>
                </div>

                <div class="switch-node">
                    <div class="switch-icon">⚡</div>
                    <div class="switch-info">
                        <div class="switch-name">Switch Central</div>
                        <div class="switch-subnet">192.168.1.0/24</div>
                    </div>
                </div>

                <div class="vm-node vm-ubuntu">
                    <div class="vm-icon">🐧</div>
                    <div class="vm-info">
                        <div class="vm-name">Ubuntu Desktop</div>
                        <div class="vm-ip">192.168.1.7</div>
                    </div>
                </div>

                <div class="vm-node vm-server">
                    <div class="vm-icon">⚙️</div>
                    <div class="vm-info">
                        <div class="vm-name">Ubuntu Server</div>
                        <div class="vm-ip">192.168.1.8</div>
                    </div>
                </div>

                <svg class="connections" viewBox="0 0 400 300">
                    <line x1="100" y1="80" x2="200" y2="150" stroke="#ffff00" stroke-width="3"/>
                    <line x1="300" y1="80" x2="200" y2="150" stroke="#ffff00" stroke-width="3"/>
                    <line x1="200" y1="220" x2="200" y2="150" stroke="#ffff00" stroke-width="3"/>
                </svg>
            </div>

            <div class="fallback-stats">
                <div class="stat-item">
                    <span>Estado:</span>
                    <span class="stat-value online">Online</span>
                </div>
                <div class="stat-item">
                    <span>Latencia:</span>
                    <span class="stat-value" id="fallbackLatency">0.5ms</span>
                </div>
                <div class="stat-item">
                    <span>Conectividad:</span>
                    <span class="stat-value online">Activa</span>
                </div>
            </div>

            <div class="fallback-controls">
                <button class="fallback-btn" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Reintentar 3D
                </button>
                <button class="fallback-btn active">
                    <i class="fas fa-check"></i> Modo 2D Activo
                </button>
            </div>
        </div>
    `;

    // Iniciar estadísticas para el modo 2D
    setInterval(() => {
        const latencyEl = document.getElementById('fallbackLatency');
        if (latencyEl) {
            const latency = (0.3 + Math.random() * 0.4).toFixed(1);
            latencyEl.textContent = latency + 'ms';
        }
    }, 2000);
}

function onBasicWindowResize() {
    const container = document.getElementById('simulator3d');
    if (container && basicCamera && basicRenderer) {
        basicCamera.aspect = container.clientWidth / container.clientHeight;
        basicCamera.updateProjectionMatrix();
        basicRenderer.setSize(container.clientWidth, container.clientHeight);
    }
}

function disposeBasicSimulator() {
    console.log('Limpiando simulador básico...');

    basicIsRunning = false;

    if (basicAnimationId) {
        cancelAnimationFrame(basicAnimationId);
    }

    basicVMs = [];
    basicConnections = [];

    if (basicRenderer) {
        basicRenderer.dispose();
        basicRenderer = null;
    }

    basicScene = null;
    basicCamera = null;
    basicControls = null;
}

// Event listener para resize
window.addEventListener('resize', onBasicWindowResize);
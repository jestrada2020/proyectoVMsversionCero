// Simulador 3D Avanzado de Red VirtualBox
class NetworkSimulator3D {
    constructor(containerId) {
        this.containerId = containerId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.transformControls = null;
        this.gui = null;

        // Objetos de la red
        this.vms = [];
        this.switch = null;
        this.connections = [];
        this.dataPackets = [];

        // Estado de la simulación
        this.isSimulating = false;
        this.animationSpeed = 1;
        this.showPackets = true;

        // Configuración de la cámara
        this.cameraConfig = {
            position: { x: 0, y: 25, z: 40 },
            target: { x: 0, y: 0, z: 0 }
        };

        // Configuración de objetos
        this.objectConfig = {
            vmSize: 4,
            switchSize: 3,
            connectionOpacity: 0.8,
            packetSpeed: 0.02
        };

        this.init();
    }

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLights();
        this.createGUI();
        this.createNetworkObjects();
        this.setupEventListeners();
        this.animate();
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a202c);

        // Agregar niebla para profundidad
        this.scene.fog = new THREE.Fog(0x1a202c, 50, 200);
    }

    createCamera() {
        const container = document.getElementById(this.containerId);
        const aspect = container.clientWidth / container.clientHeight;

        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(
            this.cameraConfig.position.x,
            this.cameraConfig.position.y,
            this.cameraConfig.position.z
        );
    }

    createRenderer() {
        const container = document.getElementById(this.containerId);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            logarithmicDepthBuffer: true
        });

        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        container.appendChild(this.renderer.domElement);
    }

    createControls() {
        // Controles de órbita mejorados
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;

        // Límites de zoom y rotación
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minPolarAngle = 0;

        // Velocidad de los controles
        this.controls.rotateSpeed = 0.5;
        this.controls.zoomSpeed = 1.0;
        this.controls.panSpeed = 0.8;

        // Posición inicial del target
        this.controls.target.set(
            this.cameraConfig.target.x,
            this.cameraConfig.target.y,
            this.cameraConfig.target.z
        );

        // Controles de transformación para mover objetos
        this.transformControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.setMode('translate');
        this.transformControls.setSize(0.8);
        this.scene.add(this.transformControls);

        // Deshabilitar orbit controls cuando se usa transform
        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.controls.enabled = !event.value;
        });
    }

    createLights() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Luz direccional principal
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(20, 50, 20);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 4096;
        directionalLight.shadow.mapSize.height = 4096;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.bias = -0.0001;
        this.scene.add(directionalLight);

        // Luz de punto para efectos
        const pointLight = new THREE.PointLight(0x4f46e5, 0.8, 50);
        pointLight.position.set(0, 20, 0);
        pointLight.castShadow = true;
        this.scene.add(pointLight);

        // Luz de relleno
        const fillLight = new THREE.DirectionalLight(0x7c3aed, 0.3);
        fillLight.position.set(-20, 10, -20);
        this.scene.add(fillLight);
    }

    createGUI() {
        if (typeof dat === 'undefined') {
            console.warn('dat.GUI no está disponible');
            return;
        }

        this.gui = new dat.GUI({ autoPlace: false });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '10px';
        this.gui.domElement.style.right = '10px';
        this.gui.domElement.style.zIndex = '1000';

        const container = document.getElementById(this.containerId);
        container.appendChild(this.gui.domElement);

        // Carpeta de cámara
        const cameraFolder = this.gui.addFolder('Cámara');
        cameraFolder.add(this.cameraConfig.position, 'x', -50, 50).onChange(() => this.updateCamera());
        cameraFolder.add(this.cameraConfig.position, 'y', 5, 60).onChange(() => this.updateCamera());
        cameraFolder.add(this.cameraConfig.position, 'z', -50, 50).onChange(() => this.updateCamera());
        cameraFolder.open();

        // Carpeta de simulación
        const simFolder = this.gui.addFolder('Simulación');
        simFolder.add(this, 'isSimulating').name('Simular Tráfico');
        simFolder.add(this, 'animationSpeed', 0.1, 3).name('Velocidad');
        simFolder.add(this, 'showPackets').name('Mostrar Paquetes');
        simFolder.add(this, 'resetCamera').name('Reset Cámara');
        simFolder.add(this, 'resetSimulation').name('Reset Simulación');
        simFolder.open();

        // Carpeta de objetos
        const objectFolder = this.gui.addFolder('Objetos');
        objectFolder.add(this.objectConfig, 'vmSize', 2, 10).onChange(() => this.updateObjectSizes());
        objectFolder.add(this.objectConfig, 'switchSize', 1, 8).onChange(() => this.updateObjectSizes());
        objectFolder.add(this.objectConfig, 'connectionOpacity', 0, 1).onChange(() => this.updateConnections());
        objectFolder.add(this.objectConfig, 'packetSpeed', 0.01, 0.1);
        objectFolder.open();
    }

    createNetworkObjects() {
        this.createFloor();
        this.createSwitch();
        this.createVMs();
        this.createConnections();
        this.createLabels();
    }

    createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshLambertMaterial({
            color: 0x2d3748,
            transparent: true,
            opacity: 0.8
        });

        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2;
        floor.receiveShadow = true;
        floor.name = 'floor';
        this.scene.add(floor);

        // Grid
        const gridHelper = new THREE.GridHelper(80, 40, 0x4f46e5, 0x4f46e5);
        gridHelper.position.y = -1.9;
        gridHelper.material.opacity = 0.6;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }

    createSwitch() {
        const switchGeometry = new THREE.CylinderGeometry(
            this.objectConfig.switchSize,
            this.objectConfig.switchSize,
            this.objectConfig.switchSize / 2,
            16
        );

        const switchMaterial = new THREE.MeshPhongMaterial({
            color: 0xff4444,
            emissive: 0x440000,
            emissiveIntensity: 0.3,
            shininess: 100
        });

        this.switch = new THREE.Mesh(switchGeometry, switchMaterial);
        this.switch.position.set(0, this.objectConfig.switchSize / 4, 0);
        this.switch.castShadow = true;
        this.switch.receiveShadow = true;
        this.switch.name = 'switch';
        this.switch.userData = { type: 'switch', name: 'Switch Central' };

        this.scene.add(this.switch);

        // LEDs del switch
        for (let i = 0; i < 8; i++) {
            const ledGeometry = new THREE.SphereGeometry(0.15);
            const ledMaterial = new THREE.MeshPhongMaterial({
                color: 0x00ff00,
                emissive: 0x004400,
                emissiveIntensity: 0.5
            });

            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            const angle = (i / 8) * Math.PI * 2;
            led.position.set(
                Math.cos(angle) * (this.objectConfig.switchSize * 0.8),
                this.objectConfig.switchSize / 4,
                Math.sin(angle) * (this.objectConfig.switchSize * 0.8)
            );

            this.switch.add(led);
        }
    }

    createVMs() {
        const vmConfigs = [
            {
                name: "Windows 7",
                ip: "192.168.1.6",
                color: 0xff0000,
                emissive: 0x440000,
                position: [-15, this.objectConfig.vmSize / 2, -10],
                icon: '🪟'
            },
            {
                name: "Ubuntu Desktop",
                ip: "192.168.1.7",
                color: 0x00ff00,
                emissive: 0x004400,
                position: [15, this.objectConfig.vmSize / 2, -10],
                icon: '🐧'
            },
            {
                name: "Ubuntu Server",
                ip: "192.168.1.8",
                color: 0x0066ff,
                emissive: 0x000044,
                position: [0, this.objectConfig.vmSize / 2, 15],
                icon: '⚙️'
            }
        ];

        vmConfigs.forEach((config) => {
            // Crear laptop para el simulador avanzado
            const laptop = this.createAdvancedLaptop();
            laptop.position.set(config.position[0], config.position[1], config.position[2]);
            laptop.castShadow = true;
            laptop.receiveShadow = true;
            laptop.name = config.name.replace(' ', '_').toLowerCase();

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
                type: 'vm',
                name: config.name,
                ip: config.ip,
                originalColor: config.color,
                originalPosition: laptop.position.clone()
            };

            this.scene.add(laptop);
            this.vms.push(laptop);

            // Luz de estado en la base del laptop
            const statusLight = new THREE.PointLight(config.color, 1, 10);
            statusLight.position.set(0, 0.5, 1.5);
            laptop.add(statusLight);

            // Antena/Puerto de red en el lateral
            const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5);
            const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.set(-2.5, 1.5, 0);
            antenna.rotation.z = Math.PI / 2;
            laptop.add(antenna);
        });
    }

    createAdvancedLaptop() {
        const laptop = new THREE.Group();

        // Base de la laptop
        const baseGeometry = new THREE.BoxGeometry(4.5, 0.3, 3.5);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x2d3748,
            shininess: 60
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        base.receiveShadow = true;
        laptop.add(base);

        // Pantalla
        const screenGeometry = new THREE.BoxGeometry(4.5, 3.2, 0.25);
        const screenMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            shininess: 90
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 1.9, -1.6);
        screen.rotation.x = Math.PI * 0.15;
        screen.castShadow = true;
        screen.receiveShadow = true;
        laptop.add(screen);

        // Pantalla activa (display)
        const displayGeometry = new THREE.BoxGeometry(4, 2.8, 0.08);
        const displayMesh = new THREE.Mesh(displayGeometry);
        displayMesh.position.set(0, 1.9, -1.5);
        displayMesh.rotation.x = Math.PI * 0.15;
        laptop.add(displayMesh);

        laptop.userData.display = displayMesh;
        return laptop;
    }

    createConnections() {
        this.connections = [];

        this.vms.forEach((vm) => {
            // Crear línea de conexión
            const points = [
                vm.position.clone(),
                this.switch.position.clone()
            ];

            // Ajustar altura de los puntos
            points[0].y = 0.5;
            points[1].y = 0.5;

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: this.objectConfig.connectionOpacity,
                linewidth: 5
            });

            const connection = new THREE.Line(geometry, material);
            connection.name = `connection_${vm.name}`;
            connection.userData = {
                type: 'connection',
                from: vm.userData.name,
                to: 'Switch'
            };

            this.scene.add(connection);
            this.connections.push(connection);

            // Crear tubo para conexión más visible
            const curve = new THREE.CatmullRomCurve3(points);
            const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.1, 8, false);
            const tubeMaterial = new THREE.MeshPhongMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.6,
                emissive: 0x444400,
                emissiveIntensity: 0.2
            });

            const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
            tube.name = `tube_${vm.name}`;
            this.scene.add(tube);
            this.connections.push(tube);
        });
    }

    createLabels() {
        this.vms.forEach((vm) => {
            const label = this.createTextSprite(
                vm.userData.name + '\\n' + vm.userData.ip,
                '#ffffff',
                '#000000'
            );
            label.position.set(0, this.objectConfig.vmSize + 2, 0);
            vm.add(label);
        });

        // Label para switch
        const switchLabel = this.createTextSprite(
            'Switch Central\\n192.168.1.0/24',
            '#ffffff',
            '#000000'
        );
        switchLabel.position.set(0, this.objectConfig.switchSize + 2, 0);
        this.switch.add(switchLabel);
    }

    createTextSprite(text, textColor = '#ffffff', backgroundColor = '#000000') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;

        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = textColor;
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        const lines = text.split('\\n');
        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, canvas.height / 2 + (index - lines.length / 2 + 0.5) * 40);
        });

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(8, 4, 1);

        return sprite;
    }

    updateCamera() {
        this.camera.position.set(
            this.cameraConfig.position.x,
            this.cameraConfig.position.y,
            this.cameraConfig.position.z
        );
        this.controls.update();
    }

    resetCamera() {
        this.cameraConfig.position = { x: 0, y: 25, z: 40 };
        this.cameraConfig.target = { x: 0, y: 0, z: 0 };
        this.updateCamera();
        this.controls.target.set(0, 0, 0);
    }

    resetSimulation() {
        // Limpiar paquetes
        this.dataPackets.forEach(packet => {
            this.scene.remove(packet);
        });
        this.dataPackets = [];

        // Resetear posiciones de VMs
        this.vms.forEach(vm => {
            vm.position.copy(vm.userData.originalPosition);
        });
    }

    updateObjectSizes() {
        // Actualizar tamaño del switch
        this.scene.remove(this.switch);
        this.createSwitch();

        // Actualizar tamaño de VMs (ahora laptops, el tamaño no afecta mucho)
        this.vms.forEach((vm, index) => {
            const config = vm.userData;
            this.scene.remove(vm);

            // Crear nuevo laptop
            const newVM = this.createAdvancedLaptop();
            newVM.position.copy(config.originalPosition);
            newVM.castShadow = true;
            newVM.receiveShadow = true;
            newVM.name = vm.name;

            // Aplicar color a la pantalla
            const displayMaterial = new THREE.MeshPhongMaterial({
                color: config.originalColor,
                emissive: config.originalColor,
                emissiveIntensity: 0.3,
                shininess: 100
            });
            newVM.userData.display.material = displayMaterial;

            newVM.userData = {
                ...newVM.userData,
                ...config
            };

            // Luz de estado
            const statusLight = new THREE.PointLight(config.originalColor, 1, 10);
            statusLight.position.set(0, 0.5, 1.5);
            newVM.add(statusLight);

            this.scene.add(newVM);
            this.vms[index] = newVM;
        });

        this.updateConnections();
    }

    updateConnections() {
        // Remover conexiones existentes
        this.connections.forEach(connection => {
            this.scene.remove(connection);
        });

        // Recrear conexiones
        this.createConnections();
    }

    generateNetworkTraffic() {
        if (!this.isSimulating || !this.showPackets) return;

        if (Math.random() < 0.05) {
            const sourceIndex = Math.floor(Math.random() * this.vms.length);
            let targetIndex;
            do {
                targetIndex = Math.floor(Math.random() * this.vms.length);
            } while (targetIndex === sourceIndex);

            this.createDataPacket(this.vms[sourceIndex], this.vms[targetIndex]);
        }
    }

    createDataPacket(source, target) {
        const packetGeometry = new THREE.SphereGeometry(0.3);
        const packetMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x004444,
            emissiveIntensity: 0.5,
            shininess: 100
        });

        const packet = new THREE.Mesh(packetGeometry, packetMaterial);
        packet.position.copy(source.position);
        packet.position.y += 2;

        packet.userData = {
            type: 'packet',
            source: source,
            target: target,
            progress: 0,
            speed: this.objectConfig.packetSpeed * this.animationSpeed
        };

        this.scene.add(packet);
        this.dataPackets.push(packet);

        // Remover después de 10 segundos
        setTimeout(() => {
            this.scene.remove(packet);
            const index = this.dataPackets.indexOf(packet);
            if (index > -1) {
                this.dataPackets.splice(index, 1);
            }
        }, 10000);
    }

    updateDataPackets() {
        this.dataPackets.forEach((packet, index) => {
            const userData = packet.userData;
            userData.progress += userData.speed;

            if (userData.progress >= 1) {
                this.scene.remove(packet);
                this.dataPackets.splice(index, 1);
                return;
            }

            // Interpolación entre source y target pasando por el switch
            let currentPos;
            if (userData.progress < 0.5) {
                // Primera mitad: source -> switch
                const t = userData.progress * 2;
                currentPos = new THREE.Vector3().lerpVectors(
                    userData.source.position,
                    this.switch.position,
                    t
                );
            } else {
                // Segunda mitad: switch -> target
                const t = (userData.progress - 0.5) * 2;
                currentPos = new THREE.Vector3().lerpVectors(
                    this.switch.position,
                    userData.target.position,
                    t
                );
            }

            currentPos.y += 2 + Math.sin(userData.progress * Math.PI * 4) * 0.5;
            packet.position.copy(currentPos);

            // Rotación del paquete
            packet.rotation.x += 0.1;
            packet.rotation.y += 0.05;
        });
    }

    setupEventListeners() {
        // Redimensionar
        window.addEventListener('resize', () => this.onWindowResize());

        // Interacción con objetos
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        this.renderer.domElement.addEventListener('click', (event) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects([...this.vms, this.switch]);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                this.selectObject(object);
            }
        });
    }

    selectObject(object) {
        // Deseleccionar objeto anterior
        this.transformControls.detach();

        // Seleccionar nuevo objeto
        this.transformControls.attach(object);

        console.log('Objeto seleccionado:', object.userData);
    }

    onWindowResize() {
        const container = document.getElementById(this.containerId);
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Actualizar controles
        this.controls.update();

        // Generar tráfico de red
        this.generateNetworkTraffic();

        // Actualizar paquetes de datos
        this.updateDataPackets();

        // Animaciones de objetos
        const time = Date.now() * 0.001;

        // Rotar switch suavemente
        if (this.switch) {
            this.switch.rotation.y += 0.005 * this.animationSpeed;
        }

        // Pulsar luces de estado
        this.vms.forEach((vm, index) => {
            const phase = time + index * 2;
            vm.children.forEach(child => {
                if (child instanceof THREE.PointLight) {
                    child.intensity = 0.5 + Math.sin(phase) * 0.3;
                }
            });
        });

        // Renderizar escena
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        if (this.gui) {
            this.gui.destroy();
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        // Limpiar recursos
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
    }
}

// Variable global para el simulador
let networkSimulator = null;

// Función para inicializar el simulador avanzado
function initAdvancedSimulator() {
    const container = document.getElementById('simulator3d');
    if (!container) {
        console.error('Contenedor del simulador no encontrado');
        return;
    }

    // Limpiar contenedor
    container.innerHTML = '';

    // Crear simulador
    try {
        networkSimulator = new NetworkSimulator3D('simulator3d');
        console.log('Simulador avanzado inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar simulador avanzado:', error);

        // Fallback al simulador básico
        if (typeof initSimulator === 'function') {
            initSimulator();
        }
    }
}

// Función para limpiar el simulador
function disposeAdvancedSimulator() {
    if (networkSimulator) {
        networkSimulator.dispose();
        networkSimulator = null;
    }
}
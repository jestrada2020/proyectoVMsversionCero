// Acciones del simulador - controles y funciones principales

function startPingSimulation() {
    if (networkFailure) {
        addLogEntry('[ERROR] No se puede realizar PING - Fallo de red activo', 'error');
        return;
    }

    const sourceVM = vms[0];
    const targetVM = vms[1];
    
    addLogEntry(`[PING] Enviando paquete desde ${sourceVM.userData.ip} a ${targetVM.userData.ip}`, 'info');
    
    // Crear paquete visual mejorado tipo ping
    createPacketAnimation(sourceVM.position, targetVM.position, 'ping');
    
    packetsSent++;
    setTimeout(() => {
        packetsReceived++;
        addLogEntry(`[PING] Respuesta recibida de ${targetVM.userData.ip} - RTT: ${(Math.random() * 5 + 1).toFixed(1)}ms`, 'success');
        
        // Crear paquete de respuesta
        createPacketAnimation(targetVM.position, sourceVM.position, 'ping');
    }, 1500);
}

function resetNetwork() {
    packetsSent = 0;
    packetsReceived = 0;
    networkFailure = false;
    
    // Reset VM colors
    vms.forEach(vm => {
        vm.material.opacity = 0.8;
        vm.material.color.setHex(vm.userData.originalColor);
    });

    addLogEntry('[SYSTEM] Red reiniciada - Todos los parámetros restaurados', 'info');
}

function toggleWireframe() {
    scene.traverse((object) => {
        if (object.isMesh) {
            object.material.wireframe = !object.material.wireframe;
        }
    });
}

function autoRotate() {
    isAutoRotating = !isAutoRotating;
}

function simulateNetworkFailure() {
    networkFailure = true;
    vms.forEach(vm => {
        vm.material.color.setHex(0xef4444);
        vm.material.emissive.setHex(0xef4444);
        vm.material.emissiveIntensity = 0.3;
        vm.material.opacity = 0.6;
        
        // Crear paquetes de error
        if (Math.random() > 0.5) {
            const errorPos = vm.position.clone();
            errorPos.y += 2;
            createPacketAnimation(errorPos, errorPos.clone().add(new THREE.Vector3(Math.random() * 4 - 2, 1, Math.random() * 4 - 2)), 'error');
        }
    });
    addLogEntry('[ERROR] Simulando fallo de red - Conectividad perdida', 'error');
}

function simulateHighLatency() {
    addLogEntry('[WARNING] Simulando alta latencia - RTT > 100ms', 'warning');
    // Update latency display
    document.getElementById('avgLatency').textContent = (Math.random() * 200 + 100).toFixed(1) + 'ms';
}

function simulatePacketLoss() {
    addLogEntry('[WARNING] Simulando pérdida de paquetes - 15% packet loss', 'warning');
    document.getElementById('packetLoss').textContent = '15%';
}

function restoreNetwork() {
    networkFailure = false;
    vms.forEach((vm, index) => {
        const colors = [0x0078d4, 0xe95420, 0x77216f];
        vm.material.color.setHex(colors[index]);
        vm.material.emissive.setHex(colors[index]);
        vm.material.emissiveIntensity = vm.userData.type === 'server' ? 0.1 : 0.08;
        vm.material.opacity = vm.userData.type === 'server' ? 0.9 : 0.85;
    });
    
    // Actualizar UI si existe
    const avgLatencyEl = document.getElementById('avgLatency');
    const packetLossEl = document.getElementById('packetLoss');
    if (avgLatencyEl) avgLatencyEl.textContent = '2.3ms';
    if (packetLossEl) packetLossEl.textContent = '0%';
    
    addLogEntry('[SUCCESS] Red restaurada - Conectividad completa', 'success');
}

function changeTopology(newTopology) {
    topology = newTopology;
    addLogEntry(`[CONFIG] Cambiando topología a: ${topology}`, 'info');
    
    // Recrear conexiones según la nueva topología
    createNetworkConnections();
    
    addLogEntry(`[TOPOLOGY] ${topology.toUpperCase()} configurada exitosamente`, 'success');
}

function addNewVM() {
    if (vms.length >= 6) {
        addLogEntry('[ERROR] Máximo número de VMs alcanzado (6)', 'error');
        return;
    }
    
    const vmNames = ['Kali Linux', 'CentOS', 'Debian', 'Fedora'];
    const vmColors = [0x1a1a2e, 0x932279, 0xa80030, 0x29487d];
    const vmTypes = ['desktop', 'server', 'desktop', 'desktop'];
    
    const index = vms.length - 3;
    const name = vmNames[index] || `VM ${vms.length + 1}`;
    const color = vmColors[index] || Math.floor(Math.random() * 0xffffff);
    const vmType = vmTypes[index] || 'desktop';
    
    // Generar posición aleatoria
    const angle = (vms.length * Math.PI * 2) / 6;
    const radius = 12;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Función para crear laptop en las acciones
    function createActionLaptop(isServer) {
        const laptop = new THREE.Group();

        const size = isServer ? 1.2 : 1.0;

        // Base de la laptop
        const baseGeometry = new THREE.BoxGeometry(5 * size, 0.3 * size, 3.8 * size);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x2d3748,
            shininess: 50
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        base.receiveShadow = true;
        laptop.add(base);

        // Pantalla
        const screenGeometry = new THREE.BoxGeometry(5 * size, 3.5 * size, 0.25 * size);
        const screenMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            shininess: 80
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 2.1 * size, -1.7 * size);
        screen.rotation.x = Math.PI * 0.15;
        screen.castShadow = true;
        screen.receiveShadow = true;
        laptop.add(screen);

        // Pantalla activa (display)
        const displayGeometry = new THREE.BoxGeometry(4.5 * size, 3 * size, 0.08 * size);
        const displayMesh = new THREE.Mesh(displayGeometry);
        displayMesh.position.set(0, 2.1 * size, -1.6 * size);
        displayMesh.rotation.x = Math.PI * 0.15;
        laptop.add(displayMesh);

        laptop.userData.display = displayMesh;
        return laptop;
    }

    // Crear laptop en lugar de caja
    const vm = createActionLaptop(vmType === 'server');
    vm.position.set(x, 2, z);
    vm.castShadow = true;
    vm.receiveShadow = true;

    // Aplicar color a la pantalla
    const displayMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: vmType === 'server' ? 0.4 : 0.3,
        shininess: 100,
        transparent: true,
        opacity: 0.95
    });
    vm.userData.display.material = displayMaterial;
    vm.userData = { 
        name: name, 
        ip: `192.168.1.${vms.length + 6}`, 
        originalColor: color,
        type: vmType,
        details: {
            os: `${name} Latest`,
            cpu: "2 cores @ 2.0GHz",
            ram: "2GB DDR4",
            disk: "20GB SSD",
            status: "Running"
        },
        icon: "fas fa-desktop",
        index: vms.length,
        animationPhase: vms.length * Math.PI / 3
    };
    
    scene.add(vm);
    vms.push(vm);

    // Luz de estado en la base del laptop
    const size = vmType === 'server' ? 1.2 : 1.0;
    const statusLightGeometry = new THREE.SphereGeometry(0.08 * size);
    const statusLightMaterial = new THREE.MeshPhongMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.6
    });
    const statusLight = new THREE.Mesh(statusLightGeometry, statusLightMaterial);
    statusLight.position.set(-2 * size, 0.2 * size, 1.5 * size);
    vm.add(statusLight);

    // Segunda luz de estado
    const statusLight2 = new THREE.Mesh(statusLightGeometry, statusLightMaterial.clone());
    statusLight2.position.set(2 * size, 0.2 * size, 1.5 * size);
    vm.add(statusLight2);

    // Indicador de selección adaptado al laptop
    const indicatorSize = vmType === 'server' ? [6, 4.5, 5] : [5, 4, 4];
    const indicatorGeometry = new THREE.BoxGeometry(...indicatorSize);
    const indicatorMaterial = new THREE.MeshBasicMaterial({
        color: 0x4f46e5,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide
    });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.set(0, 1.5, 0);
    indicator.userData.isSelectionIndicator = true;
    vm.add(indicator);
    
    // Etiqueta
    createTextLabel(name + "\n" + vm.userData.ip, x, 5, z);
    
    // Conectar a la red
    createNetworkConnections();
    
    addLogEntry(`[VM] Nueva máquina virtual añadida: ${name} (${vm.userData.ip})`, 'success');
    
    // Actualizar contador de VMs si existe
    const activeVMsEl = document.getElementById('activeVMs');
    if (activeVMsEl) activeVMsEl.textContent = vms.length;
    
    // Generar tráfico de bienvenida
    setTimeout(() => {
        vms.slice(0, 3).forEach(existingVM => {
            createPacketAnimation(existingVM.position, vm.position, 'data');
        });
    }, 1000);
}

function captureNetworkTraffic() {
    addLogEntry('[CAPTURE] Iniciando captura de tráfico de red...', 'info');
    
    setTimeout(() => {
        const protocols = ['ICMP', 'TCP', 'UDP', 'ARP', 'DNS', 'HTTP', 'HTTPS'];
        const packetTypes = ['data', 'ping', 'data', 'data', 'ping'];
        
        // Generar paquetes de tráfico simulados
        for (let i = 0; i < 25; i++) {
            setTimeout(() => {
                const protocol = protocols[Math.floor(Math.random() * protocols.length)];
                const sourceVM = vms[Math.floor(Math.random() * vms.length)];
                const destVM = vms[Math.floor(Math.random() * vms.length)];
                
                if (sourceVM !== destVM) {
                    const packetType = packetTypes[Math.floor(Math.random() * packetTypes.length)];
                    
                    addLogEntry(`[CAPTURE] ${protocol} packet: ${sourceVM.userData.ip} → ${destVM.userData.ip}`, 'info');
                    
                    // Crear animación de paquete con tipo específico
                    createPacketAnimation(sourceVM.position, destVM.position, packetType);
                    
                    // Simular respuesta para algunos protocolos
                    if (['ICMP', 'DNS', 'HTTP'].includes(protocol) && Math.random() > 0.3) {
                        setTimeout(() => {
                            createPacketAnimation(destVM.position, sourceVM.position, packetType);
                            addLogEntry(`[CAPTURE] ${protocol} response: ${destVM.userData.ip} → ${sourceVM.userData.ip}`, 'info');
                        }, 500 + Math.random() * 1000);
                    }
                }
            }, i * 200);
        }
        
        setTimeout(() => {
            addLogEntry('[CAPTURE] Captura completada - 25+ paquetes analizados', 'success');
        }, 7000);
    }, 1000);
}

function exportNetworkConfig() {
    addLogEntry('[EXPORT] Exportando configuración de red...', 'info');
    
    const config = {
        topology: topology,
        subnet: document.getElementById('subnetInput').value,
        vms: vms.map(vm => ({
            name: vm.userData.name,
            ip: vm.userData.ip,
            position: {
                x: vm.position.x,
                y: vm.position.y,
                z: vm.position.z
            },
            details: vm.userData.details
        })),
        timestamp: new Date().toISOString()
    };
    
    const configJson = JSON.stringify(config, null, 2);
    
    // Crear un blob para descargar
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Crear un enlace temporal para descargar
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtualbox-network-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Liberar el objeto URL
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
    
    addLogEntry('[EXPORT] Configuración exportada correctamente', 'success');
}

function resetSimulator() {
    // Pausar simulación
    isSimulating = false;
    
    // Eliminar todos los paquetes activos
    packets.forEach(packet => {
        scene.remove(packet);
    });
    packets = [];
    
    // Eliminar todas las VMs excepto las 3 originales
    while (vms.length > 3) {
        const vm = vms.pop();
        scene.remove(vm);
        
        // Eliminar etiquetas asociadas
        scene.children = scene.children.filter(child => {
            if (child instanceof THREE.Sprite) {
                const labelPos = child.position;
                const vmPos = vm.position;
                
                // Verificar si la etiqueta pertenece a esta VM
                const distance = Math.sqrt(
                    Math.pow(labelPos.x - vmPos.x, 2) +
                    Math.pow(labelPos.y - (vmPos.y + 2.5), 2) +
                    Math.pow(labelPos.z - vmPos.z, 2)
                );
                
                return distance > 1; // Mantener etiquetas que no estén cerca de esta VM
            }
            return true;
        });
    }
    
    // Restaurar configuración original
    topology = 'star';
    createNetworkConnections();
    resetNetwork();
    
    // Reiniciar contadores
    packetsSent = 0;
    packetsReceived = 0;
    
    // Restaurar valores originales si existen
    const subnetInput = document.getElementById('subnetInput');
    const activeVMsEl = document.getElementById('activeVMs');
    if (subnetInput) subnetInput.value = '192.168.1.0/24';
    if (activeVMsEl) activeVMsEl.textContent = '3';
    
    addLogEntry('[RESET] Simulador reiniciado a configuración inicial', 'info');
    
    // Reiniciar simulación automáticamente
    setTimeout(() => {
        startNetworkSimulation();
    }, 2000);
}
// Utilidades para el simulador

function setupControlListeners() {
    // Speed control
    const speedSlider = document.getElementById('animationSpeed');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            animationSpeed = parseFloat(e.target.value);
        });
    }

    // Subnet input
    const subnetInput = document.getElementById('subnetInput');
    if (subnetInput) {
        subnetInput.addEventListener('change', (e) => {
            updateSubnetConfig(e.target.value);
        });
    }

    // Sliders de recursos
    setupResourceSliders();
}

function setupResourceSliders() {
    const sliders = [
        { id: 'windowsCPU', valueId: 'windowsCPUValue', suffix: '%' },
        { id: 'ubuntuRAM', valueId: 'ubuntuRAMValue', suffix: '%' },
        { id: 'serverNetwork', valueId: 'serverNetworkValue', suffix: '%' }
    ];

    sliders.forEach(slider => {
        const element = document.getElementById(slider.id);
        const valueElement = document.getElementById(slider.valueId);
        
        if (element && valueElement) {
            element.addEventListener('input', (e) => {
                valueElement.textContent = e.target.value + slider.suffix;
            });
        }
    });
}

function setupVMInteraction() {
    const container = document.getElementById('simulator3d');
    if (!container) return;

    // Eventos de mouse
    container.addEventListener('mousedown', onMouseDown, false);
    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('click', onMouseClick, false);
    
    // Eventos para tooltips
    container.addEventListener('mousemove', onMouseHover, false);
    container.addEventListener('mouseleave', hideTooltip, false);
    
    // Crear tooltip element
    createTooltipElement();
}

function onMouseDown(event) {
    event.preventDefault();
    
    const container = document.getElementById('simulator3d');
    const rect = container.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(vms);

    if (intersects.length > 0) {
        if (controls) controls.enabled = false;
        isDragging = true;
        selectedVM = intersects[0].object;
        
        // Configurar el plano de arrastre
        const normal = camera.position.clone().sub(selectedVM.position).normalize();
        dragPlane.setFromNormalAndCoplanarPoint(normal, selectedVM.position);
        
        // Calcular offset
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersection);
        dragOffset.subVectors(selectedVM.position, intersection);
        
        // Mostrar indicador de selección
        showSelectionIndicator(selectedVM);
        
        // Cambiar cursor
        container.classList.add('dragging');
    }
}

function onMouseMove(event) {
    if (!isDragging || !selectedVM) return;
    
    event.preventDefault();
    
    const container = document.getElementById('simulator3d');
    const rect = container.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    const intersection = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        selectedVM.position.copy(intersection.add(dragOffset));
        
        // Mantener la VM en el plano del suelo (Y = 2)
        selectedVM.position.y = 2;
        
        // Actualizar conexiones de red
        createNetworkConnections();
        
        // Actualizar etiqueta
        updateVMLabel(selectedVM);
    }
}

// Nueva función para manejar hover de mouse sin interferir con arrastre
function onMouseHover(event) {
    if (isDragging) return; // No mostrar tooltips durante arrastre
    
    const container = document.getElementById('simulator3d');
    const rect = container.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(vms);

    if (intersects.length > 0) {
        const vm = intersects[0].object;
        showTooltip(vm, event.clientX, event.clientY);
        
        // Highlight effect
        vm.material.emissiveIntensity = 0.3;
        
        // Cambiar cursor
        container.style.cursor = 'pointer';
    } else {
        hideTooltip();
        
        // Restore normal emissive intensity for all VMs
        vms.forEach(vm => {
            vm.material.emissiveIntensity = vm.userData.type === 'server' ? 0.1 : 0.08;
        });
        
        // Restaurar cursor
        container.style.cursor = 'default';
    }
}

function onMouseUp(event) {
    if (isDragging) {
        if (controls) controls.enabled = true;
        isDragging = false;
        
        if (selectedVM) {
            // Ocultar indicador de selección
            hideSelectionIndicator(selectedVM);
            
            // Registrar movimiento
            addLogEntry(`[VM] ${selectedVM.userData.name} movida a nueva posición`, 'info');
            
            selectedVM = null;
        }
        
        // Restaurar cursor
        const container = document.getElementById('simulator3d');
        container.classList.remove('dragging');
    }
}

function onMouseClick(event) {
    if (isDragging) return; // Ignorar clics durante el arrastre
    
    event.preventDefault();
    
    const container = document.getElementById('simulator3d');
    const rect = container.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(vms);

    if (intersects.length > 0) {
        const vm = intersects[0].object;
        showVMConfig(vm);
    }
}

function showSelectionIndicator(vm) {
    const indicator = vm.children.find(child => 
        child.userData.isSelectionIndicator
    );
    if (indicator) {
        indicator.material.opacity = 0.5;
    }
}

function hideSelectionIndicator(vm) {
    const indicator = vm.children.find(child => 
        child.userData.isSelectionIndicator
    );
    if (indicator) {
        indicator.material.opacity = 0;
    }
}

function updateVMLabel(vm) {
    // Actualizar posición de la etiqueta
    const labelPosition = new THREE.Vector3(
        vm.position.x,
        vm.position.y + 2.5,
        vm.position.z
    );
    
    // Buscar y actualizar la etiqueta existente
    scene.traverse((child) => {
        if (child instanceof THREE.Sprite) {
            const distance = child.position.distanceTo(labelPosition);
            if (distance < 1) {
                child.position.copy(labelPosition);
            }
        }
    });
}

function showVMConfig(vm) {
    const data = vm.userData;
    
    // Preparar datos de configuración
    vmConfigData = {
        name: data.name,
        ip: data.ip,
        details: data.details,
        position: vm.position.clone(),
        vm: vm
    };
    
    // Actualizar título
    document.getElementById('vmConfigTitle').innerHTML = 
        `<i class="${data.icon}"></i> ${data.name}`;
    
    // Actualizar contenido
    const content = document.getElementById('vmConfigContent');
    content.innerHTML = `
        <div class="vm-config-item">
            <span class="vm-config-label">Sistema Operativo</span>
            <div class="vm-config-value">${data.details.os}</div>
        </div>
        <div class="vm-config-item">
            <span class="vm-config-label">Dirección IP</span>
            <div class="vm-config-value">${data.ip}</div>
        </div>
        <div class="vm-config-item">
            <span class="vm-config-label">CPU</span>
            <div class="vm-config-value">${data.details.cpu}</div>
        </div>
        <div class="vm-config-item">
            <span class="vm-config-label">Memoria RAM</span>
            <div class="vm-config-value">${data.details.ram}</div>
        </div>
        <div class="vm-config-item">
            <span class="vm-config-label">Disco Duro</span>
            <div class="vm-config-value">${data.details.disk}</div>
        </div>
        <div class="vm-config-item">
            <span class="vm-config-label">Estado</span>
            <div class="vm-config-value">${data.details.status}</div>
        </div>
        <div class="vm-config-item">
            <span class="vm-config-label">Posición 3D</span>
            <div class="vm-config-value">
                X: ${vm.position.x.toFixed(1)}, 
                Y: ${vm.position.y.toFixed(1)}, 
                Z: ${vm.position.z.toFixed(1)}
            </div>
        </div>
        <div class="vm-config-item">
            <span class="vm-config-label">Tipo</span>
            <div class="vm-config-value">${data.type || 'desktop'}</div>
        </div>
        <div class="vm-config-item">
            <span class="vm-config-label">Índice</span>
            <div class="vm-config-value">#${data.index + 1}</div>
        </div>
    `;
    
    // Mostrar panel
    document.getElementById('vmConfigOverlay').classList.add('active');
    document.getElementById('vmConfigPanel').classList.add('active');
    
    // Registrar evento
    addLogEntry(`[VM] Mostrando configuración de ${data.name}`, 'info');
}

function closeVMConfig() {
    document.getElementById('vmConfigOverlay').classList.remove('active');
    document.getElementById('vmConfigPanel').classList.remove('active');
}

function saveVMConfig() {
    if (vmConfigData.vm) {
        addLogEntry(`[VM] Configuración guardada para ${vmConfigData.name}`, 'success');
        closeVMConfig();
    }
}

// Esta función se ha movido a simulador.js con mejoras
// Se mantiene aquí una versión de compatibilidad
function createLegacyPacketAnimation(start, end) {
    const packetGeometry = new THREE.SphereGeometry(0.15);
    const packetMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xfbbf24,
        emissive: 0xfbbf24,
        emissiveIntensity: 0.4
    });
    
    const packet = new THREE.Mesh(packetGeometry, packetMaterial);
    packet.position.copy(start);
    scene.add(packet);

    // Usar el nuevo sistema de paquetes si está disponible
    if (typeof createPacketAnimation === 'function') {
        scene.remove(packet); // Remover este paquete temporal
        createPacketAnimation(start, end, 'data');
        return;
    }

    // Animación del paquete (versión legacy)
    const duration = 2000 / animationSpeed;
    const startTime = Date.now();

    function animatePacket() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
            packet.position.lerpVectors(start, end, progress);
            packet.position.y += Math.sin(progress * Math.PI * 4) * 0.2 + 1;
            packet.rotation.x += 0.15;
            packet.rotation.y += 0.1;
            requestAnimationFrame(animatePacket);
        } else {
            scene.remove(packet);
        }
    }

    animatePacket();
}

// Funciones para tooltips interactivos
function createTooltipElement() {
    if (document.getElementById('vm-tooltip')) return; // Ya existe
    
    const tooltip = document.createElement('div');
    tooltip.id = 'vm-tooltip';
    tooltip.className = 'vm-tooltip';
    tooltip.style.cssText = `
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-family: Inter, sans-serif;
        pointer-events: none;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        border: 1px solid rgba(79, 70, 229, 0.5);
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        max-width: 250px;
        line-height: 1.4;
    `;
    document.body.appendChild(tooltip);
}

function showTooltip(vm, x, y) {
    const tooltip = document.getElementById('vm-tooltip');
    if (!tooltip) return;
    
    const data = vm.userData;
    
    // Calcular estadísticas en tiempo real
    const uptimeHours = Math.floor(Math.random() * 72) + 1;
    const cpuUsage = Math.floor(Math.random() * 60) + 10;
    const ramUsage = Math.floor(Math.random() * 80) + 20;
    const networkSpeed = (Math.random() * 100 + 50).toFixed(1);
    
    tooltip.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 8px; font-weight: 600;">
            <i class="${data.icon}" style="margin-right: 8px; color: #4f46e5;"></i>
            ${data.name}
        </div>
        <div style="margin-bottom: 6px;"><strong>IP:</strong> ${data.ip}</div>
        <div style="margin-bottom: 6px;"><strong>Estado:</strong> <span style="color: #10b981;">${data.details.status}</span></div>
        <div style="margin-bottom: 6px;"><strong>CPU:</strong> ${cpuUsage}% (${data.details.cpu})</div>
        <div style="margin-bottom: 6px;"><strong>RAM:</strong> ${ramUsage}% (${data.details.ram})</div>
        <div style="margin-bottom: 6px;"><strong>Red:</strong> ${networkSpeed} Mbps</div>
        <div style="margin-bottom: 6px;"><strong>Tiempo activo:</strong> ${uptimeHours}h</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
            Click para configuración • Arrastra para mover
        </div>
    `;
    
    // Posicionar tooltip
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let tooltipX = x + 15;
    let tooltipY = y - 10;
    
    // Ajustar si se sale de la pantalla
    if (tooltipX + rect.width > viewportWidth) {
        tooltipX = x - rect.width - 15;
    }
    if (tooltipY + rect.height > viewportHeight) {
        tooltipY = y - rect.height - 10;
    }
    
    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';
    tooltip.style.opacity = '1';
}

function hideTooltip() {
    const tooltip = document.getElementById('vm-tooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
    }
}

function updateSubnetConfig(subnet) {
    addLogEntry(`[CONFIG] Subnet actualizada: ${subnet}`, 'info');
    
    // Extraer información de la subred
    const [network, cidr] = subnet.split('/');
    const networkParts = network.split('.');
    
    if (networkParts.length === 4 && cidr) {
        // Actualizar IPs de las VMs dinámicamente
        const baseIP = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}`;
        const newIPs = [
            `${baseIP}.6`,   // Windows 7
            `${baseIP}.7`,   // Ubuntu Desktop  
            `${baseIP}.8`    // Ubuntu Server
        ];
        
        // Actualizar etiquetas de las VMs
        vms.forEach((vm, index) => {
            if (index < newIPs.length) {
                vm.userData.ip = newIPs[index];
                addLogEntry(`[VM] ${vm.userData.name} nueva IP: ${newIPs[index]}`, 'success');
            }
        });
        
        // Actualizar estadísticas de red
        addLogEntry(`[SUBNET] Red configurada: ${subnet} - ${Math.pow(2, 32-parseInt(cidr))} direcciones disponibles`, 'info');
        
        // Simular reinicio de servicios de red
        setTimeout(() => {
            addLogEntry('[SERVICES] Servicios de red reiniciados - DHCP, DNS, ARP actualizado', 'success');
        }, 2000);
    } else {
        addLogEntry(`[ERROR] Formato de subnet inválido: ${subnet}. Use formato x.x.x.x/xx`, 'error');
    }
}

// Función para resaltar conexiones relacionadas con una VM
function highlightVMConnections(vm) {
    // Esta función puede expandirse para resaltar las conexiones de red
    // relacionadas con la VM específica cuando se hace hover
    scene.traverse((child) => {
        if (child instanceof THREE.Line) {
            // Lógica para determinar si la línea está conectada a esta VM
            child.material.opacity = 0.3; // Atenuar otras conexiones
        }
    });
}

function restoreConnectionsOpacity() {
    scene.traverse((child) => {
        if (child instanceof THREE.Line) {
            child.material.opacity = 0.6; // Restaurar opacidad original
        }
    });
}
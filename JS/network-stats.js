// Funciones para estadísticas y monitoreo de red

function updateNetworkStats() {
    // Calcular estadísticas realistas
    const baseLatency = networkFailure ? 0 : (Math.random() * 3 + 1);
    const jitter = Math.random() * 0.5;
    const finalLatency = networkFailure ? '∞' : (baseLatency + jitter).toFixed(1) + 'ms';
    
    // Simular pérdida de paquetes basada en condiciones de red
    let packetLossPercent = 0;
    if (networkFailure) {
        packetLossPercent = 100;
    } else if (packetsSent > 0) {
        packetLossPercent = Math.max(0, ((packetsSent - packetsReceived) / packetsSent * 100));
        // Agregar pérdida simulada ocasional
        if (Math.random() > 0.95) {
            packetLossPercent += Math.random() * 2;
        }
    }

    // Calcular ancho de banda dinámico
    let bandwidth = '1 Gbps';
    if (networkFailure) {
        bandwidth = '0 Mbps';
    } else {
        const load = Math.random();
        if (load > 0.8) {
            bandwidth = (800 + Math.random() * 200).toFixed(0) + ' Mbps';
        } else if (load > 0.6) {
            bandwidth = (600 + Math.random() * 200).toFixed(0) + ' Mbps';
        } else {
            bandwidth = '1 Gbps';
        }
    }

    const stats = {
        activeVMs: networkFailure ? '0' : vms.length,
        avgLatency: finalLatency,
        packetsSent: packetsSent,
        packetsReceived: packetsReceived,
        packetLoss: packetLossPercent.toFixed(1) + '%',
        bandwidth: bandwidth
    };

    // Actualizar elementos de la interfaz
    Object.keys(stats).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = stats[key];
            
            // Cambiar color según el estado
            if (key === 'packetLoss') {
                const loss = parseFloat(stats[key]);
                if (loss > 10) {
                    element.style.color = '#ef4444'; // Rojo
                } else if (loss > 5) {
                    element.style.color = '#f59e0b'; // Amarillo
                } else {
                    element.style.color = '#10b981'; // Verde
                }
            }
            
            if (key === 'avgLatency' && !networkFailure) {
                const latency = parseFloat(stats[key]);
                if (latency > 10) {
                    element.style.color = '#ef4444';
                } else if (latency > 5) {
                    element.style.color = '#f59e0b';
                } else {
                    element.style.color = '#10b981';
                }
            }
        }
    });

    // Actualizar sliders de recursos dinámicamente
    updateResourceMonitoring();
}

function updateResourceMonitoring() {
    const resourceElements = [
        { id: 'windowsCPU', valueId: 'windowsCPUValue' },
        { id: 'ubuntuRAM', valueId: 'ubuntuRAMValue' },
        { id: 'serverNetwork', valueId: 'serverNetworkValue' }
    ];

    resourceElements.forEach((resource, index) => {
        const element = document.getElementById(resource.id);
        const valueElement = document.getElementById(resource.valueId);
        
        if (element && valueElement && networkFailure === false) {
            // Simular uso variable de recursos
            let newValue;
            if (Math.random() > 0.9) { // Cambio ocasional
                switch(index) {
                    case 0: // Windows CPU
                        newValue = Math.floor(Math.random() * 40 + 5);
                        break;
                    case 1: // Ubuntu RAM  
                        newValue = Math.floor(Math.random() * 30 + 25);
                        break;
                    case 2: // Server Network
                        newValue = Math.floor(Math.random() * 20 + 3);
                        break;
                }
                
                element.value = newValue;
                valueElement.textContent = newValue + '%';
                
                // Log de cambios significativos
                if (newValue > 80) {
                    const vmNames = ['Windows 7', 'Ubuntu Desktop', 'Ubuntu Server'];
                    const resourceTypes = ['CPU', 'RAM', 'Network'];
                    addLogEntry(`[WARNING] ${vmNames[index]} - Alto uso de ${resourceTypes[index]}: ${newValue}%`, 'warning');
                }
            }
        } else if (networkFailure && element && valueElement) {
            // Durante fallo de red, recursos se vuelven inaccesibles
            element.value = 0;
            valueElement.textContent = 'N/A';
        }
    });
}

function addLogEntry(message, type = 'info') {
    const log = document.getElementById('networkLog');
    if (log) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            success: '#10b981'
        };
        
        entry.style.color = colors[type] || colors.info;
        entry.textContent = `[${timestamp}] ${message}`;
        
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;

        // Limitar número de entradas
        while (log.children.length > 50) {
            log.removeChild(log.firstChild);
        }
    }
}

function startNetworkLogging() {
    // Generar logs periódicos realistas
    setInterval(() => {
        if (!networkFailure && Math.random() > 0.7) {
            const events = [
                '[ARP] Actualizando tabla ARP - MAC aa:bb:cc:dd:ee:ff resolved for 192.168.1.6',
                '[DHCP] Lease renewal successful - IP 192.168.1.7 válida por 24h',
                '[ICMP] Echo request/reply completed - RTT 2.3ms',
                '[TCP] SSH connection established 192.168.1.8:22',
                '[NETWORK] Heartbeat - All 3 VMs responsive',
                '[NETPLAN] Configuration applied successfully on Ubuntu Server',
                '[FIREWALL] ICMP rule active - PING enabled on Windows 7',
                '[INTERFACE] enp0s8 link up - 1000Mbps full-duplex',
                '[ROUTING] Default gateway via 10.0.2.2 (NAT adapter)',
                '[DNS] Resolving google.com via 8.8.8.8 - Success'
            ];
            
            const event = events[Math.floor(Math.random() * events.length)];
            addLogEntry(event, 'info');
        }
    }, 3000);

    // Logs periódicos de estadísticas
    setInterval(() => {
        if (!networkFailure) {
            const vmStats = [
                `[STATS] VM Windows 7: CPU ${Math.floor(Math.random() * 30 + 10)}%, RAM ${Math.floor(Math.random() * 20 + 40)}%`,
                `[STATS] VM Ubuntu Desktop: CPU ${Math.floor(Math.random() * 25 + 5)}%, RAM ${Math.floor(Math.random() * 25 + 30)}%`,
                `[STATS] VM Ubuntu Server: CPU ${Math.floor(Math.random() * 15 + 5)}%, RAM ${Math.floor(Math.random() * 20 + 20)}%`
            ];
            
            const stat = vmStats[Math.floor(Math.random() * vmStats.length)];
            addLogEntry(stat, 'info');
        }
    }, 8000);

    // Simulación de tráfico de red
    setInterval(() => {
        if (!networkFailure && Math.random() > 0.8) {
            const traffic = [
                '[TRAFFIC] HTTP request: 192.168.1.7 → 192.168.1.8:80',
                '[TRAFFIC] SSH session: 192.168.1.6 → 192.168.1.8:22',
                '[TRAFFIC] File transfer: 192.168.1.8 → 192.168.1.7 (1.2MB/s)',
                '[TRAFFIC] Database query: 192.168.1.7 → 192.168.1.8:3306',
                '[TRAFFIC] Backup sync: 192.168.1.6 → 192.168.1.8 (15.3MB)',
            ];
            
            const event = traffic[Math.floor(Math.random() * traffic.length)];
            addLogEntry(event, 'success');
            
            // Actualizar contador de paquetes
            if (Math.random() > 0.5) {
                packetsSent += Math.floor(Math.random() * 10 + 1);
                packetsReceived += Math.floor(Math.random() * 8 + 1);
            }
        }
    }, 6000);
}

// Funciones adicionales para análisis avanzado
function getNetworkHealth() {
    if (networkFailure) return 0;
    
    const latencyScore = Math.max(0, 100 - (statsHistory.latency.slice(-10).reduce((a, b) => a + b, 0) / 10) * 10);
    const lossScore = Math.max(0, 100 - (statsHistory.packetLoss.slice(-10).reduce((a, b) => a + b, 0) / 10) * 5);
    const efficiencyScore = networkEfficiency;
    
    return Math.floor((latencyScore + lossScore + efficiencyScore) / 3);
}

function predictNetworkTrend() {
    if (statsHistory.latency.length < 10) return 'stable';
    
    const recentLatency = statsHistory.latency.slice(-5);
    const olderLatency = statsHistory.latency.slice(-10, -5);
    
    const recentAvg = recentLatency.reduce((a, b) => a + b, 0) / recentLatency.length;
    const olderAvg = olderLatency.reduce((a, b) => a + b, 0) / olderLatency.length;
    
    const change = recentAvg - olderAvg;
    
    if (change > 1) return 'degrading';
    if (change < -0.5) return 'improving';
    return 'stable';
}

function exportNetworkReport() {
    const report = {
        timestamp: new Date().toISOString(),
        session: {
            duration: formatUptime(Date.now() - sessionStartTime),
            dataTransferred: formatDataSize(totalDataTransferred),
            efficiency: networkEfficiency + '%'
        },
        network: {
            topology: topology,
            activeVMs: vms.length,
            health: getNetworkHealth() + '%',
            trend: predictNetworkTrend()
        },
        statistics: {
            packetsSent: packetsSent,
            packetsReceived: packetsReceived,
            packetLoss: ((packetsSent - packetsReceived) / Math.max(1, packetsSent) * 100).toFixed(1) + '%',
            averageLatency: (statsHistory.latency.reduce((a, b) => a + b, 0) / statsHistory.latency.length).toFixed(1) + 'ms'
        },
        vms: vms.map(vm => ({
            name: vm.userData.name,
            ip: vm.userData.ip,
            type: vm.userData.type,
            position: {
                x: vm.position.x.toFixed(2),
                y: vm.position.y.toFixed(2),
                z: vm.position.z.toFixed(2)
            }
        }))
    };
    
    return JSON.stringify(report, null, 2);
}
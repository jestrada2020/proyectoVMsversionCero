// Funciones para diagnóstico de red

function executePing() {
    const target = document.getElementById('pingTarget').value || '192.168.1.6';
    
    addDiagnosticOutput(`> ping -c 4 ${target}`);
    
    // Validar IP objetivo
    if (!isValidIP(target)) {
        addDiagnosticOutput(`ping: ${target}: Name or service not known`);
        return;
    }

    // Verificar si la IP está en rango de la red interna
    const targetVM = vms.find(vm => vm.userData.ip === target);
    
    setTimeout(() => {
        if (networkFailure) {
            addDiagnosticOutput(`PING ${target}: Network is unreachable`);
            addDiagnosticOutput(`ping: sendmsg: Network is unreachable`);
        } else if (!targetVM && !target.startsWith('192.168.1.')) {
            addDiagnosticOutput(`PING ${target}: Destination Host Unreachable`);
            addDiagnosticOutput(`From 192.168.1.7: Destination Host Unreachable`);
        } else {
            // Simulación realista de ping
            addDiagnosticOutput(`PING ${target} (${target}): 56(84) bytes of data.`);
            
            let transmitted = 0, received = 0;
            let minTime = Infinity, maxTime = 0, totalTime = 0;
            
            const pingInterval = setInterval(() => {
                transmitted++;
                const time = (Math.random() * 3 + 0.5).toFixed(1);
                const ttl = 64 - Math.floor(Math.random() * 5);
                
                // Simular pérdida ocasional de paquetes
                if (Math.random() > 0.05) { // 95% éxito
                    received++;
                    addDiagnosticOutput(`64 bytes from ${target}: icmp_seq=${transmitted} ttl=${ttl} time=${time} ms`);
                    
                    const timeNum = parseFloat(time);
                    minTime = Math.min(minTime, timeNum);
                    maxTime = Math.max(maxTime, timeNum);
                    totalTime += timeNum;
                    
                    packetsSent++;
                    packetsReceived++;
                } else {
                    addDiagnosticOutput(`Request timeout for icmp_seq ${transmitted}`);
                    packetsSent++;
                }
                
                if (transmitted >= 4) {
                    clearInterval(pingInterval);
                    
                    // Estadísticas finales
                    addDiagnosticOutput(`--- ${target} ping statistics ---`);
                    const lossPercent = ((transmitted - received) / transmitted * 100).toFixed(1);
                    addDiagnosticOutput(`${transmitted} packets transmitted, ${received} received, ${lossPercent}% packet loss, time ${transmitted * 1000}ms`);
                    
                    if (received > 0) {
                        const avgTime = (totalTime / received).toFixed(3);
                        addDiagnosticOutput(`rtt min/avg/max/mdev = ${minTime.toFixed(3)}/${avgTime}/${maxTime.toFixed(3)}/0.000 ms`);
                    }
                    
                    // Crear animación visual si es exitoso
                    if (received > 0 && targetVM) {
                        createPingAnimation(target);
                    }
                }
            }, 1000);
        }
    }, 500);
}

function createPingAnimation(targetIP) {
    const sourceVM = vms[1]; // Ubuntu Desktop como fuente
    const targetVM = vms.find(vm => vm.userData.ip === targetIP);
    
    if (sourceVM && targetVM) {
        // Crear múltiples paquetes PING
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                createPacketAnimation(sourceVM.position, targetVM.position);
            }, i * 200);
        }
        
        addLogEntry(`[PING] Secuencia de paquetes enviada desde ${sourceVM.userData.ip} a ${targetIP}`, 'info');
    }
}

function isValidIP(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    return parts.every(part => {
        const num = parseInt(part);
        return num >= 0 && num <= 255 && part === num.toString();
    });
}

function executeTraceroute() {
    const target = document.getElementById('pingTarget').value || '192.168.1.6';
    addDiagnosticOutput(`> traceroute ${target}`);
    
    if (!isValidIP(target)) {
        addDiagnosticOutput(`traceroute: ${target}: Name or service not known`);
        return;
    }
    
    setTimeout(() => {
        if (networkFailure) {
            addDiagnosticOutput(`traceroute: Network is unreachable`);
            return;
        }
        
        addDiagnosticOutput(`traceroute to ${target} (${target}), 30 hops max, 60 byte packets`);
        
        // Simulación de saltos realista
        if (target.startsWith('192.168.1.')) {
            // Red interna - solo 1 salto
            const time1 = (Math.random() * 2 + 0.5).toFixed(3);
            const time2 = (Math.random() * 2 + 0.5).toFixed(3);
            const time3 = (Math.random() * 2 + 0.5).toFixed(3);
            addDiagnosticOutput(`1  ${target} (${target})  ${time1} ms  ${time2} ms  ${time3} ms`);
        } else if (target === '8.8.8.8' || target === '1.1.1.1') {
            // DNS público - múltiples saltos simulados
            addDiagnosticOutput(`1  192.168.1.1 (192.168.1.1)  1.234 ms  1.156 ms  1.089 ms`);
            addDiagnosticOutput(`2  10.0.2.2 (10.0.2.2)  2.456 ms  2.387 ms  2.321 ms`);
            addDiagnosticOutput(`3  192.168.0.1 (192.168.0.1)  5.123 ms  4.987 ms  5.234 ms`);
            addDiagnosticOutput(`4  * * *`);
            addDiagnosticOutput(`5  ${target} (${target})  12.456 ms  12.234 ms  12.123 ms`);
        } else {
            // Destino desconocido
            addDiagnosticOutput(`1  192.168.1.1 (192.168.1.1)  1.234 ms  1.156 ms  1.089 ms`);
            addDiagnosticOutput(`2  * * *`);
            addDiagnosticOutput(`3  * * *`);
            addDiagnosticOutput(`traceroute: destination unreachable`);
        }
        
    }, 1500);
}

function executeNetstat() {
    const commands = [
        { cmd: 'netstat -i', desc: 'Interface statistics' },
        { cmd: 'netstat -rn', desc: 'Routing table' },
        { cmd: 'netstat -tuln', desc: 'Active connections' },
        { cmd: 'ip addr show', desc: 'Interface addresses' }
    ];
    
    const randomCmd = commands[Math.floor(Math.random() * commands.length)];
    addDiagnosticOutput(`> ${randomCmd.cmd}`);
    
    setTimeout(() => {
        if (networkFailure) {
            addDiagnosticOutput(`${randomCmd.cmd}: Network subsystem unavailable`);
            return;
        }
        
        switch(randomCmd.cmd) {
            case 'netstat -i':
                addDiagnosticOutput(`Kernel Interface table`);
                addDiagnosticOutput(`Iface   MTU    RX-OK RX-ERR RX-DRP RX-OVR    TX-OK TX-ERR TX-DRP TX-OVR Flg`);
                
                const rxPackets = Math.floor(Math.random() * 50000 + 10000);
                const txPackets = Math.floor(Math.random() * 40000 + 8000);
                const rxErrors = Math.floor(Math.random() * 5);
                const txErrors = Math.floor(Math.random() * 3);
                
                addDiagnosticOutput(`enp0s3  1500   ${rxPackets.toLocaleString()}    ${rxErrors}      0 0      ${txPackets.toLocaleString()}    ${txErrors}      0      0 BMRU`);
                
                const intRxPackets = Math.floor(Math.random() * 15000 + 3000);
                const intTxPackets = Math.floor(Math.random() * 12000 + 2000);
                addDiagnosticOutput(`enp0s8  1500   ${intRxPackets.toLocaleString()}      0      0 0      ${intTxPackets.toLocaleString()}      0      0      0 BMRU`);
                
                addDiagnosticOutput(`lo     65536    2468      0      0 0       2468      0      0      0 LRU`);
                break;
                
            case 'netstat -rn':
                addDiagnosticOutput(`Kernel IP routing table`);
                addDiagnosticOutput(`Destination     Gateway         Genmask         Flags   MSS Window  irtt Iface`);
                addDiagnosticOutput(`0.0.0.0         10.0.2.2        0.0.0.0         UG        0 0          0 enp0s3`);
                addDiagnosticOutput(`10.0.2.0        0.0.0.0         255.255.255.0   U         0 0          0 enp0s3`);
                addDiagnosticOutput(`192.168.1.0     0.0.0.0         255.255.255.0   U         0 0          0 enp0s8`);
                break;
                
            case 'netstat -tuln':
                addDiagnosticOutput(`Active Internet connections (only servers)`);
                addDiagnosticOutput(`Proto Recv-Q Send-Q Local Address           Foreign Address         State`);
                addDiagnosticOutput(`tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN`);
                addDiagnosticOutput(`tcp        0      0 127.0.0.1:631           0.0.0.0:*               LISTEN`);
                addDiagnosticOutput(`tcp6       0      0 :::22                   :::*                    LISTEN`);
                addDiagnosticOutput(`udp        0      0 0.0.0.0:68              0.0.0.0:*`);
                addDiagnosticOutput(`udp        0      0 127.0.0.1:323           0.0.0.0:*`);
                break;
                
            case 'ip addr show':
                addDiagnosticOutput(`1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN`);
                addDiagnosticOutput(`    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00`);
                addDiagnosticOutput(`    inet 127.0.0.1/8 scope host lo`);
                addDiagnosticOutput(`2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP`);
                addDiagnosticOutput(`    link/ether 08:00:27:12:34:56 brd ff:ff:ff:ff:ff:ff`);
                addDiagnosticOutput(`    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic enp0s3`);
                addDiagnosticOutput(`3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP`);
                addDiagnosticOutput(`    link/ether 08:00:27:78:9a:bc brd ff:ff:ff:ff:ff:ff`);
                addDiagnosticOutput(`    inet 192.168.1.7/24 scope global enp0s8`);
                break;
        }
    }, 1200);
}

function addDiagnosticOutput(text) {
    const output = document.getElementById('diagnosticOutput');
    if (output) {
        output.innerHTML += '\n' + text;
        output.scrollTop = output.scrollHeight;
    }
}
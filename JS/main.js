// Variables globales para el modal
let simulatorModalOpen = false;

// Funciones para el modal del simulador
function openSimulatorModal() {
    const modal = document.getElementById('simulatorModal');
    if (modal) {
        modal.classList.add('active');
        simulatorModalOpen = true;

        // Inicializar el simulador básico en el modal después de un pequeño delay
        setTimeout(() => {
            if (typeof initBasicSimulator === 'function') {
                console.log('Inicializando simulador básico en modal...');
                try {
                    initBasicSimulator();
                    console.log('Simulador básico inicializado correctamente en modal');
                } catch (error) {
                    console.error('Error al inicializar simulador básico en modal:', error);
                    // Fallback a otros simuladores
                    if (typeof initSimpleSimulator === 'function') {
                        initSimpleSimulator();
                    } else if (typeof initProfessionalSimulator === 'function') {
                        initProfessionalSimulator();
                    } else if (typeof initAdvancedSimulator === 'function') {
                        initAdvancedSimulator();
                    } else if (typeof initSimulator === 'function') {
                        initSimulator();
                    }
                }
            }
        }, 300);

        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
    }
}

function closeSimulatorModal() {
    const modal = document.getElementById('simulatorModal');
    if (modal) {
        modal.classList.remove('active');
        simulatorModalOpen = false;

        // Limpiar el simulador básico si existe
        if (typeof disposeBasicSimulator === 'function') {
            disposeBasicSimulator();
        }

        // Limpiar el simulador simple si existe
        if (typeof disposeSimpleSimulator === 'function') {
            disposeSimpleSimulator();
        }

        // Limpiar el simulador profesional si existe
        if (typeof disposeProfessionalSimulator === 'function') {
            disposeProfessionalSimulator();
        }

        // Limpiar el simulador avanzado si existe
        if (typeof disposeAdvancedSimulator === 'function') {
            disposeAdvancedSimulator();
        }

        const container = document.getElementById('simulator3d');
        if (container) {
            container.innerHTML = '';
        }

        // Restaurar scroll del body
        document.body.style.overflow = 'auto';
    }
}

// Main application functionality
function showSection(sectionId) {
    console.log('showSection called with:', sectionId);

    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        console.log('Removing active from:', section.id);
    });

    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Adding active to:', sectionId);
        console.log('Section display style:', window.getComputedStyle(targetSection).display);
    } else {
        console.error('Section not found:', sectionId);
    }

    // Actualizar navegación
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
        console.log('Navigation updated for:', event.target.textContent);
    }

    // Ajustar padding del main-content para la sección de agentes efectivos
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        if (sectionId === 'agentes-efectivos') {
            mainContent.style.paddingTop = '0';
            mainContent.style.paddingBottom = '1rem';
        } else {
            mainContent.style.paddingTop = '4rem';
            mainContent.style.paddingBottom = '1rem';
        }
    }

    // NO inicializar automáticamente el simulador, solo cuando se abra el modal
}

// Función mejorada para mostrar secciones (sin depender del event global)
function showSectionSafe(sectionId, clickedElement) {
    console.log('showSectionSafe called with:', sectionId);

    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        console.log('Removing active from:', section.id);
    });

    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Adding active to:', sectionId);
        console.log('Section display style:', window.getComputedStyle(targetSection).display);
    } else {
        console.error('Section not found:', sectionId);
    }

    // Actualizar navegación
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    if (clickedElement) {
        clickedElement.classList.add('active');
        console.log('Navigation updated for:', clickedElement.textContent.trim());
    }
}

// Función para toggle del menú móvil
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-open');
}

// Función para toggle del sidebar principal
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.querySelector('.sidebar-toggle-btn');
    const toggleIcon = toggleBtn.querySelector('i');
    const toggleText = toggleBtn.querySelector('.toggle-text');

    // Toggle classes
    sidebar.classList.toggle('hidden');
    mainContent.classList.toggle('sidebar-hidden');

    // Cambiar el ícono y texto según el estado
    if (sidebar.classList.contains('hidden')) {
        toggleIcon.className = 'fas fa-chevron-right';
        toggleBtn.title = 'Mostrar menú lateral';
        if (toggleText) toggleText.textContent = 'Mostrar';
    } else {
        toggleIcon.className = 'fas fa-bars';
        toggleBtn.title = 'Ocultar menú lateral';
        if (toggleText) toggleText.textContent = 'Menú';
    }
}

// Función para copiar al portapapeles
function copyToClipboard(button) {
    const codeBlock = button.parentNode;
    const text = codeBlock.textContent.replace('Copiar', '').trim();
    navigator.clipboard.writeText(text).then(() => {
        button.textContent = 'Copiado!';
        setTimeout(() => {
            button.textContent = 'Copiar';
        }, 2000);
    });
}

// Cerrar modal con tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && simulatorModalOpen) {
        closeSimulatorModal();
    }
});

// Cerrar modal al hacer clic fuera del contenido
document.addEventListener('click', function(event) {
    const modal = document.getElementById('simulatorModal');
    if (simulatorModalOpen && event.target === modal) {
        closeSimulatorModal();
    }
});

// Funciones para las pestañas de configuración
function showConfigTab(tabId, clickedElement) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.config-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remover clase active de todas las pestañas
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Mostrar el contenido seleccionado
    const selectedContent = document.getElementById(`config-${tabId}`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }

    // Activar la pestaña seleccionada
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Auto-mostrar simulador si la URL tiene el hash
    if (window.location.hash === '#simulador') {
        showSection('simulador');
    }

    // Debug: mostrar cuando las librerías están listas
    console.log('Three.js disponible:', typeof THREE !== 'undefined');
    console.log('OrbitControls disponible:', typeof THREE.OrbitControls !== 'undefined');
});
const box = document.getElementById('expandableBox'); // Obtiene el elemento del DOM con el ID 'expandableBox'.
const closeBtn = document.getElementById('closeBtn'); // Obtiene el botón de cierre del DOM.
const chatbotContainer = document.getElementById('chatbot-container'); // Obtiene el contenedor del chatbot.
const sendBtn = document.getElementById('sendBtn'); // Obtiene el botón de envío del DOM.
const chatbox = document.getElementById('chatbot-history'); // Obtiene el historial de chat del DOM.
const userInput = document.getElementById('userInput'); // Obtiene el campo de entrada de usuario.
const inputContainer = document.querySelector('.input-container'); // Obtiene el contenedor del área de entrada.
const stopBtn = document.getElementById('stopBtn'); // Obtiene el botón de detener del DOM.

let typingTimeout; // Variable para almacenar el temporizador de escritura.
let hasWelcomed = false; // Bandera para verificar si se ha enviado el mensaje de bienvenida.

function adjustHeight() { // Función para ajustar la altura del campo de entrada.
    this.style.height = '50px'; // Establece una altura mínima.
    this.style.height = `${Math.min(this.scrollHeight, 100)}px`; // Ajusta la altura según el contenido, con un máximo de 100px.
}

box.addEventListener('click', function(e) { // Agrega un evento de clic a la caja del chatbot.
    if (e.target !== closeBtn) { // Verifica si el clic no fue en el botón de cerrar.
        box.classList.add('expanded'); // Añade la clase 'expanded' para expandir la caja.
        chatbotContainer.classList.remove('hidden'); // Muestra el contenedor del chatbot.
        inputContainer.style.display = 'flex'; // Muestra el área de entrada.

        // Enviar mensaje de bienvenida solo si no se ha enviado antes.
        if (!hasWelcomed) { 
            sendWelcomeMessage(); // Llama a la función para enviar el mensaje de bienvenida.
            hasWelcomed = true; // Cambia la bandera a true después de enviar el mensaje.
        }
    }
});

closeBtn.addEventListener('click', function(e) { // Agrega un evento de clic al botón de cerrar.
    e.stopPropagation(); // Detiene la propagación del evento para que no se active el clic en la caja.
    box.classList.remove('expanded'); // Quita la clase 'expanded' para colapsar la caja.
    chatbotContainer.classList.add('hidden'); // Oculta el contenedor del chatbot.
    inputContainer.style.display = 'none'; // Oculta el área de entrada.
});

// Función para alternar los botones de Enviar y Detener.
function toggleButtons(isSending) { 
    sendBtn.style.display = isSending ? 'none' : 'inline-block'; // Muestra u oculta el botón de enviar.
    stopBtn.style.display = isSending ? 'inline-block' : 'none'; // Muestra u oculta el botón de detener.
}

sendBtn.addEventListener('click', function() { // Agrega un evento de clic al botón de enviar.
    const userMessage = userInput.value.trim(); // Obtiene y limpia el mensaje del usuario.
    if (userMessage) { // Si hay un mensaje válido.
        addMessageToChatbox('You', userMessage); // Agrega el mensaje al historial de chat.
        sendToChatbot(userMessage); // Envía el mensaje al chatbot.
        userInput.value = ''; // Limpia el campo de entrada.
        userInput.style.height = 'auto'; // Restablece la altura del campo de entrada.
        toggleButtons(true); // Muestra el botón de Detener.
    }
});

userInput.addEventListener('input', adjustHeight); // Ajusta la altura del campo de entrada al escribir.

function addMessageToChatbox(sender, message) { // Función para agregar mensajes al historial de chat.
    const messageElement = document.createElement('div'); // Crea un nuevo elemento div para el mensaje.
    messageElement.textContent = message; // Establece el contenido del mensaje.
    messageElement.classList.add('chat-message'); // Añade la clase 'chat-message' al mensaje.

    if (sender === 'You') { // Verifica si el mensaje es del usuario.
        messageElement.classList.add('user-message'); // Añade la clase 'user-message'.
    } else {
        messageElement.classList.add('bot-message'); // Añade la clase 'bot-message' si es del bot.
    }

    chatbox.appendChild(messageElement); // Agrega el mensaje al historial de chat.
    chatbox.scrollTop = chatbox.scrollHeight; // Desplaza el historial de chat hacia abajo.
}

function sendToChatbot(message) { // Función para enviar el mensaje al chatbot.
    fetch('/chatbot', { // Realiza una solicitud POST al endpoint '/chatbot'.
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded', // Establece el tipo de contenido.
        },
        body: new URLSearchParams({
            'message': message // Envía el mensaje como parte del cuerpo de la solicitud.
        })
    })
    .then(response => response.json()) // Convierte la respuesta a JSON.
    .then(data => { // Maneja la respuesta del chatbot.
        if (message.toLowerCase().includes("hola")) { // Verifica si el mensaje incluye "hola".
            typeMessage("¡Hola! ¿En qué puedo ayudarte hoy?"); // Responde con un mensaje de saludo.
        } else {
            typeMessage(data.response); // Responde con el mensaje del chatbot.
        }
        toggleButtons(false); // Oculta el botón de Detener y muestra el de Enviar.
    })
    .catch(error => console.error('Error:', error)); // Maneja errores en la solicitud.
}

function sendWelcomeMessage() { // Función para enviar un mensaje de bienvenida.
    typeMessage("¡Hola! Bienvenido al chatbot. ¿Cómo puedo ayudarte hoy?"); // Envía el mensaje de bienvenida.
}

function typeMessage(message) { // Función para simular la escritura del mensaje.
    let index = 0; // Índice para recorrer el mensaje.
    chatbox.scrollTop = chatbox.scrollHeight; // Desplaza el historial de chat hacia abajo.
    const typingSpeed = 20; // Velocidad de escritura en milisegundos.

    clearTimeout(typingTimeout); // Limpia el temporizador anterior de escritura.
    const messageElement = document.createElement('div'); // Crea un nuevo div para el mensaje que se está escribiendo.
    messageElement.classList.add('chat-message', 'bot-message'); // Añade clases para estilizar el mensaje.
    chatbox.appendChild(messageElement); // Agrega el nuevo mensaje al historial de chat.

    // Mostrar botón de Detener mientras se escribe.
    toggleButtons(true); // Muestra el botón de Detener.
    isTyping = true; // Indica que el chatbot está escribiendo.

    typingInterval = setInterval(() => { // Configura un intervalo para simular la escritura.
        if (index < message.length) { // Mientras haya más caracteres por agregar.
            messageElement.textContent += message.charAt(index); // Agrega el siguiente carácter.
            index++; // Incrementa el índice.
        } else {
            clearInterval(typingInterval); // Limpia el intervalo cuando se ha terminado de escribir.
            toggleButtons(false); // Oculta el botón de Detener.
            isTyping = false; // Indica que el chatbot ya no está escribiendo.
        }
    }, typingSpeed); // Define la velocidad de escritura.
}

stopBtn.addEventListener('click', function() { // Agrega un evento de clic al botón de detener.
    if (isTyping) { // Si el chatbot está escribiendo.
        clearInterval(typingInterval); // Detiene la escritura del mensaje.
        const lastMessageElement = chatbox.lastElementChild; // Obtiene el último mensaje del historial.
        if (lastMessageElement) {
            lastMessageElement.textContent += '...'; // Agrega puntos suspensivos al último mensaje.
        }
        toggleButtons(false); // Vuelve a mostrar el botón de Enviar.
        isTyping = false; // Indica que el chatbot ya no está escribiendo.
    }
});

userInput.addEventListener('keydown', function(event) { // Agrega un evento de tecla al campo de entrada.
    if (event.key === 'Enter') { // Si se presiona la tecla 'Enter'.
        event.preventDefault(); // Previene el comportamiento predeterminado (como enviar un formulario).
        const userMessage = userInput.value.trim(); // Obtiene el mensaje del usuario.
        if (userMessage) { // Si hay un mensaje válido.
            addMessageToChatbox('You', userMessage); // Agrega el mensaje al historial.
            sendToChatbot(userMessage); // Envía el mensaje al chatbot.
            userInput.value = ''; // Limpia el campo de entrada.
            userInput.style.height = 'auto'; // Restablece la altura del campo de entrada.
            toggleButtons(true); // Muestra el botón de Detener.
        }
    }
});

userInput.addEventListener('input', function() { // Ajusta la altura del campo de entrada al escribir.
    this.style.height = 'auto'; // Restablece la altura del campo de entrada.
    this.style.height = `${Math.min(this.scrollHeight, 100)}px`; // Ajusta la altura según el contenido.

    const maxRadius = 50; // Define el radio máximo para bordes redondeados.
    const minRadius = 20; // Define el radio mínimo para bordes redondeados.
    const borderRadius = Math.max(minRadius, maxRadius - (this.scrollHeight / 3)); // Calcula el radio basado en la altura.
    this.style.borderRadius = `${borderRadius}px`; // Aplica el radio calculado al campo de entrada.
});

box.addEventListener('click', function(e) { // Agrega un evento de clic a la caja del chatbot.
    if (e.target !== closeBtn && !e.target.classList.contains('img2') && !e.target.classList.contains('img1')) { // Si no se clicó en el botón de cerrar ni en imágenes específicas.
        box.classList.add('expanded'); // Expande la caja del chatbot.
        chatbotContainer.classList.remove('hidden'); // Muestra el contenedor del chatbot.
        inputContainer.style.display = 'flex'; // Muestra el área de entrada.
    }

    const img2 = document.querySelector('.img2'); // Obtiene el elemento con clase 'img2'.
    const img1 = document.querySelector('.img1'); // Obtiene el elemento con clase 'img1'.
    img2.style.display = 'block'; // Muestra la imagen 'img2'.
    img1.style.display = 'block'; // Muestra la imagen 'img1'.
});

closeBtn.addEventListener('click', function(e) { // Agrega un evento de clic al botón de cierre.
    e.stopPropagation(); // Detiene la propagación del evento para evitar que se dispare el clic en el contenedor.
    box.classList.remove('expanded'); // Remueve la clase 'expanded' de la caja.
    chatbotContainer.classList.add('hidden'); // Añade la clase 'hidden' al contenedor del chatbot para ocultarlo.
    inputContainer.style.display = 'none'; // Oculta el contenedor de entrada.

    const img2 = document.querySelector('.img2'); // Obtiene el elemento con la clase 'img2'.
    const img1 = document.querySelector('.img1'); // Obtiene el elemento con la clase 'img1'.
    img2.style.display = 'block'; // Muestra la imagen 'img2'.
    img1.style.display = 'block'; // Muestra la imagen 'img1'.
});

// Obtiene los elementos del DOM para el carrusel.
var nextBtn = document.querySelector('.next'), // Botón para avanzar al siguiente elemento.
prevBtn = document.querySelector('.prev'), // Botón para retroceder al elemento anterior.
carousel = document.querySelector('.carousel'), // Contenedor del carrusel.
list = document.querySelector('.list'), // Lista de elementos del carrusel.
item = document.querySelectorAll('.item'), // Todos los elementos dentro del carrusel.
runningTime = document.querySelector('.carousel .timeRunning'); // Elemento que muestra el tiempo de ejecución.

let timeRunning = 3000; // Tiempo que cada elemento del carrusel se muestra (en ms).
let timeAutoNext = 7000; // Tiempo para avanzar automáticamente al siguiente elemento (en ms).

nextBtn.onclick = function() { // Evento para avanzar al siguiente elemento.
    showSlider('next'); // Llama a la función para mostrar el siguiente elemento.
};

prevBtn.onclick = function() { // Evento para retroceder al elemento anterior.
    showSlider('prev'); // Llama a la función para mostrar el elemento anterior.
};

let runTimeOut; // Variable para almacenar el temporizador de la animación.

let runNextAuto = setTimeout(() => { // Temporizador para avanzar automáticamente al siguiente elemento.
    nextBtn.click(); // Simula un clic en el botón siguiente.
}, timeAutoNext);

function resetTimeAnimation() { // Función para reiniciar la animación del tiempo.
    runningTime.style.animation = 'none'; // Desactiva la animación.
    runningTime.offsetHeight; /* trigger reflow */ // Fuerza un reflow para reiniciar la animación.
    runningTime.style.animation = null; // Restaura la propiedad de animación.
    runningTime.style.animation = 'runningTime 7s linear 1 forwards'; // Establece la nueva animación.
}

function showSlider(type) { // Función para mostrar el siguiente o anterior elemento del carrusel.
    let sliderItemsDom = list.querySelectorAll('.carousel .list .item'); // Obtiene todos los elementos del carrusel.
    if (type === 'next') { // Si el tipo es 'next', añade el primer elemento al final de la lista.
        list.appendChild(sliderItemsDom[0]);
        carousel.classList.add('next'); // Añade la clase 'next' para animar el carrusel.
    } else { // Si el tipo es 'prev', añade el último elemento al principio de la lista.
        list.prepend(sliderItemsDom[sliderItemsDom.length - 1]);
        carousel.classList.add('prev'); // Añade la clase 'prev' para animar el carrusel.
    }

    clearTimeout(runTimeOut); // Limpia el temporizador de animación anterior.

    runTimeOut = setTimeout(() => { // Establece un nuevo temporizador para quitar las clases de animación.
        carousel.classList.remove('next');
        carousel.classList.remove('prev');
    }, timeRunning); // Duración de la animación.

    clearTimeout(runNextAuto); // Limpia el temporizador automático anterior.
    runNextAuto = setTimeout(() => { // Establece un nuevo temporizador para avanzar automáticamente.
        nextBtn.click(); // Simula un clic en el botón siguiente.
    }, timeAutoNext);

    resetTimeAnimation(); // Reinicia la animación del tiempo.
}

resetTimeAnimation(); // Llama a la función para establecer la animación del tiempo al cargar.

let isTyping = false; // Variable para verificar si el chatbot está escribiendo.
let currentController = null; // Controlador para la solicitud actual.
let typingInterval = null; // Intervalo para controlar la escritura.
let shouldStop = false; // Bandera para indicar si se debe detener la escritura.

// Función mejorada para detener la respuesta.
function stopTyping() {
    shouldStop = true; // Indica que se debe detener la escritura.
    if (currentController) {
        currentController.abort(); // Aborta la solicitud actual.
        currentController = null; // Limpia el controlador.
    }
}

// Función para enviar mensajes al chatbot.
async function sendToChatbot(message) {
    try {
        shouldStop = false; // Restablece la bandera de detener.
        currentController = new AbortController(); // Crea un nuevo controlador para abortar la solicitud.

        // Mostrar que el bot está escribiendo.
        const messageElement = document.createElement('div'); // Crea un nuevo elemento div para el mensaje del bot.
        messageElement.classList.add('chat-message', 'bot-message'); // Añade clases para estilizar el mensaje.
        chatbox.appendChild(messageElement); // Agrega el mensaje al historial de chat.
        
        toggleButtons(true); // Muestra el botón de Detener.
        isTyping = true; // Indica que el bot está escribiendo.

        // Configurar el streaming de la respuesta.
        const response = await fetch('/chatbot', { // Realiza una solicitud POST al endpoint del chatbot.
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', // Establece el tipo de contenido.
            },
            body: new URLSearchParams({ // Envía el mensaje como parte del cuerpo de la solicitud.
                'message': message
            }),
            signal: currentController.signal // Pasa el controlador para abortar la solicitud si es necesario.
        });

        const data = await response.json(); // Convierte la respuesta a JSON.
        const botResponse = data.response; // Obtiene la respuesta del bot.

        // Simular streaming de caracteres.
        for (let i = 0; i < botResponse.length && !shouldStop; i++) { // Itera sobre cada carácter de la respuesta.
            if (shouldStop) { // Si se debe detener.
                messageElement.textContent += '... (Mensaje interrumpido)'; // Indica que el mensaje fue interrumpido.
                break; // Sale del bucle.
            }

            messageElement.textContent += botResponse.charAt(i); // Agrega el carácter al mensaje.
            chatbox.scrollTop = chatbox.scrollHeight; // Desplaza el historial hacia abajo.

            // Espera antes de mostrar el siguiente carácter.
            await new Promise(resolve => setTimeout(resolve, 20)); // Crea una pausa de 20 ms.
        }

    } catch (error) {
        if (error.name === 'AbortError') { // Si el error es por aborto.
            console.log('Respuesta detenida por el usuario'); // Informa que la respuesta fue detenida.
        } else {
            console.error('Error:', error); // Maneja otros errores.
        }
    } finally {
        isTyping = false; // Indica que el bot ya no está escribiendo.
        toggleButtons(false); // Vuelve a mostrar el botón de Enviar.
        currentController = null; // Limpia el controlador.
    }
}

// Event listener para el botón de stop.
stopBtn.addEventListener('click', stopTyping); // Llama a la función para detener la escritura.

function toggleButtons(isSending) { // Función para alternar la visibilidad de los botones.
    sendBtn.style.display = isSending ? 'none' : 'inline-block'; // Muestra u oculta el botón de Enviar.
    stopBtn.style.display = isSending ? 'inline-block' : 'none'; // Muestra u oculta el botón de Detener.
}

if ('ontouchstart' in document.documentElement) { // Verifica si el dispositivo es táctil.
    // Deshabilita el hover en dispositivos táctiles.
    document.querySelectorAll('button').forEach(button => { // Selecciona todos los botones.
        button.addEventListener('touchstart', function() { // Agrega un evento de inicio táctil a cada botón.
            button.style.transition = 'none'; // Evita animaciones hover al tocar.
        });
    });
}

# Importación de librerías
from flask import Flask, render_template, request, jsonify  # Framework web para manejar peticiones HTTP y renderizar templates
from huggingface_hub import InferenceClient  # Cliente para conectarse a un modelo de Hugging Face
import re  # Para realizar operaciones con expresiones regulares
import unidecode  # Para eliminar tildes y normalizar texto
import logging  # Para registrar logs en archivos
import json  # Para trabajar con datos en formato JSON
from datetime import datetime  # Para obtener y manejar fechas y horas
from typing import Dict, List, Any  # Tipado de datos en Python
import nltk  # Natural Language Toolkit para procesamiento de lenguaje natural
from nltk.tokenize import sent_tokenize  # Tokenizador para dividir texto en oraciones
import os  # Para trabajar con el sistema de archivos

# Configuración inicial de NLTK: descarga los recursos necesarios para el procesamiento de lenguaje natural
nltk.download('punkt')  # Descarga un modelo de tokenización de oraciones
nltk.download('averaged_perceptron_tagger')  # Descarga un modelo para etiquetado de partes de la oración
nltk.download('maxent_ne_chunker')  # Descarga un modelo para reconocimiento de entidades nombradas
nltk.download('words')  # Descarga un conjunto de palabras para el procesamiento de lenguaje natural

# Inicialización de la aplicación Flask
app = Flask(__name__, static_folder='static')  # Crea una instancia de Flask con una carpeta estática

# Configuración del cliente de Hugging Face para realizar consultas a un modelo
client = InferenceClient(
    model="mistralai/Mistral-Nemo-Instruct-2407",  # Especifica el modelo a utilizar
    token="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"  # Token de acceso a Hugging Face
)

# Función para configurar el sistema de logging
def setup_logging():
    # Verifica si la carpeta de logs existe, si no, la crea
    if not os.path.exists('static/logs'):
        os.makedirs('static/logs')  # Crea la carpeta 'logs' si no existe
    
    # Configuración básica del logging
    logging.basicConfig(
        filename=f'static/logs/chatbot_{datetime.now().strftime("%Y%m%d")}.log',  # Archivo de log con la fecha actual
        level=logging.INFO,  # Nivel de logging (INFO para mensajes informativos)
        format='%(asctime)s - %(levelname)s - %(message)s'  # Formato de los mensajes de log
    )

# Clase para verificar respuestas y asegurar que coincidan con los datos históricos
class ResponseVerifier:
    def __init__(self, data_dict: dict):
        self.data_dict = data_dict  # Diccionario con datos históricos
        self.confidence_threshold = 0.8  # Umbral de confianza para verificar respuestas

    # Verifica cada oración de la respuesta generada por el modelo
    def verify_response(self, response: str) -> dict:
        sentences = sent_tokenize(response)  # Divide la respuesta en oraciones
        verified_response = {
            'text': response,
            'confidence_score': 0,
            'verified_facts': []  # Lista de hechos verificados
        }

        # Verifica cada oración en función de los datos históricos
        for sentence in sentences:
            matches = self.match_with_data(sentence)  # Busca coincidencias con datos históricos
            if matches:  # Si hay coincidencias
                verified_response['verified_facts'].append({
                    'fact': sentence,
                    'confidence': self.calculate_confidence(matches)  # Calcula la confianza basada en coincidencias
                })

        # Calcula el puntaje general de confianza
        verified_response['confidence_score'] = self.calculate_overall_confidence(
            verified_response['verified_facts']
        )
        return verified_response

    # Busca coincidencias entre una oración y los datos históricos
    def match_with_data(self, fact: str) -> List[str]:
        matches = []
        normalized_fact = normalize_text(fact)  # Normaliza el texto eliminando tildes y haciendo minúsculas
        for key, value in self.data_dict.items():
            # Busca coincidencias entre la clave o el valor del diccionario y la oración
            if normalize_text(key) in normalized_fact or normalize_text(value) in normalized_fact:
                matches.append(value)  # Agrega coincidencias a la lista
        return matches

    # Calcula la confianza de una oración en función de las coincidencias
    @staticmethod
    def calculate_confidence(matches: List[str]) -> float:
        return min(1.0, len(matches) * 0.2)  # Cada coincidencia aumenta la confianza en 0.2, hasta un máximo de 1.0

    # Calcula la confianza general en función de todas las oraciones verificadas
    @staticmethod
    def calculate_overall_confidence(verified_facts: List[dict]) -> float:
        if not verified_facts:
            return 0.0  # Si no hay hechos verificados, devuelve 0.0
        return sum(fact['confidence'] for fact in verified_facts) / len(verified_facts)  # Promedia las confianzas

# Clase para manejar el contexto de la conversación
class ConversationContext:
    def __init__(self):
        self.context_window = []  # Lista para almacenar la ventana de contexto
        self.max_context = 5  # Máximo número de interacciones almacenadas en el contexto

    # Actualiza el contexto de la conversación con las últimas interacciones
    def update_context(self, user_input: str, response: str):
        self.context_window.append({
            'input': user_input,  # Entrada del usuario
            'response': response,  # Respuesta generada
            'timestamp': datetime.now().isoformat()  # Marca de tiempo
        })
        # Mantiene solo las últimas 'max_context' interacciones
        self.context_window = self.context_window[-self.max_context:]

    # Obtiene los mensajes del contexto actual para usarlos en la siguiente interacción
    def get_context_messages(self) -> List[dict]:
        messages = []
        for ctx in self.context_window:
            messages.extend([  # Agrega entradas y respuestas al contexto
                {"role": "user", "content": ctx['input']},
                {"role": "assistant", "content": ctx['response']}
            ])
        return messages

# Función para cargar datos históricos desde un archivo de texto
def load_data_from_txt(file_path: str) -> Dict[str, str]:
    data_dict = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                if ':' in line:  # Verifica si hay un par clave-valor
                    key, value = line.strip().split(':', 1)  # Separa la línea en clave y valor
                    data_dict[key.strip()] = value.strip()  # Almacena los pares clave-valor en el diccionario
        logging.info(f"Datos históricos cargados exitosamente: {len(data_dict)} entradas")  # Log de éxito
    except FileNotFoundError:
        logging.error(f"Archivo no encontrado: {file_path}")  # Log de error si el archivo no existe
    except Exception as e:
        logging.error(f"Error al cargar datos: {str(e)}")  # Log de error para otros problemas
    return data_dict

# Función para normalizar texto (elimina tildes y convierte a minúsculas)
def normalize_text(text: str) -> str:
    return unidecode.unidecode(text.lower())  # Elimina tildes y convierte a minúsculas

# Función para corregir respuestas en función de los datos históricos
def correct_response(response: str, data_dict: Dict[str, str]) -> str:
    normalized_response = normalize_text(response)  # Normaliza la respuesta
    
    # Reemplaza las coincidencias encontradas en la respuesta con los valores del diccionario
    for key, value in data_dict.items():
        normalized_key = normalize_text(key)  # Normaliza la clave
        if re.search(r'\b' + re.escape(normalized_key) + r'\b', normalized_response):  # Busca coincidencias
            response = re.sub(r'\b' + re.escape(key) + r'\b', value, response, flags=re.IGNORECASE)  # Reemplaza con el valor
    return response

# Inicialización de componentes globales
setup_logging()  # Configura el sistema de logs
data_dict = load_data_from_txt("el_salvador.txt")  # Carga los datos históricos desde un archivo
verifier = ResponseVerifier(data_dict)  # Inicializa el verificador de respuestas
context_manager = ConversationContext()  # Inicializa el manejador de contexto

# Mensaje del sistema para guiar al modelo
system_message = (
    "Eres un chatbot experto en la historia de El Salvador. "
    "Responde siempre en español y proporciona respuestas detalladas y precisas "
    "sobre eventos históricos, figuras, símbolos patrios, árbol nacional, ave nacional y fechas relacionadas con El Salvador."
)

# Ruta para la página principal
@app.route('/')
def home():
    return render_template('index.html')  # Renderiza la página de inicio

# Ruta para manejar las consultas del chatbot
@app.route('/chatbot', methods=['POST'])
def chatbot():
    try:
        message = request.form['message']  # Obtiene el mensaje enviado por el usuario
        
        # Prepara los mensajes con el contexto actual
        messages = [{"role": "system", "content": system_message}]  # Mensaje del sistema
        messages.extend(context_manager.get_context_messages())  # Agrega el contexto anterior
        messages.append({"role": "user", "content": message})  # Agrega la entrada del usuario
        
        # Inicializa la respuesta del modelo
        response = ""
        start_time = datetime.now()  # Marca el tiempo de inicio para medir el tiempo de respuesta
        
        # Hace la consulta al modelo de Hugging Face
        for msg in client.chat_completion(
            messages,
            max_tokens=512,
            stream=True,
            temperature=0.8,
            top_p=0.9,
        ):
            token = msg.choices[0].delta.content  # Obtiene los tokens generados en cada paso
            response += token  # Agrega el token a la respuesta
        
        # Verifica y corrige la respuesta utilizando los datos históricos
        verified_response = verifier.verify_response(response)  # Verifica la respuesta
        corrected_response = correct_response(verified_response['text'], data_dict)  # Corrige la respuesta
        
        # Actualiza el contexto con el mensaje del usuario y la respuesta corregida
        context_manager.update_context(message, corrected_response)
        
        # Registra el tiempo de respuesta y los datos relevantes
        elapsed_time = (datetime.now() - start_time).total_seconds()  # Calcula el tiempo transcurrido
        logging.info(
            f"Mensaje: {message} | Respuesta: {corrected_response} | Confianza: {verified_response['confidence_score']} | Tiempo: {elapsed_time:.2f}s"
        )
        
        # Retorna la respuesta corregida como JSON
        return jsonify({"response": corrected_response})
    except Exception as e:
        logging.error(f"Error en el chatbot: {str(e)}")  # Registra errores en el archivo de logs
        return jsonify({"response": "Lo siento, hubo un problema al procesar tu solicitud."})

# Ejecución de la aplicación Flask
if __name__ == "__main__":
    app.run(debug=True)  # Inicia la aplicación en modo de depuración

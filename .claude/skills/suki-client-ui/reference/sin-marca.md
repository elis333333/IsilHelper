# Cuando el cliente no tiene marca

Es el caso más frecuente en pequeñas empresas: un logotipo hecho en Word, tres azules distintos según el documento, ninguna tipografía definida y un membrete que nadie recuerda quién hizo.

**La tentación es rellenar el hueco con la identidad de Suki. No se hace.** El sistema que se construya será el sistema del cliente, no un préstamo temporal: se queda con él cuando el proyecto termine.

## Qué se construye

Un sistema mínimo, neutro y documentado, que el cliente pueda mantener sin ayuda.

### 1. Color de acción

Se le presentan **dos o tres opciones sobrias**, siempre aplicadas a una pantalla real del sistema —no como muestras de color sueltas—. Un cliente que no tiene criterio de marca tampoco sabe elegir un HEX en abstracto, pero sí reconoce cuál de dos pantallas le parece más su empresa.

Criterios de la propuesta:

- Verificado a AA sobre el fondo antes de mostrarlo. Ninguna opción presentada falla contraste.
- Sobrio: azules, verdes oscuros, grises azulados. Nada saturado que canse a las ocho horas.
- **Ninguno de la paleta de Suki.** El script avisa si se cuela.
- Si el negocio ya usa un color de hecho —el de la fachada, el del uniforme, el de la camioneta—, empezar por ahí. A menudo hay marca aunque no haya manual.

### 2. Neutros

Rampa neutra pura, once pasos, fondo claro por defecto. Es lo que espera quien abre un sistema de gestión, y es lo que mejor se imprime cuando el cliente saque un reporte.

### 3. Tipografía

Una sola familia, de sistema o de código abierto, con licencia clara y verificada. Se documenta cuál y bajo qué licencia.

Inter es una opción legítima aquí porque es neutra, gratuita y está diseñada para pantalla. **No porque sea la de Suki**, y así se explica si el cliente pregunta. Montserrat no se usa: es tipografía de marca de Suki.

Si el cliente ya usa una tipografía de forma consistente en su papelería, esa manda.

### 4. Forma

Un solo valor de radio en todo el sistema. Sin criterio de marca, cualquier valor entre 0 y 6 px es defendible; lo que no es defendible es que los botones tengan uno y las tarjetas otro.

Sin sombras, sin degradados: es lo que mejor envejece y lo que mejor se ve en pantallas baratas, que son las que hay en un almacén.

## Qué se entrega

- `tokens-cliente.css` completo, en el repositorio del cliente, con el origen de cada valor anotado.
- Una página del documento de entrega que explique en lenguaje de negocio: qué color es el de acción, dónde se usa, y por qué no conviene cambiarlo sin verificar el contraste.
- Los archivos de logotipo tal como los tenga el cliente, colocados según sus limitaciones reales.

## Lo que no se hace

- **No se rediseña el logotipo del cliente**, salvo que lo contrate. Se coloca lo que hay, con la dignidad que se pueda: sobre un contenedor sólido si no contrasta, en tamaño suficiente para que se lea.
- **No se le dice que su marca está mal.** Se le dice qué necesita el sistema para funcionar bien y se le ofrece resolverlo como un trabajo aparte, si le interesa.
- **No se firma el sistema como si fuera de Suki.** La única firma es la línea acordada del pie.
- No se usan los cinco puntos, ni el tagline, ni ningún recurso gráfico de Suki como «detalle» del sistema.

## La conversación

Cuando el cliente pregunta «¿y de qué color lo hacemos?», la respuesta no es «del que quieras» ni «yo elijo». Es enseñarle dos pantallas y preguntarle cuál se parece más a su empresa. En dos minutos hay decisión, y es suya.

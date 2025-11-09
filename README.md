# Pokedex 2.0
## Desarrollado por: Juan Estevan Sinitave

Aplicación desarrollada con React + TypeScript, inspirada en la estética retro de una Pokédex clásica.
Permite consultar información de Pokémon por nombre o número en la Pokédex, y navegar entre dos vistas interactivas:

- Vista Pokédex: muestra la interfaz tipo consola con controles, pantalla y detalles del Pokémon (altura, peso, tipos, descripción, etc.).
- Vista Álbum: organiza todos los Pokémon en un formato de tarjetas (5x3 por página), mostrando su nombre, tipo e imagen oficial.
Puedes desplazarte entre páginas con flechas laterales.
---
### Funcionalidades principales

- Búsqueda por nombre o número de Pokédex.

- Visualización del sprite oficial, descripción y tipos del Pokémon.

- Detección de entradas inválidas con aparición especial de “Missigno”.

- Exploración completa de las 1025 especies de la Pokédex.

- Dos modos de visualización: Pokédex clásica y Álbum.

- Sistema de paginación fluido con cache local para mejorar el rendimiento.

- Diseño responsive y temática retro Game Boy.
---
Toda la información (sprites, nombres, tipos, descripciones y cadenas evolutivas) proviene de la PokeAPI, una API pública de Pokémon mantenida por la comunidad: https://pokeapi.co/ 

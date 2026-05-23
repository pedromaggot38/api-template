import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

const loadDocComponent = (fileName) => {
  const filePath = path.resolve('src/docs', fileName);
  return fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    : {};
};

const authDocumentation = loadDocComponent('auth.json');
const meDocumentation = loadDocComponent('me.json');
const usersDocumentation = loadDocComponent('users.json');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Boilerplate API Prime',
      version: '1.0.0',
      description:
        'Documentação automatizada da API de gerenciamento de usuários, sessões e uploads híbridos.',
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Ambiente Local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Insira seu token para interagir com rotas autenticadas.',
        },
      },
    },
    paths: {
      ...authDocumentation,
      ...meDocumentation,
      ...usersDocumentation,
    },
  },
  apis: [],
};

const specs = swaggerJsdoc(options);

const uiOptions = {
  swaggerOptions: {
    docExpansion: 'list',
    defaultModelsExpandDepth: -1,
    filter: false,
  },
  customSiteTitle: 'API Prime - Documentação',
  customCssUrl:
    'https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.1/themes/3.x/theme-material.css',
  customCss: `
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui .info { margin: 30px 0 !important; }
    .swagger-ui .opblock .opblock-summary { padding: 12px 20px !important; border-radius: 6px !important; }
  `,
};

export { swaggerUi, specs, uiOptions };

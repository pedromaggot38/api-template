import fs from 'fs';
import path from 'path';

/**
 * Retorna a URL pública de um arquivo baseado no provedor configurado
 * @param {Object} file - O objeto req.file injetado pelo Multer
 * @param {string} folder - Pasta de destino conceitual (ex: 'avatars', 'products')
 * @returns {string} URL final que será salva no banco de dados
 */
export const getFileUrl = (file, folder = 'misc') => {
  if (!file) return null;

  if (process.env.STORAGE_PROVIDER === 'cloud') {
    const baseUrl =
      process.env.CLOUDFRONT_URL ||
      process.env.AWS_BUCKET_URL ||
      'https://cdn.suaempresa.com';
    return `${baseUrl}/${folder}/${file.filename}`;
  }

  return `/public/${folder}/${file.filename}`;
};

const deleteLocalFile = (fileUrl) => {
  try {
    const relativePath = fileUrl.replace(/^\/public\//, '');
    const absolutePath = path.resolve('uploads', relativePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.error(`[Storage Local] Erro ao deletar arquivo: ${error.message}`);
  }
};

const deleteCloudFile = async (fileUrl) => {
  try {
    console.log(`[Storage Cloud] Gatilho disparado para apagar: ${fileUrl}`);
  } catch (error) {
    console.error(`[Storage Cloud] Erro ao deletar arquivo: ${error.message}`);
  }
};

export const deleteFile = (fileUrl) => {
  if (!fileUrl) return;

  if (process.env.STORAGE_PROVIDER === 'cloud') {
    deleteCloudFile(fileUrl);
  } else {
    deleteLocalFile(fileUrl);
  }
};

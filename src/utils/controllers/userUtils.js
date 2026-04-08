/**
 * Transforma um identificador (UUID ou Username) em um objeto 'where' do Prisma
 * @param {string} identifier - O ID ou Username do usuário
 * @returns {Object} Objeto formatado para a cláusula 'where'
 */
export const parseUserIdentifier = (identifier) => {
  if (!identifier) return {};

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    );

  return isUUID
    ? { id: identifier }
    : { username: identifier.trim().toLowerCase() };
};

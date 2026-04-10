import AppError from '../appError.js';

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

/**
 * Valida se um usuário tem permissão para agir sobre outro com base na role
 * @param {string} performerRole - Role de quem executa a ação
 * @param {string} targetRole - Role de quem recebe a ação
 * @throws {AppError} 403 se a hierarquia for violada
 */
export const validateRoleHierarchy = (performerRole, targetRole) => {
  const rolesPriority = {
    root: 100,
    admin: 80,
    user: 10,
  };

  const performerPower = rolesPriority[performerRole] || 0;
  const targetPower = rolesPriority[targetRole] || 0;

  if (performerRole === 'root') return;

  if (performerPower <= targetPower) {
    throw new AppError(
      `Sua role (${performerRole}) não tem permissão para gerenciar um ${targetRole}.`,
      403,
    );
  }
};

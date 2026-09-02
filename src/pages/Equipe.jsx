import React from 'react';
import { StaffModule } from '../components/staff/StaffModule';

/**
 * Página/Módulo de Gestão Operacional da Equipe do Bar (src/pages/Equipe.jsx)
 * Focado exclusivamente nas rotinas da equipe de atendimento, bar e cozinha:
 * - Escala e Turnos de Trabalho (Planner diário e por data)
 * - Cadastro de Colaboradores Operacionais (Garçom, Barman, Cozinha, Caixa, etc.)
 * - Valores de Diárias, Horários, Presenças e Funções
 */
export const Equipe = (props) => {
  return <StaffModule {...props} />;
};

export default Equipe;

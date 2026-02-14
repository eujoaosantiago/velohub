// Importe os serviços que você já criou.
// ATENÇÃO: Verifique se os caminhos (@/...) batem com onde você salvou os arquivos.

import { customerService } from '@/domains/customers/services/customerService'; // Exemplo de caminho
import { vehicleService } from '@/domains/vehicles/services/vehicleService';   // Exemplo de caminho
import { storeExpenseService } from '@/domains/expenses/services/storeExpenseService';          // Exemplo de caminho

export const ApiService = {
  // O operador "..." (spread) pega todas as funções de cada serviço
  // e joga dentro do ApiService.
  ...customerService,
  ...vehicleService,
  ...storeExpenseService,

  // Função legada que existia no seu arquivo original (mesmo vazia)
  seedInitialData: async () => {},
};
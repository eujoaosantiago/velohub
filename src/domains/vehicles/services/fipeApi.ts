
export interface FipeBrand {
  codigo: string;
  nome: string;
}

export interface FipeModel {
  codigo: string;
  nome: string;
}

export interface FipeYear {
  codigo: string;
  nome: string;
}

export interface FipeDetails {
  Valor: string;
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  SiglaCombustivel: string;
}

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1/carros';

// Fallback brands with CORRECT IDs for Parallelum API
const FALLBACK_BRANDS: FipeBrand[] = [
    { codigo: '1', nome: 'Acura' },
    { codigo: '2', nome: 'Agrale' },
    { codigo: '3', nome: 'Alfa Romeo' },
    { codigo: '4', nome: 'AM General' },
    { codigo: '5', nome: 'Asia Motors' },
    { codigo: '6', nome: 'Audi' },
    { codigo: '7', nome: 'BMW' },
    { codigo: '8', nome: 'BRM' },
    { codigo: '9', nome: 'Bugre' },
    { codigo: '10', nome: 'Cadillac' },
    { codigo: '11', nome: 'CBT Jipe' },
    { codigo: '12', nome: 'Chrysler' },
    { codigo: '13', nome: 'Citroën' },
    { codigo: '14', nome: 'Cross Lander' },
    { codigo: '15', nome: 'Daewoo' },
    { codigo: '16', nome: 'Daihatsu' },
    { codigo: '17', nome: 'Dodge' },
    { codigo: '18', nome: 'Engesa' },
    { codigo: '19', nome: 'Envemo' },
    { codigo: '20', nome: 'Ferrari' },
    { codigo: '21', nome: 'Fiat' },
    { codigo: '22', nome: 'Ford' },
    { codigo: '23', nome: 'GM - Chevrolet' },
    { codigo: '24', nome: 'Gurgel' },
    { codigo: '25', nome: 'Honda' },
    { codigo: '26', nome: 'Hyundai' },
    { codigo: '27', nome: 'Isuzu' },
    { codigo: '28', nome: 'Jaguar' },
    { codigo: '29', nome: 'Jeep' },
    { codigo: '30', nome: 'Kia Motors' },
    { codigo: '31', nome: 'Lada' },
    { codigo: '32', nome: 'Lamborghini' },
    { codigo: '33', nome: 'Land Rover' },
    { codigo: '34', nome: 'Lexus' },
    { codigo: '35', nome: 'Lotus' },
    { codigo: '36', nome: 'Maserati' },
    { codigo: '37', nome: 'Matra' },
    { codigo: '38', nome: 'Mazda' },
    { codigo: '39', nome: 'Mercedes-Benz' },
    { codigo: '40', nome: 'Mercury' },
    { codigo: '41', nome: 'Mitsubishi' },
    { codigo: '42', nome: 'Miura' },
    { codigo: '43', nome: 'Nissan' },
    { codigo: '44', nome: 'Peugeot' },
    { codigo: '45', nome: 'Plymouth' },
    { codigo: '46', nome: 'Pontiac' },
    { codigo: '47', nome: 'Porsche' },
    { codigo: '48', nome: 'Renault' },
    { codigo: '49', nome: 'Rover' },
    { codigo: '50', nome: 'Saab' },
    { codigo: '51', nome: 'Saturn' },
    { codigo: '52', nome: 'Seat' },
    { codigo: '53', nome: 'Subaru' },
    { codigo: '54', nome: 'Suzuki' },
    { codigo: '55', nome: 'TAC' },
    { codigo: '56', nome: 'Toyota' }, // Sometimes 57, checking robustness
    { codigo: '57', nome: 'Troller' },
    { codigo: '59', nome: 'VW - VolksWagen' },
    { codigo: '60', nome: 'Volvo' },
    { codigo: '161', nome: 'Chery' },
    { codigo: '189', nome: 'Aston Martin' },
    { codigo: '190', nome: 'Bentley' },
    { codigo: '195', nome: 'JAC' },
    { codigo: '199', nome: 'Tesla' }
];

// Fallback Models for major brands to ensure usability if API fails
const FALLBACK_MODELS: Record<string, FipeModel[]> = {
    '59': [ // VW
        { codigo: '1', nome: 'Amarok' }, { codigo: '2', nome: 'Fox' }, { codigo: '3', nome: 'Gol' }, { codigo: '4', nome: 'Golf' }, { codigo: '5', nome: 'Jetta' }, { codigo: '6', nome: 'Nivus' }, { codigo: '7', nome: 'Polo' }, { codigo: '8', nome: 'Saveiro' }, { codigo: '9', nome: 'T-Cross' }, { codigo: '10', nome: 'Tiguan' }, { codigo: '11', nome: 'Up!' }, { codigo: '12', nome: 'Virtus' }, { codigo: '13', nome: 'Voyage' }
    ],
    '23': [ // GM
        { codigo: '14', nome: 'Agile' }, { codigo: '15', nome: 'Astra' }, { codigo: '16', nome: 'Blazer' }, { codigo: '17', nome: 'Camaro' }, { codigo: '18', nome: 'Captiva' }, { codigo: '19', nome: 'Celta' }, { codigo: '20', nome: 'Classic' }, { codigo: '21', nome: 'Cobalt' }, { codigo: '22', nome: 'Corsa' }, { codigo: '23', nome: 'Cruze' }, { codigo: '24', nome: 'Equinox' }, { codigo: '25', nome: 'Meriva' }, { codigo: '26', nome: 'Montana' }, { codigo: '27', nome: 'Onix' }, { codigo: '28', nome: 'Prisma' }, { codigo: '29', nome: 'S10' }, { codigo: '30', nome: 'Spin' }, { codigo: '31', nome: 'Tracker' }, { codigo: '32', nome: 'Trailblazer' }, { codigo: '33', nome: 'Vectra' }, { codigo: '34', nome: 'Zafira' }
    ],
    '21': [ // Fiat
        { codigo: '35', nome: '500' }, { codigo: '36', nome: 'Argo' }, { codigo: '37', nome: 'Bravo' }, { codigo: '38', nome: 'Cronos' }, { codigo: '39', nome: 'Doblo' }, { codigo: '40', nome: 'Ducato' }, { codigo: '41', nome: 'Fiorino' }, { codigo: '42', nome: 'Freemont' }, { codigo: '43', nome: 'Grand Siena' }, { codigo: '44', nome: 'Idea' }, { codigo: '45', nome: 'Linea' }, { codigo: '46', nome: 'Mobi' }, { codigo: '47', nome: 'Palio' }, { codigo: '48', nome: 'Pulse' }, { codigo: '49', nome: 'Punto' }, { codigo: '50', nome: 'Siena' }, { codigo: '51', nome: 'Stilo' }, { codigo: '52', nome: 'Strada' }, { codigo: '53', nome: 'Toro' }, { codigo: '54', nome: 'Uno' }
    ],
    '22': [ // Ford
        { codigo: '55', nome: 'Bronco' }, { codigo: '56', nome: 'EcoSport' }, { codigo: '57', nome: 'Edge' }, { codigo: '58', nome: 'Fiesta' }, { codigo: '59', nome: 'Focus' }, { codigo: '60', nome: 'Fusion' }, { codigo: '61', nome: 'Ka' }, { codigo: '62', nome: 'Maverick' }, { codigo: '63', nome: 'Mustang' }, { codigo: '64', nome: 'Ranger' }, { codigo: '65', nome: 'Territory' }
    ],
    '25': [ // Honda
        { codigo: '66', nome: 'City' }, { codigo: '67', nome: 'Civic' }, { codigo: '68', nome: 'CR-V' }, { codigo: '69', nome: 'Fit' }, { codigo: '70', nome: 'HR-V' }, { codigo: '71', nome: 'WR-V' }
    ],
    '26': [ // Hyundai
        { codigo: '72', nome: 'Azera' }, { codigo: '73', nome: 'Creta' }, { codigo: '74', nome: 'Elantra' }, { codigo: '75', nome: 'HB20' }, { codigo: '76', nome: 'HB20S' }, { codigo: '77', nome: 'HB20X' }, { codigo: '78', nome: 'i30' }, { codigo: '79', nome: 'ix35' }, { codigo: '80', nome: 'Santa Fe' }, { codigo: '81', nome: 'Sonata' }, { codigo: '82', nome: 'Tucson' }, { codigo: '83', nome: 'Veloster' }
    ],
    '56': [ // Toyota (Fallback Code 56)
        { codigo: '84', nome: 'Camry' }, { codigo: '85', nome: 'Corolla' }, { codigo: '86', nome: 'Corolla Cross' }, { codigo: '87', nome: 'Etios' }, { codigo: '88', nome: 'Hilux' }, { codigo: '89', nome: 'Prius' }, { codigo: '90', nome: 'RAV4' }, { codigo: '91', nome: 'SW4' }, { codigo: '92', nome: 'Yaris' }
    ],
    '57': [ // Toyota (API Code 57)
        { codigo: '84', nome: 'Camry' }, { codigo: '85', nome: 'Corolla' }, { codigo: '86', nome: 'Corolla Cross' }, { codigo: '87', nome: 'Etios' }, { codigo: '88', nome: 'Hilux' }, { codigo: '89', nome: 'Prius' }, { codigo: '90', nome: 'RAV4' }, { codigo: '91', nome: 'SW4' }, { codigo: '92', nome: 'Yaris' }
    ],
    '44': [ // Peugeot
        { codigo: '93', nome: '2008' }, { codigo: '94', nome: '207' }, { codigo: '95', nome: '208' }, { codigo: '96', nome: '3008' }, { codigo: '97', nome: '307' }, { codigo: '98', nome: '308' }, { codigo: '99', nome: '408' }
    ],
    '48': [ // Renault
        { codigo: '100', nome: 'Captur' }, { codigo: '101', nome: 'Clio' }, { codigo: '102', nome: 'Duster' }, { codigo: '103', nome: 'Fluence' }, { codigo: '104', nome: 'Kwid' }, { codigo: '105', nome: 'Logan' }, { codigo: '106', nome: 'Master' }, { codigo: '107', nome: 'Oroch' }, { codigo: '108', nome: 'Sandero' }, { codigo: '109', nome: 'Stepway' }
    ],
    '13': [ // Citroen
        { codigo: '110', nome: 'Aircross' }, { codigo: '111', nome: 'C3' }, { codigo: '112', nome: 'C4' }, { codigo: '113', nome: 'C4 Cactus' }, { codigo: '114', nome: 'C4 Lounge' }, { codigo: '115', nome: 'Xsara Picasso' }
    ],
    '30': [ // Kia
        { codigo: '116', nome: 'Cerato' }, { codigo: '117', nome: 'Picanto' }, { codigo: '118', nome: 'Sorento' }, { codigo: '119', nome: 'Soul' }, { codigo: '120', nome: 'Sportage' }
    ],
    '41': [ // Mitsubishi
        { codigo: '121', nome: 'ASX' }, { codigo: '122', nome: 'Eclipse Cross' }, { codigo: '123', nome: 'L200' }, { codigo: '124', nome: 'Lancer' }, { codigo: '125', nome: 'Outlander' }, { codigo: '126', nome: 'Pajero' }
    ],
    '43': [ // Nissan
        { codigo: '127', nome: 'Frontier' }, { codigo: '128', nome: 'Kicks' }, { codigo: '129', nome: 'Livina' }, { codigo: '130', nome: 'March' }, { codigo: '131', nome: 'Sentra' }, { codigo: '132', nome: 'Tiida' }, { codigo: '133', nome: 'Versa' }
    ],
    '29': [ // Jeep
        { codigo: '134', nome: 'Cherokee' }, { codigo: '135', nome: 'Commander' }, { codigo: '136', nome: 'Compass' }, { codigo: '137', nome: 'Grand Cherokee' }, { codigo: '138', nome: 'Renegade' }, { codigo: '139', nome: 'Wrangler' }
    ]
};

export const FipeApi = {
  getBrands: async (): Promise<FipeBrand[]> => {
    try {
      const response = await fetch(`${BASE_URL}/marcas`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return Array.isArray(data) ? data : FALLBACK_BRANDS;
    } catch (error) {
      console.warn("API Fipe instável, usando lista offline.", error);
      return FALLBACK_BRANDS;
    }
  },

  getModels: async (brandId: string): Promise<FipeModel[]> => {
    try {
      const response = await fetch(`${BASE_URL}/marcas/${brandId}/modelos`);
      if (!response.ok) {
          // Retry for Toyota common ID change
          if (brandId === '56') {
             const retry = await fetch(`${BASE_URL}/marcas/57/modelos`);
             if (retry.ok) {
                 const data = await retry.json();
                 return Array.isArray(data.modelos) ? data.modelos : [];
             }
          }
          throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return Array.isArray(data.modelos) ? data.modelos : [];
    } catch (error) {
      console.warn("API Fipe (Modelos) instável, verificando fallback...", error);
      // Return fallback models if available for this brand
      if (FALLBACK_MODELS[brandId]) {
          return FALLBACK_MODELS[brandId];
      }
      return [];
    }
  },

  getYears: async (brandId: string, modelId: string): Promise<FipeYear[]> => {
    try {
      const response = await fetch(`${BASE_URL}/marcas/${brandId}/modelos/${modelId}/anos`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching FIPE years", error);
      // Fallback years usually impossible without model context, return empty
      return [];
    }
  },

  getDetails: async (brandId: string, modelId: string, yearId: string): Promise<FipeDetails | null> => {
    try {
      const response = await fetch(`${BASE_URL}/marcas/${brandId}/modelos/${modelId}/anos/${yearId}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error("Error fetching FIPE details", error);
      return null;
    }
  }
};




import { useEffect, useMemo, useState } from 'react';
import { Buyer, Expense, Vehicle } from '@/shared/types';
import {
  fetchCepInfo,
  getBrazilDateISO,
  isValidCPF,
  maskCPF,
  maskCurrencyInput,
  normalizeDate,
  parseCurrencyInput,
  parseISODate,
} from '@/shared/lib/utils';
import { sanitizeInput } from '@/shared/lib/security';
import { maskPlate } from '@/domains/vehicles/utils';

type SaleData = {
  price: string;
  date: string;
  method: string;
  paymentAmountText: string;
  paymentMethodDetail: string;
  paymentDateDetail: string;
  commission: string;
  commissionTo: string;
  warrantyTime: string;
  warrantyKm: string;
  buyerName: string;
  buyerCpf: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerCep: string;
  buyerStreet: string;
  buyerNumber: string;
  buyerNeighborhood: string;
  buyerCity: string;
  buyerState: string;
  tradeIn: {
    make: string;
    model: string;
    version: string;
    yearFab: string;
    yearModel: string;
    plate: string;
    renavam: string;
    chassis: string;
    color: string;
    km: string;
    value: string;
  };
};

type UseSaleFormParams = {
  vehicle: Vehicle;
  allVehicles: Vehicle[];
  formData: Vehicle;
  setFormData: React.Dispatch<React.SetStateAction<Vehicle>>;
  onUpdate: (updatedVehicle: Vehicle) => Promise<void>;
  onCreateTradeIn?: (tradeInVehicle: Vehicle) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error') => void;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSaleSuccess: React.Dispatch<React.SetStateAction<boolean>>;
};

export const useSaleForm = ({
  vehicle,
  allVehicles,
  formData,
  setFormData,
  onUpdate,
  onCreateTradeIn,
  showToast,
  setIsSaving,
  setShowSaleSuccess,
}: UseSaleFormParams) => {
  const calculateDefaultCommission = () => {
    if (vehicle.saleCommission && vehicle.saleCommission > 0) return vehicle.saleCommission;
    return vehicle.expenses.filter((e) => e.category === 'salary').reduce((acc, curr) => acc + curr.amount, 0);
  };

  const getDefaultCommissionTo = () => {
    if (vehicle.saleCommissionTo) return vehicle.saleCommissionTo;
    const lastSalaryExpense = vehicle.expenses.filter((e) => e.category === 'salary').pop();
    return lastSalaryExpense?.employeeName || '';
  };

  const [saleData, setSaleData] = useState<SaleData>(() => ({
    price: maskCurrencyInput(
      (vehicle.soldPrice ?? vehicle.expectedSalePrice ?? 0) * 100
        ? ((vehicle.soldPrice ?? vehicle.expectedSalePrice ?? 0) * 100).toString()
        : '0'
    ),
    commission: maskCurrencyInput((calculateDefaultCommission() * 100).toString()),
    commissionTo: getDefaultCommissionTo(),
    date: normalizeDate(vehicle.soldDate),
    method: vehicle.paymentMethod || 'Pix / Transferencia',
    buyerName: vehicle.buyer?.name || '',
    buyerCpf: vehicle.buyer?.cpf || '',
    buyerPhone: vehicle.buyer?.phone || '',
    buyerEmail: vehicle.buyer?.email || '',
    buyerCep: vehicle.buyer?.cep || '',
    buyerStreet: vehicle.buyer?.street || '',
    buyerNumber: vehicle.buyer?.number || '',
    buyerNeighborhood: vehicle.buyer?.neighborhood || '',
    buyerCity: vehicle.buyer?.city || '',
    buyerState: vehicle.buyer?.state || '',
    paymentAmountText: vehicle.paymentDetails?.amountText || '',
    paymentMethodDetail: vehicle.paymentDetails?.methodDetail || '',
    paymentDateDetail: vehicle.paymentDetails?.paymentDateDetail || '',
    warrantyTime: vehicle.warrantyDetails?.time || '90 dias',
    warrantyKm: vehicle.warrantyDetails?.km || '3000 km',
    tradeIn: {
      make: '',
      model: '',
      version: '',
      yearFab: new Date().getFullYear().toString(),
      yearModel: new Date().getFullYear().toString(),
      plate: '',
      renavam: '',
      chassis: '',
      color: '',
      km: '',
      value: '',
    },
  }));

  useEffect(() => {
    setSaleData((prev) => ({
      ...prev,
      date: vehicle.soldDate ? normalizeDate(vehicle.soldDate) : getBrazilDateISO(),
    }));
  }, [vehicle.id, vehicle.soldDate]);

  const isSold = formData.status === 'sold';

  const handleBuyerCepBlur = async () => {
    if (isSold) return;
    try {
      const info = await fetchCepInfo(saleData.buyerCep);
      if (!info) return;
      setSaleData((prev) => ({
        ...prev,
        buyerStreet: prev.buyerStreet || info.street,
        buyerNeighborhood: prev.buyerNeighborhood || info.neighborhood,
        buyerCity: prev.buyerCity || info.city,
        buyerState: prev.buyerState || info.state,
      }));
    } catch (err) {
      console.error('CEP lookup failed', err);
    }
  };

  const handleCpfChange = (val: string) => {
    const masked = maskCPF(val);
    setSaleData((prev) => ({ ...prev, buyerCpf: masked }));

    if (masked.length === 14) {
      const cleanCpf = masked.replace(/\D/g, '');
      const existingCustomer = allVehicles
        .filter((v) => v.buyer?.cpf?.replace(/\D/g, '') === cleanCpf)
        .sort((a, b) => (parseISODate(b.soldDate)?.getTime() || 0) - (parseISODate(a.soldDate)?.getTime() || 0))[0];

      if (existingCustomer && existingCustomer.buyer) {
        setSaleData((prev) => ({
          ...prev,
          buyerName: existingCustomer.buyer!.name,
          buyerPhone: existingCustomer.buyer!.phone,
          buyerCep: existingCustomer.buyer!.cep || '',
          buyerStreet: existingCustomer.buyer!.street || '',
          buyerNumber: existingCustomer.buyer!.number || '',
          buyerNeighborhood: existingCustomer.buyer!.neighborhood || '',
          buyerCity: existingCustomer.buyer!.city || '',
          buyerState: existingCustomer.buyer!.state || '',
        }));
      }
    }
  };

  const handleSale = async () => {
    let priceInput = parseCurrencyInput(saleData.price) || 0;
    const tradeInVal = parseCurrencyInput(saleData.tradeIn.value) || 0;

    if (priceInput < 0) return showToast('Valor de venda invalido.', 'error');
    if (priceInput === 0 && saleData.method !== 'Troca + Volta') return showToast('A venda precisa ter um valor.', 'error');

    if (!saleData.buyerName) return showToast('Nome do comprador obrigatorio', 'error');
    if (!saleData.buyerCpf || !isValidCPF(saleData.buyerCpf)) {
      return showToast('CPF invalido ou nao preenchido.', 'error');
    }
    if (
      !saleData.buyerCep ||
      !saleData.buyerStreet ||
      !saleData.buyerNumber ||
      !saleData.buyerNeighborhood ||
      !saleData.buyerCity ||
      !saleData.buyerState
    ) {
      return showToast('Endereco do comprador obrigatorio (CEP, logradouro, numero, bairro, cidade e UF).', 'error');
    }
    if (!saleData.paymentAmountText || !saleData.paymentMethodDetail || !saleData.paymentDateDetail) {
      return showToast('Detalhes de pagamento obrigatorios (valor por extenso, forma e data).', 'error');
    }

    const commissionVal = parseCurrencyInput(saleData.commission);

    let finalSoldPrice = priceInput;
    if (saleData.method === 'Troca + Volta') {
      finalSoldPrice = priceInput + tradeInVal;
    }

    const buyer: Buyer = {
      name: sanitizeInput(saleData.buyerName),
      cpf: sanitizeInput(saleData.buyerCpf),
      phone: sanitizeInput(saleData.buyerPhone),
      email: sanitizeInput(saleData.buyerEmail),
      cep: sanitizeInput(saleData.buyerCep),
      street: sanitizeInput(saleData.buyerStreet),
      number: sanitizeInput(saleData.buyerNumber),
      neighborhood: sanitizeInput(saleData.buyerNeighborhood),
      city: sanitizeInput(saleData.buyerCity),
      state: sanitizeInput(saleData.buyerState),
    };

    let updatedExpenses = [...formData.expenses];

    const existingCommissionSum = updatedExpenses
      .filter((e) => e.category === 'salary')
      .reduce((acc, e) => acc + e.amount, 0);

    const commissionDifference = commissionVal - existingCommissionSum;

    if (commissionDifference > 0.01) {
      const commExpense: Expense = {
        id: Math.random().toString(),
        vehicleId: vehicle.id,
        description: 'Comissao de Venda',
        amount: commissionDifference,
        date: normalizeDate(saleData.date),
        category: 'salary',
        employeeName: saleData.commissionTo || undefined,
      };
      updatedExpenses.push(commExpense);
    }

    const saleUpdate: Partial<Vehicle> = {
      status: 'sold',
      soldPrice: finalSoldPrice,
      soldDate: normalizeDate(saleData.date),
      paymentMethod: saleData.method,
      paymentDetails: {
        amountText: sanitizeInput(saleData.paymentAmountText),
        methodDetail: sanitizeInput(saleData.paymentMethodDetail),
        paymentDateDetail: sanitizeInput(saleData.paymentDateDetail),
      },
      saleCommission: 0,
      saleCommissionTo: saleData.commissionTo,
      buyer,
      warrantyDetails: {
        time: saleData.warrantyTime,
        km: saleData.warrantyKm,
      },
      expenses: updatedExpenses,
    };

    if (saleData.method === 'Troca + Volta') {
      if (!saleData.tradeIn.make || !saleData.tradeIn.model || !saleData.tradeIn.value) {
        return showToast('Preencha os dados do veiculo de troca (Marca, Modelo e Valor).', 'error');
      }
      if (
        !saleData.tradeIn.version ||
        !saleData.tradeIn.yearFab ||
        !saleData.tradeIn.yearModel ||
        !saleData.tradeIn.plate ||
        !saleData.tradeIn.renavam ||
        !saleData.tradeIn.chassis ||
        !saleData.tradeIn.color ||
        !saleData.tradeIn.km
      ) {
        return showToast('Preencha todos os dados do veiculo de troca (versao, anos, placa, renavam, chassi, cor e KM).', 'error');
      }
      saleUpdate.tradeInInfo = {
        make: sanitizeInput(saleData.tradeIn.make),
        model: sanitizeInput(saleData.tradeIn.model),
        version: sanitizeInput(saleData.tradeIn.version),
        yearFab: sanitizeInput(saleData.tradeIn.yearFab),
        yearModel: sanitizeInput(saleData.tradeIn.yearModel),
        plate: maskPlate(saleData.tradeIn.plate),
        renavam: sanitizeInput(saleData.tradeIn.renavam),
        chassis: sanitizeInput(saleData.tradeIn.chassis),
        color: sanitizeInput(saleData.tradeIn.color),
        km: sanitizeInput(saleData.tradeIn.km),
        value: tradeInVal,
      };
    }

    try {
      setIsSaving(true);
      await onUpdate({ ...vehicle, ...saleUpdate });

      if (saleData.method === 'Troca + Volta' && onCreateTradeIn) {
        const tradeInVehicle: Vehicle = {
          id: Math.random().toString(),
          storeId: vehicle.storeId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          make: sanitizeInput(saleData.tradeIn.make),
          model: sanitizeInput(saleData.tradeIn.model),
          version: sanitizeInput(saleData.tradeIn.version) || 'Entrada via Troca',
          year: parseInt(saleData.tradeIn.yearModel) || parseInt(saleData.tradeIn.yearFab) || new Date().getFullYear(),
          plate: maskPlate(saleData.tradeIn.plate),
          km: parseInt(saleData.tradeIn.km) || 0,
          fuel: 'Flex',
          transmission: 'Automatico',
          color: sanitizeInput(saleData.tradeIn.color),
          status: 'available',
          purchasePrice: tradeInVal,
          purchaseDate: normalizeDate(saleData.date),
          expectedSalePrice: tradeInVal * 1.2,
          fipePrice: 0,
          photos: [],
          expenses: [],
        };
        await onCreateTradeIn(tradeInVehicle);
      }

      setFormData((prev) => ({ ...prev, ...saleUpdate }));
      setShowSaleSuccess(true);
    } catch (err) {
      console.error(err);
      showToast('Erro ao processar venda.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isCpfValid = useMemo(() => saleData.buyerCpf.length === 14 && isValidCPF(saleData.buyerCpf), [saleData.buyerCpf]);
  const isCpfInvalid = useMemo(() => saleData.buyerCpf.length === 14 && !isValidCPF(saleData.buyerCpf), [saleData.buyerCpf]);
  const hasCommissionInput = useMemo(() => parseCurrencyInput(saleData.commission) > 0, [saleData.commission]);

  return {
    saleData,
    setSaleData,
    isCpfValid,
    isCpfInvalid,
    hasCommissionInput,
    calculateDefaultCommission,
    handleCpfChange,
    handleBuyerCepBlur,
    handleSale,
  };
};

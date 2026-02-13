import { useCallback, useEffect, useState } from 'react';
import { Vehicle } from '@/shared/types';
import { FipeApi, FipeBrand, FipeModel, FipeYear } from '@/domains/vehicles/services/fipeApi';
import { getBestModelPrefix, splitModelVersion } from '@/domains/vehicles/utils';

type FipeData = {
  brands: FipeBrand[];
  models: FipeModel[];
  years: FipeYear[];
};

type FipeSelection = {
  brand: string;
  model: string;
  year: string;
};

type UseFipeSearchParams = {
  isNew: boolean;
  setFormData: React.Dispatch<React.SetStateAction<Vehicle>>;
  showToast: (message: string, type: 'success' | 'error') => void;
};

export const useFipeSearch = ({ isNew, setFormData, showToast }: UseFipeSearchParams) => {
  const [useFipeSearch, setUseFipeSearch] = useState(true);
  const [fipeData, setFipeData] = useState<FipeData>({ brands: [], models: [], years: [] });
  const [fipeSelection, setFipeSelection] = useState<FipeSelection>({ brand: '', model: '', year: '' });
  const [isLoadingFipe, setIsLoadingFipe] = useState(false);

  const loadBrands = useCallback(async () => {
    setIsLoadingFipe(true);
    try {
      const brands = await FipeApi.getBrands();
      setFipeData((prev) => ({ ...prev, brands }));
    } catch (e) {
      showToast('Erro ao carregar tabela FIPE.', 'error');
    } finally {
      setIsLoadingFipe(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isNew || (useFipeSearch && fipeData.brands.length === 0)) {
      void loadBrands();
    }
  }, [isNew, useFipeSearch, fipeData.brands.length, loadBrands]);

  const handleFipeChange = useCallback(
    async (type: 'brand' | 'model' | 'year', value: string) => {
      setFipeSelection((prev) => ({ ...prev, [type]: value }));
      setIsLoadingFipe(true);

      if (type === 'brand') {
        const models = await FipeApi.getModels(value);
        setFipeData((prev) => ({ ...prev, models, years: [] }));
        setFipeSelection((prev) => ({ ...prev, model: '', year: '' }));
        const brandName = fipeData.brands.find((b) => b.codigo === value)?.nome || '';
        setFormData((prev) => ({ ...prev, make: brandName }));
      } else if (type === 'model') {
        const years = await FipeApi.getYears(fipeSelection.brand, value);
        setFipeData((prev) => ({ ...prev, years }));
        setFipeSelection((prev) => ({ ...prev, year: '' }));
        const modelName = fipeData.models.find((m) => m.codigo === value)?.nome || '';
        setFormData((prev) => ({ ...prev, model: modelName }));
      } else if (type === 'year') {
        const details = await FipeApi.getDetails(fipeSelection.brand, fipeSelection.model, value);
        if (details) {
          const fipeVal = parseFloat(details.Valor.replace(/[^\d,]/g, '').replace(',', '.'));
          const modelName = fipeData.models.find((m) => m.codigo === fipeSelection.model)?.nome || '';
          const fullName = details.Modelo || modelName;
          const bestPrefix = modelName || getBestModelPrefix(fullName, fipeData.models);
          let model = modelName;
          let version = '';

          if (bestPrefix && fullName.toLowerCase().startsWith(bestPrefix.toLowerCase()) && fullName.length > bestPrefix.length) {
            model = bestPrefix;
            version = fullName.slice(bestPrefix.length).trim();
          } else {
            const split = splitModelVersion(fullName);
            model = split.model || modelName;
            version = split.version;
          }

          setFormData((prev) => ({
            ...prev,
            year: details.AnoModelo,
            fuel: details.Combustivel,
            fipePrice: fipeVal,
            model: model || prev.model,
            version: version || fullName,
          }));
        }
      }
      setIsLoadingFipe(false);
    },
    [fipeData.brands, fipeData.models, fipeSelection.brand, fipeSelection.model, setFormData]
  );

  return {
    useFipeSearch,
    setUseFipeSearch,
    fipeData,
    fipeSelection,
    isLoadingFipe,
    loadBrands,
    handleFipeChange,
  };
};

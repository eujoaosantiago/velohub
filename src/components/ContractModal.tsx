
import React from 'react';
import { Vehicle } from '@/shared/types';
import { formatCurrency } from '@/shared/lib/utils';
import { Button } from './ui/Button';
import { Printer, X, FileText, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { AuthService } from '@/domains/auth/services/authService';

interface ContractModalProps {
  vehicle: Vehicle;
  storeName: string;
  storeCnpj?: string;
  storeCity?: string;
  storeState?: string;
  onClose: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({ vehicle, storeName, storeCnpj, storeCity, storeState, onClose }) => {
  const user = AuthService.getCurrentUser();
  
  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
  });
  const location = storeCity && storeState ? `${storeCity}-${storeState}` : 'Local';

  // --- TEMPLATE PROCESSING ---
  const defaultText = `Pelo presente instrumento particular, de um lado a VENDEDORA identificada no cabeçalho, e de outro lado o COMPRADOR qualificado abaixo, têm entre si justo e contratado o seguinte:

1. OBJETO: A VENDEDORA vende ao COMPRADOR o veículo descrito neste documento, pelo preço e condições acordados.

2. ESTADO DO VEÍCULO: O veículo é entregue no estado em que se encontra, tendo sido examinado pelo COMPRADOR, que declarou estar ciente de suas condições de conservação e funcionamento.

3. GARANTIA: A VENDEDORA oferece garantia legal de motor e câmbio pelo prazo de {garantia_tempo} ou {garantia_km}, o que ocorrer primeiro, contados a partir da data de entrega do veículo, nos termos do Código de Defesa do Consumidor.

4. RESPONSABILIDADE: O COMPRADOR assume, a partir desta data, toda e qualquer responsabilidade civil e criminal por quaisquer infrações cometidas com o veículo.

5. PAGAMENTO: O pagamento será realizado conforme descrito no resumo da venda.`;

  const template = user?.contractTemplate || defaultText;

  // Function to replace variables
  const processContract = (text: string) => {
      let processed = text;
      const replacements: Record<string, string> = {
          '{loja_nome}': storeName,
          '{loja_cnpj}': storeCnpj || '',
          '{comprador_nome}': vehicle.buyer?.name || '',
          '{comprador_cpf}': vehicle.buyer?.cpf || '',
          '{comprador_cep}': vehicle.buyer?.cep || '',
          '{comprador_logradouro}': vehicle.buyer?.street || '',
          '{comprador_numero}': vehicle.buyer?.number || '',
          '{veiculo_marca}': vehicle.make,
          '{veiculo_modelo}': vehicle.model,
          '{veiculo_versao}': vehicle.version,
          '{veiculo_ano}': vehicle.year.toString(),
          '{veiculo_placa}': vehicle.plate || '',
          '{veiculo_cor}': vehicle.color,
          '{veiculo_km}': vehicle.km.toLocaleString(),
          '{garantia_tempo}': vehicle.warrantyDetails?.time || '90 dias',
          '{garantia_km}': vehicle.warrantyDetails?.km || '3.000 km',
          '{valor_venda}': formatCurrency(vehicle.soldPrice || 0),
          '{pagamento_valor_extenso}': vehicle.paymentDetails?.amountText || '',
          '{pagamento_forma_detalhada}': vehicle.paymentDetails?.methodDetail || '',
          '{pagamento_data}': vehicle.paymentDetails?.paymentDateDetail || '',
          '{troca_marca}': vehicle.tradeInInfo?.make || '',
          '{troca_modelo}': vehicle.tradeInInfo?.model || '',
          '{troca_versao}': vehicle.tradeInInfo?.version || '',
          '{troca_ano_fab}': vehicle.tradeInInfo?.yearFab || '',
          '{troca_ano_modelo}': vehicle.tradeInInfo?.yearModel || '',
          '{troca_placa}': vehicle.tradeInInfo?.plate || '',
          '{troca_renavam}': vehicle.tradeInInfo?.renavam || '',
          '{troca_chassi}': vehicle.tradeInInfo?.chassis || '',
          '{troca_cor}': vehicle.tradeInInfo?.color || '',
          '{troca_km}': vehicle.tradeInInfo?.km || '',
          '{troca_valor}': vehicle.tradeInInfo ? formatCurrency(vehicle.tradeInInfo.value) : ''
      };

      Object.entries(replacements).forEach(([key, value]) => {
          // Compatibility fix: use split/join instead of replaceAll
          processed = processed.split(key).join(value);
      });

      return processed;
  };

  const contractBody = processContract(template);
      const buyerAddress = vehicle.buyer?.street && vehicle.buyer?.number && vehicle.buyer?.cep
          ? `${vehicle.buyer.street}, nº ${vehicle.buyer.number}${vehicle.buyer?.neighborhood ? `, ${vehicle.buyer.neighborhood}` : ''}${vehicle.buyer?.city ? `, ${vehicle.buyer.city}` : ''}${vehicle.buyer?.state ? `/${vehicle.buyer.state}` : ''}, CEP ${vehicle.buyer.cep}`
          : '';

  return (
    <div className="contract-print fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto print:p-0 print:bg-white print:static">
    <div className="bg-white text-slate-900 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none flex flex-col max-h-[90vh] print:max-h-none print:overflow-visible">
        
        {/* Header Actions (Hidden on Print) */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center print:hidden shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                    <FileText size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Contrato de Compra e Venda</h3>
                    <p className="text-xs text-slate-500">Revise os dados antes de imprimir.</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} size="sm" className="border-slate-300 text-slate-600 hover:bg-slate-200">
                    <X size={18} />
                </Button>
                <Button onClick={handlePrint} size="sm" icon={<Printer size={18} />}>
                    Gerar PDF / Imprimir
                </Button>
            </div>
        </div>

        {/* Contract Content - Scrollable */}
        <div className="p-12 md:p-16 overflow-y-auto print:overflow-visible print:p-0 print:text-sm font-serif leading-relaxed text-justify flex-1">
            
            <div className="text-center mb-10">
                <h1 className="text-2xl font-bold uppercase mb-2">Contrato de Compra e Venda de Veículo</h1>
                <p className="text-slate-500 font-sans text-sm">
                    {storeName} {storeCnpj ? `- CNPJ: ${storeCnpj}` : ''} <br/>
                    {storeCity && storeState ? `${storeCity}, ${storeState}` : ''}
                </p>
            </div>

            <div className="space-y-6">
                {/* HEADERS */}
                <p>
                    <strong>VENDEDOR:</strong> {storeName}, pessoa jurídica de direito privado, {storeCnpj ? `inscrita no CNPJ sob nº ${storeCnpj},` : ''} com sede em {location}, doravante denominada VENDEDORA.
                </p>

                <p>
                    <strong>COMPRADOR:</strong> {vehicle.buyer?.name}, portador(a) do CPF nº {vehicle.buyer?.cpf}{buyerAddress ? `, residente e domiciliado(a) à ${buyerAddress}` : ', residente e domiciliado(a) nesta cidade'}, doravante denominado(a) COMPRADOR.
                </p>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg my-4 font-sans text-sm print:border print:border-black">
                    <p className="font-bold border-b border-slate-300 pb-2 mb-2 uppercase text-slate-600">Objeto (Veículo Vendido)</p>
                    <div className="grid grid-cols-2 gap-4">
                        <p><strong>Marca/Modelo:</strong> {vehicle.make} {vehicle.model} {vehicle.version}</p>
                        <p><strong>Ano/Modelo:</strong> {vehicle.year}</p>
                        <p><strong>Placa:</strong> {vehicle.plate}</p>
                        <p><strong>Cor:</strong> {vehicle.color}</p>
                        <p><strong>Combustível:</strong> {vehicle.fuel}</p>
                        <p><strong>KM Atual:</strong> {vehicle.km.toLocaleString()}</p>
                    </div>
                </div>

                {/* DYNAMIC BODY */}
                <div className="whitespace-pre-wrap">
                    {contractBody}
                </div>

                {/* TRADE IN SECTION (DYNAMICALLY ADDED IF EXISTS) */}
                {vehicle.tradeInInfo && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg my-6 font-sans text-sm print:border print:border-black">
                        <div className="flex items-center gap-2 mb-3 border-b border-slate-300 pb-2 text-slate-700">
                            <ArrowRightLeft size={16} />
                            <span className="font-bold uppercase">Veículo Dado como Parte de Pagamento (Troca)</span>
                        </div>
                        <p className="mb-2">
                            Como parte do pagamento, o COMPRADOR entrega à VENDEDORA o seguinte veículo, livre e desembaraçado de quaisquer ônus:
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <p><strong>Marca/Modelo:</strong> {vehicle.tradeInInfo.make} {vehicle.tradeInInfo.model} {vehicle.tradeInInfo.version || ''}</p>
                            <p><strong>Ano Fab/Mod:</strong> {vehicle.tradeInInfo.yearFab || '-'} / {vehicle.tradeInInfo.yearModel || '-'}</p>
                            <p><strong>Placa:</strong> {vehicle.tradeInInfo.plate}</p>
                            <p><strong>RENAVAM:</strong> {vehicle.tradeInInfo.renavam || '-'}</p>
                            <p><strong>Chassi:</strong> {vehicle.tradeInInfo.chassis || '-'}</p>
                            <p><strong>Cor:</strong> {vehicle.tradeInInfo.color || '-'}</p>
                            <p><strong>KM Atual:</strong> {vehicle.tradeInInfo.km || '-'}</p>
                            <p><strong>Valor de Avaliação (Acordado):</strong> {formatCurrency(vehicle.tradeInInfo.value)}</p>
                        </div>
                        <p className="mt-2 text-xs italic text-slate-500">
                            * O COMPRADOR declara que o veículo da troca não possui multas, restrições ou débitos pendentes até a presente data.
                        </p>
                    </div>
                )}

                {/* PAYMENT SUMMARY */}
                <p>
                    <strong>RESUMO DO PAGAMENTO:</strong>
                    <br/>
                    Valor Total da Venda: <strong>{formatCurrency(vehicle.soldPrice || 0)}</strong>
                    {vehicle.paymentDetails?.amountText && (
                        <span> (por extenso: {vehicle.paymentDetails.amountText})</span>
                    )}
                    <br />
                    Forma de pagamento: {vehicle.paymentDetails?.methodDetail || vehicle.paymentMethod}
                    <br />
                    Data do pagamento: {vehicle.paymentDetails?.paymentDateDetail || 'Não informado'}
                    {vehicle.paymentMethod === 'Troca + Volta' && vehicle.tradeInInfo && (
                        <span> (Sendo {formatCurrency(vehicle.soldPrice! - vehicle.tradeInInfo.value)} em dinheiro + {formatCurrency(vehicle.tradeInInfo.value)} em veículo de troca)</span>
                    )}.
                </p>

                <p className="mt-8">
                    E por estarem justos e contratados, assinam o presente instrumento em 02 (duas) vias de igual teor e forma.
                </p>

                <p className="text-right mt-8">
                    {location}, {today}.
                </p>

                <div className="mt-20 grid grid-cols-2 gap-12 text-center font-sans">
                    <div className="border-t border-black pt-2">
                        <p className="font-bold">{storeName}</p>
                        {storeCnpj && <p className="text-xs">{storeCnpj}</p>}
                        <p className="text-xs">Vendedor</p>
                    </div>
                    <div className="border-t border-black pt-2">
                        <p className="font-bold">{vehicle.buyer?.name}</p>
                        <p className="text-xs">Comprador</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions (Hidden on Print) */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 print:hidden shrink-0 flex justify-end">
             <Button variant="ghost" onClick={onClose} className="text-slate-600 hover:text-slate-900" icon={<ArrowLeft size={16} />}>
                 Voltar / Fechar
             </Button>
        </div>
      </div>
    </div>
  );
};




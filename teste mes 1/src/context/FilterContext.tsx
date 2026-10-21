'use client';

import React, { createContext, useContext, useState } from 'react';

export type PeriodOption = 'today' | '7days' | '30days' | '60days';

interface FilterContextType {
  period: PeriodOption;
  setPeriod: (period: PeriodOption) => void;
  selectedMachineId: string;
  setSelectedMachineId: (id: string) => void;
  selectedShiftId: string;
  setSelectedShiftId: (id: string) => void;
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  selectedOperatorId: string;
  setSelectedOperatorId: (id: string) => void;
  getDateRange: () => { start: Date; end: Date };
}

const FilterContext = createContext<FilterContextType>({} as FilterContextType);

export const FilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [period, setPeriod] = useState<PeriodOption>('30days');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('all');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('all');

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (period === '7days') {
      start.setDate(end.getDate() - 7);
    } else if (period === '30days') {
      start.setDate(end.getDate() - 30);
    } else if (period === '60days') {
      start.setDate(end.getDate() - 60);
    }

    return { start, end };
  };

  return (
    <FilterContext.Provider
      value={{
        period,
        setPeriod,
        selectedMachineId,
        setSelectedMachineId,
        selectedShiftId,
        setSelectedShiftId,
        selectedProductId,
        setSelectedProductId,
        selectedOperatorId,
        setSelectedOperatorId,
        getDateRange,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);

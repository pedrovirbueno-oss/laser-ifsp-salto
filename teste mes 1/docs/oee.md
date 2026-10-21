# NEXO Production — OEE Mathematical Engine & Formulas

## Formulas
- **Availability** = $\frac{\text{Operational Run Time}}{\text{Planned Time}}$
  - $\text{Run Time} = \max(0, \text{Planned Time} - \text{Total Downtime})$
- **Performance** = $\frac{\text{Actual Output Produced}}{\text{Theoretical Expected Output}}$
  - $\text{Theoretical Expected Output} = \text{Target Output per Hour} \times \text{Run Time (Hours)}$
- **Quality** = $\frac{\text{Good Output (Produced - Scrap)}}{\text{Total Output Produced}}$
- **Overall OEE** = $\text{Availability} \times \text{Performance} \times \text{Quality}$

## Data Sufficiency & Bound Clamping Rules
- If Planned Operational Time is 0 or no production records exist, the engine returns `sufficientData: false` and displays "Dados insuficientes para cálculo".
- All percentages are clamped strictly between 0% and 100%.

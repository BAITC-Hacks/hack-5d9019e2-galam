import type {
  DistrictState,
  Domain,
  IndicatorId,
  OfficialDataset,
} from "../simulation/types";

export function indicatorChanges(
  states: readonly DistrictState[],
  dataset: OfficialDataset,
) {
  return states
    .flatMap((state) => {
      const baseline = dataset.districts.find((d) => d.id === state.id)!;
      return (Object.keys(dataset.indicators) as IndicatorId[]).map(
        (indicatorId) => ({
          districtId: state.id,
          indicatorId,
          before: baseline.indicators[indicatorId],
          after: state.indicators[indicatorId],
          delta:
            state.indicators[indicatorId] - baseline.indicators[indicatorId],
        }),
      );
    })
    .filter((change) => change.delta !== 0)
    .sort((a, b) => b.delta - a.delta);
}

export function domainSummaries(
  states: readonly DistrictState[],
  dataset: OfficialDataset,
) {
  return (Object.keys(dataset.domain_weights) as Domain[]).map((domain) => {
    const value = states.reduce((citySum, state) => {
      const share = dataset.districts.find(
        (district) => district.id === state.id,
      )!.population_share;
      const districtValue =
        (Object.keys(dataset.indicators) as IndicatorId[])
          .filter((id) => dataset.indicators[id].domain === domain)
          .reduce(
            (sum, id) =>
              sum + state.indicators[id] * dataset.indicators[id].weight,
            0,
          ) / dataset.domain_weights[domain];
      return citySum + districtValue * share;
    }, 0);
    return { domain, value };
  });
}

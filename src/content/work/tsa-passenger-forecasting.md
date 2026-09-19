---
title: TSA Passenger Volume Forecasting
summary: Forecasting air-travel demand with careful feature engineering and temporal validation.
status: Forecasting experiment · ML@Purdue
featured: true
tags: [Forecasting, Feature engineering, Temporal validation]
---

## A model of when people travel

This project explored forecasting U.S. air-travel demand from historical TSA passenger counts. I worked on the pipeline as part of ML@Purdue’s Kalshi Trading Team, where passenger-volume forecasts helped investigate potentially mispriced contracts.

Rather than immediately reaching for a neural time-series model, I used gradient-boosted trees and spent time on the features: calendar structure, proximity to holidays, economic indicators, and search-intent data.

## Keeping the evaluation honest

Forecasts need to work with information available at prediction time. Walk-forward validation kept the evaluation aligned with that constraint, instead of randomly mixing observations from different points in time.

The final XGBoost model achieved **6.76% mean absolute percentage error (MAPE)**. The evaluation also exposed failure modes around college move-in periods, major holidays, and unexpected disruptions.

## What stayed with me

The useful lesson was how far a relatively simple model can go when the features and validation reflect the problem. The remaining errors were also instructive: calendar patterns explain a lot, but they cannot anticipate every reason that travel demand changes.

<!-- Authoring TODO: Add a verified public repository. Record the exact evaluation period before expanding the results section. -->

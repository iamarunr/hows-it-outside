# Third-party notices

The Outside? source code is MIT-licensed (see [LICENSE](LICENSE)). That license covers this repository's code only. It does not relicense the data, dependencies or services below, and it does not grant any right to use a hosted API.

## Code shipped to the browser

| Package | Version | License |
|---|---|---|
| react | 19.3.1 | MIT |
| react-dom (with scheduler 0.28.0) | 19.3.1 | MIT |
| zod (`zod/mini`) | 4.6.7 | MIT |
| astro (island hydration runtime) | 7.4.11 | MIT |
| @astrojs/react | 7.1.8 | MIT |
| Bebas Neue font, © 2019 The Bebas Neue Project Authors (@fontsource/bebas-neue, latin subset, self-hosted) | 5.3.0 | SIL Open Font License 1.1 |

Full license texts are in each package under `node_modules/` after `npm ci`. Build and test tools (TypeScript, Vitest, Playwright, ESLint and plugins, axe-core) are development dependencies and are not shipped.

No third-party icons, images or scripts are included. The only third-party font is Bebas Neue (above), served from the site itself, with no font CDN. Status marks and the favicon are original to this project.

## Data and services

- **Weather data:** [Open-Meteo](https://open-meteo.com/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution is shown in the site footer, About and Methodology pages.
- **Location search:** Open-Meteo Geocoding API, using data from [GeoNames](https://www.geonames.org/) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).
- **Hosted API access:** Open-Meteo's free hosted API is for non-commercial use under its [terms](https://open-meteo.com/en/terms) and [pricing](https://open-meteo.com/en/pricing). Whether your deployment qualifies is your responsibility; commercial use needs a paid plan and a server-side proxy (see docs/02-ARCHITECTURE.md §8). Recheck attribution requirements before each release.

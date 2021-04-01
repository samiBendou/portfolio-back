// Geolocation
import fetch from 'node-fetch';

const euCountriesApi = "https://restcountries.eu/rest/v2/alpha";
const frGeolocationApi = "https://geo.api.gouv.fr";

async function fetchCountry(location) {
    const response = await fetch(`${euCountriesApi}/${location.country}`);
    const json = await response.json();
    return json["name"];
}

async function fetchCounty(location) {
    const response = await fetch(`${frGeolocationApi}/departements?code=${location.zip.slice(0, 2)}`);
    const json = await response.json();
    return json[0]["nom"];
}

async function fetchCity(location) {
    const response = await fetch(`${frGeolocationApi}/communes?codePostal=${location.zip}&format=json`);
    const json = await response.json();
    return json[0]["nom"];
}

async function fetchTimelineLocation(items) {
    return await Promise.all(items.map(item => fetchLocation(item.location)));
}

export async function fetchLocation(location) {
    return await Promise.all([fetchCountry(location), fetchCounty(location), fetchCity(location)]);
}

export async function fetchUserLocations(user) {
    return await Promise.all([fetchLocation(user.location), fetchTimelineLocation(user.items.timeline)])
}
